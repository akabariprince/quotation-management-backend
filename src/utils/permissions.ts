export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",

  CATEGORY_VIEW: "category:view",
  CATEGORY_CREATE: "category:create",
  CATEGORY_EDIT: "category:edit",
  CATEGORY_DELETE: "category:delete",

  QUOTATION_TYPE_VIEW: "quotation_type:view",
  QUOTATION_TYPE_CREATE: "quotation_type:create",
  QUOTATION_TYPE_EDIT: "quotation_type:edit",
  QUOTATION_TYPE_DELETE: "quotation_type:delete",

  QUOTATION_MODEL_VIEW: "quotation_model:view",
  QUOTATION_MODEL_CREATE: "quotation_model:create",
  QUOTATION_MODEL_EDIT: "quotation_model:edit",
  QUOTATION_MODEL_DELETE: "quotation_model:delete",

  WOOD_VIEW: "wood:view",
  WOOD_CREATE: "wood:create",
  WOOD_EDIT: "wood:edit",
  WOOD_DELETE: "wood:delete",

  POLISH_VIEW: "polish:view",
  POLISH_CREATE: "polish:create",
  POLISH_EDIT: "polish:edit",
  POLISH_DELETE: "polish:delete",

  FABRIC_VIEW: "fabric:view",
  FABRIC_CREATE: "fabric:create",
  FABRIC_EDIT: "fabric:edit",
  FABRIC_DELETE: "fabric:delete",

  QUOTATION_VIEW: "quotation:view",
  QUOTATION_CREATE: "quotation:create",
  QUOTATION_EDIT: "quotation:edit",
  QUOTATION_DELETE: "quotation:delete",

  CUSTOMER_VIEW: "customer:view",
  CUSTOMER_CREATE: "customer:create",
  CUSTOMER_EDIT: "customer:edit",
  CUSTOMER_DELETE: "customer:delete",

  PROJECT_VIEW: "project:view",
  PROJECT_CREATE: "project:create",
  PROJECT_EDIT: "project:edit",
  PROJECT_DELETE: "project:delete",
  PROJECT_APPROVE: "project:approve",
  PROJECT_SEND: "project:send",

  USER_VIEW: "user:view",
  USER_CREATE: "user:create",
  USER_EDIT: "user:edit",
  USER_DELETE: "user:delete",

  ROLE_VIEW: "role:view",
  ROLE_CREATE: "role:create",
  ROLE_EDIT: "role:edit",
  ROLE_DELETE: "role:delete",

  REPORT_VIEW: "report:view",

  APPROVAL_VIEW: "approval:view",
  APPROVAL_MANAGE: "approval:manage",

  EMAIL_LOG_VIEW: "email_log:view",

  OTP_REQUEST: "otp:request",
  OTP_VERIFY: "otp:verify",

  MASTER_VIEW: "master:view",
  MASTER_MANAGE: "master:manage",

  IMAGE_EDIT: "image:edit",
  QUANTITY_EDIT: "quantity:edit",
  DISCOUNT_EDIT: "discount:edit",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const DEFAULT_ROLE_PERMISSIONS = {
  admin: [...ALL_PERMISSIONS],

  master: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_EDIT,
    PERMISSIONS.QUOTATION_TYPE_VIEW,
    PERMISSIONS.QUOTATION_TYPE_CREATE,
    PERMISSIONS.QUOTATION_TYPE_EDIT,
    PERMISSIONS.QUOTATION_MODEL_VIEW,
    PERMISSIONS.QUOTATION_MODEL_CREATE,
    PERMISSIONS.QUOTATION_MODEL_EDIT,
    PERMISSIONS.WOOD_VIEW,
    PERMISSIONS.WOOD_CREATE,
    PERMISSIONS.WOOD_EDIT,
    PERMISSIONS.POLISH_VIEW,
    PERMISSIONS.POLISH_CREATE,
    PERMISSIONS.POLISH_EDIT,
    PERMISSIONS.FABRIC_VIEW,
    PERMISSIONS.FABRIC_CREATE,
    PERMISSIONS.FABRIC_EDIT,
    PERMISSIONS.QUOTATION_VIEW,
    PERMISSIONS.QUOTATION_CREATE,
    PERMISSIONS.QUOTATION_EDIT,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.PROJECT_SEND,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.MASTER_VIEW,
    PERMISSIONS.MASTER_MANAGE,
    PERMISSIONS.OTP_REQUEST,
    PERMISSIONS.OTP_VERIFY,
    PERMISSIONS.IMAGE_EDIT,
    PERMISSIONS.QUANTITY_EDIT,
    PERMISSIONS.DISCOUNT_EDIT,
  ],

  creator: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.QUOTATION_TYPE_VIEW,
    PERMISSIONS.QUOTATION_MODEL_VIEW,
    PERMISSIONS.WOOD_VIEW,
    PERMISSIONS.POLISH_VIEW,
    PERMISSIONS.FABRIC_VIEW,
    PERMISSIONS.QUOTATION_VIEW,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.PROJECT_SEND,
    PERMISSIONS.MASTER_VIEW,
    PERMISSIONS.OTP_REQUEST,
    PERMISSIONS.IMAGE_EDIT,
    PERMISSIONS.QUANTITY_EDIT,
    PERMISSIONS.DISCOUNT_EDIT,
  ],

  data_entry: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.QUOTATION_TYPE_VIEW,
    PERMISSIONS.QUOTATION_MODEL_VIEW,
    PERMISSIONS.WOOD_VIEW,
    PERMISSIONS.POLISH_VIEW,
    PERMISSIONS.FABRIC_VIEW,
    PERMISSIONS.QUOTATION_VIEW,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.MASTER_VIEW,
    PERMISSIONS.IMAGE_EDIT,
    PERMISSIONS.QUANTITY_EDIT,
  ],
};

