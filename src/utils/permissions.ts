// src/utils/permissions.ts

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",

  MASTER_VIEW: "master:view",
  MASTER_CREATE: "master:create",
  MASTER_EDIT: "master:edit",
  MASTER_DELETE: "master:delete",
  MASTER_APPROVE: "master:approve",

  // ─── Customer ─────────────────────────────────────────────────────
  CUSTOMER_VIEW: "customer:view",
  CUSTOMER_CREATE: "customer:create",
  CUSTOMER_EDIT: "customer:edit",
  CUSTOMER_DELETE: "customer:delete",
  CUSTOMER_MANAGE_ALL: "customer:manage_all",  // ← NEW: bypass ownership

  // ─── Project / Transaction ────────────────────────────────────────
  PROJECT_VIEW: "project:view",
  PROJECT_CREATE: "project:create",
  PROJECT_EDIT: "project:edit",
  PROJECT_DELETE: "project:delete",
  PROJECT_APPROVE: "project:approve",
  PROJECT_SEND: "project:send",

  // ─── User Management ─────────────────────────────────────────────
  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_EDIT: "user:edit",
  USER_DELETE: "user:delete",

  // ─── Role Management ─────────────────────────────────────────────
  ROLE_VIEW: "role:view",
  ROLE_CREATE: "role:create",
  ROLE_EDIT: "role:edit",
  ROLE_DELETE: "role:delete",

  // ─── Reports ──────────────────────────────────────────────────────
  REPORT_VIEW: "report:view",

  // ─── Approvals ────────────────────────────────────────────────────
  APPROVAL_VIEW: "approval:view",
  APPROVAL_MANAGE: "approval:manage",

  // ─── Email Logs ───────────────────────────────────────────────────
  EMAIL_LOG_VIEW: "email_log:view",

  // ─── OTP ──────────────────────────────────────────────────────────
  OTP_REQUEST: "otp:request",
  OTP_VERIFY: "otp:verify",

  // ─── Project Field-Level Permissions ──────────────────────────────
  IMAGE_EDIT: "image:edit",
  QUANTITY_EDIT: "quantity:edit",
  DISCOUNT_EDIT: "discount:edit",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// ─── Default Role Permissions ───────────────────────────────────────────

export const DEFAULT_ROLE_PERMISSIONS = {
  admin: [...ALL_PERMISSIONS],    // ← admin gets customer:manage_all automatically

  master: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.MASTER_VIEW,
    PERMISSIONS.MASTER_CREATE,
    PERMISSIONS.MASTER_EDIT,
    PERMISSIONS.MASTER_DELETE,
    PERMISSIONS.MASTER_APPROVE,

    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.CUSTOMER_MANAGE_ALL,  // ← master can manage all customers

    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.PROJECT_SEND,

    PERMISSIONS.REPORT_VIEW,

    PERMISSIONS.OTP_REQUEST,
    PERMISSIONS.OTP_VERIFY,

    PERMISSIONS.IMAGE_EDIT,
    PERMISSIONS.QUANTITY_EDIT,
    PERMISSIONS.DISCOUNT_EDIT,
  ],

  creator: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.MASTER_VIEW,
    PERMISSIONS.MASTER_CREATE,

    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    // NO customer:manage_all → can only edit OWN customers

    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.PROJECT_SEND,

    PERMISSIONS.OTP_REQUEST,

    PERMISSIONS.IMAGE_EDIT,
    PERMISSIONS.QUANTITY_EDIT,
    PERMISSIONS.DISCOUNT_EDIT,
  ],

  data_entry: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.MASTER_VIEW,

    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    // NO customer:edit, NO customer:manage_all → cannot edit at all

    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_CREATE,

    PERMISSIONS.IMAGE_EDIT,
    PERMISSIONS.QUANTITY_EDIT,
  ],
};

// ─── Permission Labels ──────────────────────────────────────────────────

export const PERMISSION_LABELS: Record<string, string> = {
  "dashboard:view": "View Dashboard",

  "master:view": "View Master Data",
  "master:create": "Create Master Data",
  "master:edit": "Edit Master Data",
  "master:delete": "Delete Master Data",
  "master:approve": "Approve / Activate Master Data",

  "customer:view": "View Customers",
  "customer:create": "Create Customer",
  "customer:edit": "Edit Own Customer",          // ← updated label
  "customer:delete": "Delete Own Customer",      // ← updated label
  "customer:manage_all": "Edit/Delete Any Customer",  // ← NEW

  "project:view": "View Projects",
  "project:create": "Create Project",
  "project:edit": "Edit Project",
  "project:delete": "Delete Project",
  "project:approve": "Approve Project",
  "project:send": "Send Project",

  "user:view": "View Users",
  "user:create": "Create User",
  "user:edit": "Edit User",
  "user:delete": "Delete User",

  "role:view": "View Roles",
  "role:create": "Create Role",
  "role:edit": "Edit Role",
  "role:delete": "Delete Role",

  "report:view": "View Reports",

  "approval:view": "View Approvals",
  "approval:manage": "Manage Approvals (Approve/Reject)",

  "email_log:view": "View Email Logs",

  "otp:request": "Request OTP",
  "otp:verify": "Verify OTP",

  "image:edit": "Edit Images in Project",
  "quantity:edit": "Edit Quantity in Project",
  "discount:edit": "Edit Discount in Project",
};

// ─── Permission Groups ─────────────────────────────────────────────────

export const PERMISSION_GROUPS: Record<string, string[]> = {
  Dashboard: ["dashboard:view"],
  "Master Data": [
    "master:view",
    "master:create",
    "master:edit",
    "master:delete",
    "master:approve",
  ],
  Customers: [
    "customer:view",
    "customer:create",
    "customer:edit",
    "customer:delete",
    "customer:manage_all",   // ← NEW in group
  ],
  Projects: [
    "project:view",
    "project:create",
    "project:edit",
    "project:delete",
    "project:approve",
    "project:send",
  ],
  Users: ["user:view", "user:create", "user:edit", "user:delete"],
  Roles: ["role:view", "role:create", "role:edit", "role:delete"],
  Reports: ["report:view"],
  Approvals: ["approval:view", "approval:manage"],
  "Email Logs": ["email_log:view"],
  OTP: ["otp:request", "otp:verify"],
  "Project Fields": ["image:edit", "quantity:edit", "discount:edit"],
};