// src/utils/permissions.ts

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",

  // ─── Master Data (consolidated) ───────────────────────────────────
  MASTER_VIEW: "master:view",
  MASTER_CREATE: "master:create",
  MASTER_EDIT: "master:edit",
  MASTER_DELETE: "master:delete",
  MASTER_APPROVE: "master:approve",

  // ─── Individual entity permissions (DEPRECATED — kept for backend compat) ───
  // These are no longer used in the frontend Masters page.
  // The Masters page uses master:view/create/edit/delete/approve instead.
  // Uncomment if you need per-entity backend route-level control.

  // CATEGORY_VIEW: "category:view",
  // CATEGORY_CREATE: "category:create",
  // CATEGORY_EDIT: "category:edit",
  // CATEGORY_DELETE: "category:delete",

  // QUOTATION_TYPE_VIEW: "quotation_type:view",
  // QUOTATION_TYPE_CREATE: "quotation_type:create",
  // QUOTATION_TYPE_EDIT: "quotation_type:edit",
  // QUOTATION_TYPE_DELETE: "quotation_type:delete",

  // QUOTATION_MODEL_VIEW: "quotation_model:view",
  // QUOTATION_MODEL_CREATE: "quotation_model:create",
  // QUOTATION_MODEL_EDIT: "quotation_model:edit",
  // QUOTATION_MODEL_DELETE: "quotation_model:delete",

  // WOOD_VIEW: "wood:view",
  // WOOD_CREATE: "wood:create",
  // WOOD_EDIT: "wood:edit",
  // WOOD_DELETE: "wood:delete",

  // POLISH_VIEW: "polish:view",
  // POLISH_CREATE: "polish:create",
  // POLISH_EDIT: "polish:edit",
  // POLISH_DELETE: "polish:delete",

  // FABRIC_VIEW: "fabric:view",
  // FABRIC_CREATE: "fabric:create",
  // FABRIC_EDIT: "fabric:edit",
  // FABRIC_DELETE: "fabric:delete",

  // QUOTATION_VIEW: "quotation:view",
  // QUOTATION_CREATE: "quotation:create",
  // QUOTATION_EDIT: "quotation:edit",
  // QUOTATION_DELETE: "quotation:delete",

  // ─── Customer ─────────────────────────────────────────────────────
  CUSTOMER_VIEW: "customer:view",
  CUSTOMER_CREATE: "customer:create",
  CUSTOMER_EDIT: "customer:edit",
  CUSTOMER_DELETE: "customer:delete",

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
  admin: [...ALL_PERMISSIONS],

  master: [
    PERMISSIONS.DASHBOARD_VIEW,

    // Master data — full CRUD + approve
    PERMISSIONS.MASTER_VIEW,
    PERMISSIONS.MASTER_CREATE,
    PERMISSIONS.MASTER_EDIT,
    PERMISSIONS.MASTER_DELETE,
    PERMISSIONS.MASTER_APPROVE,

    // Customer
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,

    // Project
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.PROJECT_SEND,

    // Reports
    PERMISSIONS.REPORT_VIEW,

    // OTP
    PERMISSIONS.OTP_REQUEST,
    PERMISSIONS.OTP_VERIFY,

    // Field-level
    PERMISSIONS.IMAGE_EDIT,
    PERMISSIONS.QUANTITY_EDIT,
    PERMISSIONS.DISCOUNT_EDIT,
  ],

  creator: [
    PERMISSIONS.DASHBOARD_VIEW,

    // Master data — view only + create (pending approval)
    PERMISSIONS.MASTER_VIEW,
    PERMISSIONS.MASTER_CREATE,

    // Customer
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,

    // Project
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.PROJECT_SEND,

    // OTP
    PERMISSIONS.OTP_REQUEST,

    // Field-level
    PERMISSIONS.IMAGE_EDIT,
    PERMISSIONS.QUANTITY_EDIT,
    PERMISSIONS.DISCOUNT_EDIT,
  ],

  data_entry: [
    PERMISSIONS.DASHBOARD_VIEW,

    // Master data — view only
    PERMISSIONS.MASTER_VIEW,

    // Customer
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,

    // Project
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_CREATE,

    // Field-level
    PERMISSIONS.IMAGE_EDIT,
    PERMISSIONS.QUANTITY_EDIT,
  ],
};

// ─── Permission Labels ──────────────────────────────────────────────────

export const PERMISSION_LABELS: Record<string, string> = {
  "dashboard:view": "View Dashboard",

  // Master data
  "master:view": "View Master Data",
  "master:create": "Create Master Data",
  "master:edit": "Edit Master Data",
  "master:delete": "Delete Master Data",
  "master:approve": "Approve / Activate Master Data",

  // Customer
  "customer:view": "View Customers",
  "customer:create": "Create Customer",
  "customer:edit": "Edit Customer",
  "customer:delete": "Delete Customer",

  // Project
  "project:view": "View Projects",
  "project:create": "Create Project",
  "project:edit": "Edit Project",
  "project:delete": "Delete Project",
  "project:approve": "Approve Project",
  "project:send": "Send Project",

  // Users
  "user:view": "View Users",
  "user:create": "Create User",
  "user:edit": "Edit User",
  "user:delete": "Delete User",

  // Roles
  "role:view": "View Roles",
  "role:create": "Create Role",
  "role:edit": "Edit Role",
  "role:delete": "Delete Role",

  // Reports
  "report:view": "View Reports",

  // Approvals
  "approval:view": "View Approvals",
  "approval:manage": "Manage Approvals (Approve/Reject)",

  // Email logs
  "email_log:view": "View Email Logs",

  // OTP
  "otp:request": "Request OTP",
  "otp:verify": "Verify OTP",

  // Field-level
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
