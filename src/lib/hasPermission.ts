import { ROLE_PERMISSIONS } from "@/config/rbac";

export function hasPermission(
  accountType: string,
  permission: string,
): boolean {
  const perms = ROLE_PERMISSIONS[accountType];
  if (!perms) return false;
  return perms.includes(permission as any);
}
