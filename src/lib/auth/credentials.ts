import crypto from "crypto";
import { AccountType, Role } from "@/types";

/**
 * Password hashing.
 *
 * scrypt with a per-user random salt. Passwords are never stored, logged, or
 * compared as strings, and verification is constant time.
 */
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export interface CredentialUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  kycStatus: "UNVERIFIED" | "PENDING" | "VERIFIED";
  salt: string;
  passwordHash: string;
  createdAt: string;
  /** When the real-account risk certification was passed, if ever. */
  riskCertifiedAt: string | null;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  kycStatus: "UNVERIFIED" | "PENDING" | "VERIFIED";
  createdAt: string;
  riskCertifiedAt: string | null;
}

export function hashPassword(password: string, salt: string): string {
  return crypto
    .scryptSync(password.normalize("NFKC"), salt, KEY_LENGTH, SCRYPT_OPTIONS)
    .toString("hex");
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const value = normalizeEmail(email);
  if (!value) return "An email address is required.";
  if (!EMAIL_PATTERN.test(value)) return "That does not look like a valid email address.";
  if (value.length > 254) return "That email address is too long.";
  return null;
}

export function validatePassword(password: string): string | null {
  const value = password || "";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (value.length > 200) return "Password must be under 200 characters.";
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) {
    return "Password must contain at least one letter and one number.";
  }
  return null;
}

export function validateName(name: string): string | null {
  const value = (name || "").trim();
  if (value.length < 2) return "Please enter your name.";
  if (value.length > 80) return "That name is too long.";
  return null;
}

/**
 * In-memory credential store.
 *
 * Passwords live here as salted scrypt hashes and nowhere else. State is
 * process-local, exactly like the rest of the platform's store, so a restart
 * clears accounts — see the note on Supabase persistence in the README of this
 * change.
 */
class CredentialStore {
  private users: CredentialUser[] = [];
  private seeded = false;

  /**
   * Seeds an administrator from the environment when one is configured.
   * The first account created without a seed becomes the administrator, so a
   * fresh deployment can never end up with no way in.
   */
  private seed(): void {
    if (this.seeded) return;
    this.seeded = true;

    const email = normalizeEmail(process.env.DEFAULT_USER_EMAIL || "");
    const password = process.env.DEFAULT_USER_PASSWORD || "";
    const name = process.env.DEFAULT_USER_NAME || "Administrator";

    if (!email || !password) return;

    if (this.users.some((u) => u.email === email)) return;

    const salt = generateSalt();
    this.users.push({
      id: `usr_${crypto.randomUUID()}`,
      email,
      name,
      role: "admin",
      kycStatus: "VERIFIED",
      salt,
      passwordHash: hashPassword(password, salt),
      createdAt: new Date().toISOString(),
      riskCertifiedAt: null,
    });

    console.log(`[auth] seeded administrator account ${email}`);
  }

  count(): number {
    this.seed();
    return this.users.length;
  }

  findByEmail(email: string): CredentialUser | null {
    this.seed();
    const value = normalizeEmail(email);
    return this.users.find((u) => u.email === value) ?? null;
  }

  findById(id: string): CredentialUser | null {
    this.seed();
    return this.users.find((u) => u.id === id) ?? null;
  }

  /**
   * Creates an account. The first account in an empty store is promoted to
   * administrator so a fresh install is administrable.
   */
  create(input: {
    email: string;
    name: string;
    password: string;
  }): { ok: true; user: PublicUser } | { ok: false; error: string } {
    this.seed();

    const emailError = validateEmail(input.email);
    if (emailError) return { ok: false, error: emailError };

    const nameError = validateName(input.name);
    if (nameError) return { ok: false, error: nameError };

    const passwordError = validatePassword(input.password);
    if (passwordError) return { ok: false, error: passwordError };

    const email = normalizeEmail(input.email);

    if (this.users.some((u) => u.email === email)) {
      return { ok: false, error: "An account with that email already exists." };
    }

    const salt = generateSalt();
    const user: CredentialUser = {
      id: `usr_${crypto.randomUUID()}`,
      email,
      name: input.name.trim(),
      role: this.users.length === 0 ? "admin" : "user",
      kycStatus: "UNVERIFIED",
      salt,
      passwordHash: hashPassword(input.password, salt),
      createdAt: new Date().toISOString(),
      riskCertifiedAt: null,
    };

    this.users.push(user);
    return { ok: true, user: toPublic(user) };
  }

  /**
   * Verifies a password.
   *
   * The same generic message is returned for an unknown email and a wrong
   * password so the endpoint cannot be used to enumerate accounts.
   */
  authenticate(email: string, password: string): { ok: true; user: PublicUser } | { ok: false; error: string } {
    const user = this.findByEmail(email);
    const generic = "Those credentials are not valid.";

    if (!user) {
      // Burn comparable time so a missing account is not detectable by timing.
      hashPassword(password || "", generateSalt());
      return { ok: false, error: generic };
    }

    if (!verifyPassword(password || "", user.salt, user.passwordHash)) {
      return { ok: false, error: generic };
    }

    return { ok: true, user: toPublic(user) };
  }

  /** Ensures a platform profile exists for an authenticated identity. */
  ensureUser(input: { id?: string; email: string; name?: string }): PublicUser {
    const email = normalizeEmail(input.email);
    const existing = this.users.find((u) => u.email === email);

    if (existing) {
      return toPublic(existing);
    }

    // Identity came from an external provider (Supabase). There is no local
    // password yet, so the hash is unusable and login must go through that
    // provider.
    const salt = generateSalt();
    const user: CredentialUser = {
      id: input.id || `usr_${crypto.randomUUID()}`,
      email,
      name: (input.name || email.split("@")[0]).slice(0, 80),
      role: this.users.length === 0 ? "admin" : "user",
      kycStatus: "UNVERIFIED",
      salt,
      passwordHash: hashPassword(crypto.randomUUID(), salt),
      createdAt: new Date().toISOString(),
      riskCertifiedAt: null,
    };

    this.users.push(user);
    return toPublic(user);
  }

  /**
   * Records that the caller passed the real-account risk certification.
   *
   * The answers are verified server-side before this is called, so the
   * timestamp reflects a check that actually happened rather than a client
   * assertion.
   */
  certifyRisk(id: string, at: string): PublicUser | null {
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    user.riskCertifiedAt = at;
    return toPublic(user);
  }

  updateRole(id: string, role: Role): PublicUser | null {
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    user.role = role;
    return toPublic(user);
  }

  list(): PublicUser[] {
    this.seed();
    return this.users.map(toPublic);
  }
}

function toPublic(user: CredentialUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    kycStatus: user.kycStatus,
    createdAt: user.createdAt,
    riskCertifiedAt: user.riskCertifiedAt ?? null,
  };
}

const globalCredentials = (globalThis as unknown as { __cryptohubCredentials?: CredentialStore });
if (!globalCredentials.__cryptohubCredentials) {
  globalCredentials.__cryptohubCredentials = new CredentialStore();
}

export const credentials = globalCredentials.__cryptohubCredentials;

/**
 * Convenience wrapper so callers do not have to remember to import the store
 * type. Kept here rather than in a route so every auth path shares it.
 */
export function accountTypeLabel(accountType: AccountType): string {
  return accountType === "REAL" ? "real" : "demo";
}