export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",

  PROFILE_VIEW: "profile:view",
  PROFILE_EDIT: "profile:edit",

  CLIENTS_VIEW: "clients:view",
  CLIENTS_CREATE: "clients:create",
  CLIENTS_EDIT: "clients:edit",
  CLIENTS_DELETE: "clients:delete",

  PRODUCTS_VIEW: "products:view",
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_EDIT: "products:edit",
  PRODUCTS_DELETE: "products:delete",

  SERVICES_VIEW: "services:view",
  SERVICES_CREATE: "services:create",
  SERVICES_EDIT: "services:edit",
  SERVICES_DELETE: "services:delete",

  SALES_VIEW: "sales:view",
  SALES_CREATE: "sales:create",

  FINANCE_VIEW: "finance:view",
  FINANCE_MANAGE: "finance:manage",
  FINANCE_REPORTS: "finance:reports",

  HR_VIEW: "hr:view",
  HR_MANAGE: "hr:manage",

  INVENTORY_VIEW: "inventory:view",
  INVENTORY_MANAGE: "inventory:manage",

  CAMPAIGNS_VIEW: "campaigns:view",
  CAMPAIGNS_CREATE: "campaigns:create",

  DONATIONS_MANAGE: "donations:manage",
  STUDENTS_MANAGE: "students:manage",

  SETTINGS_VIEW: "settings:view",
  SETTINGS_MANAGE: "settings:manage",

  ADMIN_PANEL: "admin:panel",
  ADMIN_USERS: "admin:users",
  ADMIN_BILLING: "admin:billing",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
