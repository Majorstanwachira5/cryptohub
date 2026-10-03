import { Permission, Role } from "@/types";

/**
 * Role to permission mapping.
 *
 * This table is the single authority on what a role may do. Route handlers ask
 * `can(role, permission)`; nothing infers authority from the UI or from a
 * client-supplied flag.
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  user: ["trade:demo", "trade:real", "ledger:read", "analysis:read", "referral:manage"],
  admin: [
    "trade:demo",
    "trade:real",
    "ledger:read",
    "analysis:read",
    "referral:manage",
    "admin:stats",
    "admin:prediction-override",
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function permissionsFor(role: Role): Permission[] {
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

export function isRole(value: unknown): value is Role {
  return value === "user" || value === "admin";
}

/**
 * Trading a given account type requires its own permission, so a future role
 * that may practise but not trade live is expressible without touching routes.
 */
export function permissionForAccount(accountType: "DEMO" | "REAL"): Permission {
  return accountType === "REAL" ? "trade:real" : "trade:demo";
}