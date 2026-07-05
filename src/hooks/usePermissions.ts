"use client";

import { useMemo } from "react";
import { ROLE_PERMISSIONS } from "@/config/rbac";
import type { Permission } from "@/config/permissions";

export function usePermissions(accountType?: string | null) {
  const permissions: Permission[] = useMemo(() => {
    if (!accountType) return [];
    return (ROLE_PERMISSIONS[accountType] as Permission[]) || [];
  }, [accountType]);

  const can = (permission: string): boolean => {
    return permissions.includes(permission as any);
  };

  return { permissions, can };
}
