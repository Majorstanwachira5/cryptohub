import crypto from "crypto";

export interface SessionUser {
  /** Profile id. Matches the `sub` claim. */
  id: string;
  email: string;
  name: string;
  role: string;
  accountType: "DEMO" | "REAL";
}

export interface Session {
  sub: string;
  email: string;
  name: string;
  role: string;
  accountType: "DEMO" | "REAL";
  iat: number;
  exp: number;
}

const ALGORITHM = "sha256";

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error("JWT_SECRET is not configured. Set it in .env before issuing sessions.");
  }
  return value;
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(data: string): string {
  return base64Url(crypto.createHmac(ALGORITHM, secret()).update(data).digest());
}

/**
 * Issues a signed HS256 JWT.
 *
 * The signature is verified on every read, so a token cannot be edited to
 * claim another user's id or escalate a role.
 */
export function signSession(user: SessionUser, ttlSeconds = 60 * 60 * 24 * 7): string {
  const iat = Math.floor(Date.now() / 1000);
  const payload: Session = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    accountType: user.accountType,
    iat,
    exp: iat + ttlSeconds,
  };

  const header = base64Url(JSON.stringify({ alg: ALGORITHM, typ: "JWT" }));
  const body = base64Url(JSON.stringify(payload));
  const data = `${header}.${body}`;

  return `${data}.${sign(data)}`;
}

/**
 * Verifies a token's signature and expiry.
 *
 * Comparison is length-checked first: a naive string compare leaks timing
 * information about the expected signature.
 */
export function verifySession(token: string): Session | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expected = sign(`${header}.${body}`);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload: Session;
  try {
    payload = JSON.parse(fromBase64Url(body));
  } catch {
    return null;
  }

  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
  if (!payload.sub || !payload.email) return null;

  return payload;
}

/**
 * Extracts and verifies the bearer token from a request.
 */
export function readSession(authorization: string | null): Session | null {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (!token || scheme.toLowerCase() !== "bearer") return null;
  return verifySession(token);
}