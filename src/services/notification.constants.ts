export const SETTING_KEYS = {
  emailConfig: "email_config",
  whatsappConfig: "whatsapp_config",
  whatsappTemplates: "whatsapp_templates",
  notificationPreferences: "notification_preferences",
} as const;

export const NOTIFICATION_TYPES = {
  customerOtpVerification: "customer_otp_verification",
  userOtpVerification: "user_otp_verification",
  discountApproval: "discount_approval",
  projectQuotation: "project_quotation",
  customerEnquiry: "customer_enquiry",
  loginNotification: "login_notification",
  masterDataChange: "master_data_change",
  adminNotification: "admin_notification",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export type NotificationChannel = "email" | "whatsapp";

export type NotificationPreferences = Record<
  NotificationType,
  {
    email: boolean;
    whatsapp: boolean;
  }
>;

export interface WhatsAppConfig {
  apiKey: string;
  wabaId: string;
  phoneNumberId: string;
  webhookSecret: string;
}

export type WhatsAppTemplateSettings = Record<NotificationType, string>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  [NOTIFICATION_TYPES.customerOtpVerification]: { email: false, whatsapp: true },
  [NOTIFICATION_TYPES.userOtpVerification]: { email: false, whatsapp: true },
  [NOTIFICATION_TYPES.discountApproval]: { email: true, whatsapp: false },
  [NOTIFICATION_TYPES.projectQuotation]: { email: true, whatsapp: false },
  [NOTIFICATION_TYPES.customerEnquiry]: { email: true, whatsapp: false },
  [NOTIFICATION_TYPES.loginNotification]: { email: true, whatsapp: false },
  [NOTIFICATION_TYPES.masterDataChange]: { email: true, whatsapp: false },
  [NOTIFICATION_TYPES.adminNotification]: { email: true, whatsapp: false },
};

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  apiKey: "",
  wabaId: "",
  phoneNumberId: "",
  webhookSecret: "",
};

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplateSettings = {
  [NOTIFICATION_TYPES.customerOtpVerification]: "",
  [NOTIFICATION_TYPES.userOtpVerification]: "",
  [NOTIFICATION_TYPES.discountApproval]: "",
  [NOTIFICATION_TYPES.projectQuotation]: "",
  [NOTIFICATION_TYPES.customerEnquiry]: "",
  [NOTIFICATION_TYPES.loginNotification]: "",
  [NOTIFICATION_TYPES.masterDataChange]: "",
  [NOTIFICATION_TYPES.adminNotification]: "",
};