// Permission labels for frontend display
export const PERMISSION_LABELS: Record<string, string> = {
  "dashboard:view": "View Dashboard",

  "category:view": "View Categories",
  "category:create": "Create Category",
  "category:edit": "Edit Category",
  "category:delete": "Delete Category",

  "quotation_type:view": "View Quotation Types",
  "quotation_type:create": "Create Quotation Type",
  "quotation_type:edit": "Edit Quotation Type",
  "quotation_type:delete": "Delete Quotation Type",

  "quotation_model:view": "View Quotation Models",
  "quotation_model:create": "Create Quotation Model",
  "quotation_model:edit": "Edit Quotation Model",
  "quotation_model:delete": "Delete Quotation Model",

  "wood:view": "View Woods",
  "wood:create": "Create Wood",
  "wood:edit": "Edit Wood",
  "wood:delete": "Delete Wood",

  "polish:view": "View Polishes",
  "polish:create": "Create Polish",
  "polish:edit": "Edit Polish",
  "polish:delete": "Delete Polish",

  "fabric:view": "View Fabrics",
  "fabric:create": "Create Fabric",
  "fabric:edit": "Edit Fabric",
  "fabric:delete": "Delete Fabric",

  "quotation:view": "View Quotations",
  "quotation:create": "Create Quotation",
  "quotation:edit": "Edit Quotation",
  "quotation:delete": "Delete Quotation",

  "customer:view": "View Customers",
  "customer:create": "Create Customer",
  "customer:edit": "Edit Customer",
  "customer:delete": "Delete Customer",

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
  "approval:manage": "Manage Approvals",

  "email_log:view": "View Email Logs",

  "otp:request": "Request OTP",
  "otp:verify": "Verify OTP",

  "master:view": "View Masters",
  "master:manage": "Manage Masters",

  "image:edit": "Edit Images",
  "quantity:edit": "Edit Quantity",
  "discount:edit": "Edit Discount",
};

// Group permissions by category for display
export const PERMISSION_GROUPS: Record<string, string[]> = {
  Dashboard: ["dashboard:view"],
  Categories: [
    "category:view",
    "category:create",
    "category:edit",
    "category:delete",
  ],
  "Quotation Types": [
    "quotation_type:view",
    "quotation_type:create",
    "quotation_type:edit",
    "quotation_type:delete",
  ],
  "Quotation Models": [
    "quotation_model:view",
    "quotation_model:create",
    "quotation_model:edit",
    "quotation_model:delete",
  ],
  Woods: ["wood:view", "wood:create", "wood:edit", "wood:delete"],
  Polishes: ["polish:view", "polish:create", "polish:edit", "polish:delete"],
  Fabrics: ["fabric:view", "fabric:create", "fabric:edit", "fabric:delete"],
  Quotations: [
    "quotation:view",
    "quotation:create",
    "quotation:edit",
    "quotation:delete",
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
  Masters: ["master:view", "master:manage"],
  "Project Fields": ["image:edit", "quantity:edit", "discount:edit"],
};
