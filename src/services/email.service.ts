// src/services/email.service.ts
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import { env } from "../config/environment";
import { logger } from "../utils/logger";

import { settingService } from "../modules/setting/setting.service";

// ─── Transporter Config Fetcher ──────────────────────────────────────────
const getEmailConfig = async () => {
  const dbConfig = await settingService.getSetting("email_config");
  if (dbConfig) {
    return {
      host: dbConfig.host,
      port: Number(dbConfig.port),
      secure: dbConfig.secure === "true" || dbConfig.secure === true,
      auth: {
        user: dbConfig.user,
        pass: dbConfig.password,
      },
      from: dbConfig.from || dbConfig.user,
    };
  }

  // Fallback to env
  return {
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.password,
    },
    from: env.smtp.from,
  };
};

// ─── Logo ────────────────────────────────────────────────────────────────
const LOGO_PATH = path.join(process.cwd(), "public", "logo.png");
const LOGO_CID = "company-logo@esipl";

// ─── PDF Upload Directory ────────────────────────────────────────────────
const PDF_UPLOAD_DIR = path.join(process.cwd(), "uploads", "pdfs");

// ─── Theme (derived from frontend Tailwind CSS variables) ────────────────
// Cream #FFFDF1 │ Peach #FFCE99
// Orange #E06B0A │ Brown #562F00

const t = {
  // Core palette
  cream: "#FFFDF1",
  peach: "#FFCE99",
  accent: "#E06B0A",
  primary: "#562F00",
  // Backgrounds
  bg: "#FFFDF1",
  card: "#FFFFFF",
  mutedBg: "#F2E8D9",
  // Text hierarchy
  text: "#562F00",
  textSecondary: "#7A5C32",
  textMuted: "#A18A6A",
  textLight: "#C4AD8A",
  // Borders
  border: "#D9C9B3",
  borderLight: "#E8DCC8",
  // Status colors
  success: "#166534",
  successBg: "#F0FDF4",
  successBorder: "#BBF7D0",
  warning: "#854D0E",
  warningBg: "#FFFBEB",
  warningBorder: "#FDE68A",
  destructive: "#DC2626",
  destructiveBg: "#FEF2F2",
  destructiveBorder: "#FECACA",
  // Font stack (Inter preferred, system fallbacks)
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

// ─── Styled Icon (sharp corners, themed) ─────────────────────────────────
const icon = (
  letter: string,
  bg: string,
  color: string,
  border?: string
) =>
  `<span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;background:${bg};color:${color};font-weight:700;font-size:13px;font-family:${t.font};vertical-align:middle;margin-right:10px;${border ? `border:1px solid ${border};` : ""}">${letter}</span>`;

const icons = {
  otp: icon("OTP", t.primary, "#FFFFFF"),
  lock: icon("&#128274;", t.peach, t.primary, t.border),
  discount: icon("%", "#FDF0E0", t.accent, "#FBDAB5"),
  master: icon("M", "#F5EDE3", t.primary, t.borderLight),
  project: icon("P", t.peach, t.primary, t.border),
  mail: icon("@", "#FDF0E0", t.accent, "#FBDAB5"),
  check: icon("&#10003;", t.successBg, t.success, t.successBorder),
  cross: icon("&#10005;", t.destructiveBg, t.destructive, t.destructiveBorder),
  status: icon("S", t.peach, t.primary, t.border),
  user: icon("U", "#FDF0E0", t.accent, "#FBDAB5"),
  warn: icon("!", t.warningBg, t.warning, t.warningBorder),
  login: icon("&#128274;", "#FDF0E0", t.accent, "#FBDAB5"),
};

// ─── Base Layout ─────────────────────────────────────────────────────────
const emailLayout = (content: string, previewText: string = "") =>
  `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>ESIPL</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: light only; supported-color-schemes: light only; }
    [data-ogsc] body, [data-ogsb] body, .dark body, body.dark, body[data-outlook-cycle] {
      background-color: ${t.bg} !important; color: ${t.text} !important;
    }
    @media (prefers-color-scheme: dark) {
      body, .email-wrapper, .card-inner, .body-content, .footer-section, td, th, div, p, span, h1, h2, h3, h4, a {
        background-color: ${t.bg} !important; color: ${t.text} !important;
      }
      .card-inner { background-color: ${t.card} !important; }
      .header-section { background-color: ${t.card} !important; }
      .footer-section { background-color: ${t.mutedBg} !important; }
      .accent-bar td { background-color: ${t.accent} !important; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${t.font}; background-color: ${t.bg}; color: ${t.text};
      -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
      -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;
      width: 100% !important; margin: 0 !important; padding: 0 !important;
    }
    table { border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { padding: 0; }
    img { border: 0; line-height: 100%; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { color: ${t.accent}; text-decoration: none; }
    @media only screen and (max-width: 660px) {
      .wrapper-table { width: 100% !important; max-width: 100% !important; }
      .outer-pad { padding: 24px 12px !important; }
      .body-content { padding: 28px 24px !important; }
      .header-section { padding: 24px !important; }
      .footer-section { padding: 20px 24px !important; }
    }
    @media only screen and (max-width: 480px) {
      .outer-pad { padding: 16px 8px !important; }
      .body-content { padding: 24px 16px !important; }
      .header-section { padding: 20px 16px !important; }
      .footer-section { padding: 16px !important; }
      .header-logo { max-width: 140px !important; }
      .title-text { font-size: 17px !important; }
      .subtitle-text { font-size: 13px !important; }
      .otp-code-cell { font-size: 26px !important; letter-spacing: 8px !important; padding: 16px 20px !important; }
      .items-th, .items-td { padding: 8px 6px !important; font-size: 11px !important; }
      .info-label, .info-value { padding: 8px 10px !important; font-size: 12px !important; }
      .btn-email { padding: 12px 20px !important; font-size: 13px !important; }
      .footer-text { font-size: 10px !important; }
      .footer-links a { font-size: 11px !important; margin: 0 6px !important; }
      .gst-row td { font-size: 12px !important; }
      .gst-total td { font-size: 13px !important; }
      .highlight-box { padding: 12px 14px !important; }
    }
    @media only screen and (max-width: 380px) {
      .outer-pad { padding: 8px 4px !important; }
      .body-content { padding: 20px 12px !important; }
      .otp-code-cell { font-size: 22px !important; letter-spacing: 6px !important; padding: 14px 16px !important; }
      .title-text { font-size: 15px !important; }
      .header-logo { max-width: 120px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${t.bg};font-family:${t.font};color:${t.text};">
  ${previewText
    ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">${previewText}${"&nbsp;&zwnj;".repeat(30)}</div>`
    : ""
  }
  <!-- Outer Wrapper -->
  <table role="presentation" class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="background-color:${t.bg};">
    <tr>
      <td class="outer-pad" align="center" style="padding:40px 16px;">
        <!-- Card Container -->
        <table role="presentation" class="wrapper-table" width="600" cellpadding="0" cellspacing="0" style="background-color:${t.card};border:1px solid ${t.border};overflow:hidden;box-shadow:0 1px 3px rgba(86,47,0,0.06),0 1px 2px rgba(86,47,0,0.04);">
          <!-- Accent Top Bar (4px) -->
          <tr class="accent-bar">
            <td style="background-color:${t.accent};height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Header -->
          <tr>
            <td class="header-section" style="background-color:${t.card};padding:28px 32px;text-align:center;border-bottom:1px solid ${t.border};">
              <img src="cid:${LOGO_CID}" alt="ESIPL" class="header-logo" width="180" style="display:inline-block;max-width:180px;height:auto;border:0;outline:none;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="body-content card-inner" style="padding:36px 32px;background-color:${t.card};">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td class="footer-section" style="padding:24px 32px;background-color:${t.mutedBg};border-top:1px solid ${t.border};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding-bottom:14px;">
                    <p style="font-size:13px;font-weight:700;color:${t.primary};margin:0 0 6px;font-family:${t.font};">Ecstatics Spaces India Pvt. Ltd.</p>
                    <p class="footer-text" style="font-size:11px;color:${t.textMuted};line-height:1.7;margin:0;font-family:${t.font};">
                      3120, Ganga Trueno, Airport Road, Viman Nagar, Pune<br>GST No: 27AAFCE9942B1ZM
                    </p>
                  </td>
                </tr>
                <tr>
                  <td class="footer-links" style="text-align:center;padding:14px 0;border-top:1px solid ${t.borderLight};">
                    <a href="tel:+917066466060" style="color:${t.accent};font-size:12px;font-weight:600;text-decoration:none;margin:0 12px;font-family:${t.font};">(+91) 7066466060</a>
                    <span style="color:${t.borderLight};font-size:12px;">&#124;</span>
                    <a href="mailto:info@esipl.in" style="color:${t.accent};font-size:12px;font-weight:600;text-decoration:none;margin:0 12px;font-family:${t.font};">info@esipl.in</a>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-top:10px;">
                    <p style="font-size:10px;color:${t.textLight};margin:0;font-family:${t.font};">This is an automated email. Please do not reply directly.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── Reusable HTML Components ──────────────────────────────────────────────
const htmlTitle = (iconHtml: string, text: string) =>
  `<h2 class="title-text" style="font-size:20px;font-weight:700;color:${t.text};margin:0 0 6px;line-height:1.3;font-family:${t.font};">${text}</h2>`;

const htmlSubtitle = (text: string) =>
  `<p class="subtitle-text" style="font-size:14px;color:${t.textSecondary};margin:0 0 16px;line-height:1.6;font-family:${t.font};">${text}</p>`;

const htmlDivider = () =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="border-top:1px solid ${t.border};"></td></tr>
  </table>`;

const htmlAccentDivider = () =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td style="border-top:2px solid ${t.accent};width:40px;"></td>
      <td></td>
    </tr>
  </table>`;

const htmlBadge = (
  text: string,
  type: "success" | "warning" | "error" | "info"
) => {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    success: { bg: "#F5EDE3", color: t.primary, border: "#E8D8C4" },
    warning: { bg: "#FDF0E0", color: t.accent, border: "#FBDAB5" },
    error: { bg: t.destructiveBg, color: t.destructive, border: t.destructiveBorder },
    info: { bg: "#FFE8CC", color: t.primary, border: "#FFDDB3" },
  };
  const s = styles[type];
  return `<span style="display:inline-block;padding:3px 10px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;background:${s.bg};color:${s.color};border:1px solid ${s.border};font-family:${t.font};">${text}</span>`;
};

const htmlInfoRow = (label: string, value: string) =>
  `<tr>
    <td class="info-label" style="padding:10px 14px;font-size:13px;border-bottom:1px solid ${t.borderLight};color:${t.textSecondary};font-weight:500;width:140px;vertical-align:top;font-family:${t.font};">${label}</td>
    <td class="info-value" style="padding:10px 14px;font-size:13px;border-bottom:1px solid ${t.borderLight};font-weight:600;color:${t.text};font-family:${t.font};">${value}</td>
  </tr>`;

const htmlInfoTable = (rows: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid ${t.borderLight};border-bottom:none;">
    ${rows}
  </table>`;

const htmlButton = (
  text: string,
  href: string,
  variant: "primary" | "outline" = "primary"
) => {
  if (variant === "outline") {
    return `<a href="${href}" target="_blank" class="btn-email" style="display:inline-block;border:1.5px solid ${t.border};color:${t.text};padding:12px 28px;text-decoration:none;font-weight:600;font-size:14px;font-family:${t.font};">${text}</a>`;
  }
  return `<a href="${href}" target="_blank" class="btn-email" style="display:inline-block;background-color:${t.accent};color:#FFFFFF;padding:14px 32px;text-decoration:none;font-weight:700;font-size:14px;font-family:${t.font};">${text}</a>`;
};

const htmlWarningBox = (text: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr>
      <td class="highlight-box" style="background:${t.warningBg};border:1px solid ${t.warningBorder};border-left:4px solid ${t.accent};padding:14px 18px;font-size:12px;color:${t.warning};line-height:1.6;font-family:${t.font};">${icons.warn} ${text}</td>
    </tr>
  </table>`;

const htmlSuccessBox = (text: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr>
      <td class="highlight-box" style="background:${t.successBg};border:1px solid ${t.successBorder};border-left:4px solid ${t.success};padding:14px 18px;font-size:12px;color:${t.success};line-height:1.6;font-family:${t.font};">${icons.check} ${text}</td>
    </tr>
  </table>`;

const htmlHighlightBox = (innerHtml: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr>
      <td class="highlight-box" style="background:${t.mutedBg};border:1px solid ${t.border};padding:18px 20px;">${innerHtml}</td>
    </tr>
  </table>`;

// ─── Format Helpers ──────────────────────────────────────────────────────
const formatCurrency = (amount: number | string): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDate = (date: Date | string): string =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (date: Date | string): string =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Core Send Function ──────────────────────────────────────────────────
export interface EmailOptions {
  to: string;
  cc?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    cid?: string;
    contentType?: string;
  }>;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const config = await getEmailConfig();
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });

    // Default attachments
    const defaultAttachments: any = [
      {
        filename: "logo.png",
        path: LOGO_PATH,
        cid: LOGO_CID,
        contentType: "image/png",
        contentDisposition: "inline",
      }
    ];

    // Merge default + any extra attachments
    const allAttachments = [
      ...defaultAttachments,
      ...(options.attachments || []),
    ];

    const mailOptions = {
      from: config.from,
      to: options.to,
      cc: options.cc || undefined,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: allAttachments,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId} to ${options.to}`);
    return true;
  } catch (error) {
    logger.error("Email send failed:", error);
    return false;
  }
};

// ─── OTP Email ───────────────────────────────────────────────────────────
export const sendOTPEmail = async (
  to: string,
  otp: string,
  purpose: string
): Promise<boolean> => {
  const purposeLabel = purpose
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const purposeDescriptions: Record<string, string> = {
    login: "Use this OTP to verify your identity and complete the login.",
    discount:
      "An OTP has been requested to override the discount limit on a project item.",
    "master activation":
      "An OTP has been requested to activate a master record.",
    master_activation:
      "An OTP has been requested to activate a master record.",
  };

  const descText =
    purposeDescriptions[purpose.toLowerCase()] ||
    `Use this OTP to complete your ${purposeLabel} verification.`;

  const iconMap: Record<string, string> = {
    login: icons.lock,
    discount: icons.discount,
    "master activation": icons.master,
    master_activation: icons.master,
  };

  const iconHtml = iconMap[purpose.toLowerCase()] || icons.otp;

  const content = `
    ${htmlTitle(iconHtml, `${purposeLabel} Verification`)}
    ${htmlAccentDivider()}
    ${htmlSubtitle(descText)}
    <!-- OTP Code -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" style="border:2px solid ${t.border};">
            <tr>
              <td class="otp-code-cell" style="background:${t.primary};color:#FFFFFF;font-size:36px;font-weight:800;letter-spacing:14px;padding:22px 44px;font-family:'Courier New',Courier,monospace;text-align:center;">
                ${otp}
              </td>
            </tr>
          </table>
          <p style="font-size:12px;color:${t.textMuted};margin-top:14px;font-family:${t.font};">
            This OTP expires in <strong style="color:${t.text};">${env.otp.expiryMinutes} minutes</strong>
          </p>
        </td>
      </tr>
    </table>
    ${htmlInfoTable(
    htmlInfoRow("Purpose", htmlBadge(purposeLabel, "info")) +
    htmlInfoRow(
      "Valid Until",
      formatDateTime(
        new Date(Date.now() + env.otp.expiryMinutes * 60000)
      )
    )
  )}
    ${htmlWarningBox(
    `<strong>Security Notice:</strong> Do not share this OTP with anyone. Our staff will never ask for your OTP. If you did not request this, please ignore this email or contact support immediately.`
  )}
  `;

  return sendEmail({
    to,
    subject: `OTP for ${purposeLabel} - ESIPL`,
    html: emailLayout(content, `Your OTP is ${otp}`),
    text: `Your OTP for ${purposeLabel} is: ${otp}. Valid for ${env.otp.expiryMinutes} minutes. Do not share this with anyone.`,
  });
};

// ─── NEW: Login Notification Email (to Admin) ────────────────────────────
export interface LoginNotificationData {
  userName: string;
  userEmail: string;
  userRole: string;
  loginTime: Date;
  ipAddress?: string;
  userAgent?: string;
}

export const sendLoginNotificationEmail = async (
  to: string,
  data: LoginNotificationData
): Promise<boolean> => {
  const appUrl = env.cors.origin || "http://localhost:5173";

  const content = `
    ${htmlTitle(icons.login, "User Login Notification")}
    ${htmlAccentDivider()}
    ${htmlSubtitle("A user has logged into the system.")}
    ${htmlSubtitle(
    `<strong style="color:${t.text};">${data.userName}</strong> has successfully logged in.`
  )}
    ${htmlInfoTable(
    htmlInfoRow("User Name", `<strong>${data.userName}</strong>`) +
    htmlInfoRow("Email", data.userEmail) +
    htmlInfoRow("Role", htmlBadge(data.userRole, "info")) +
    htmlInfoRow("Login Time", formatDateTime(data.loginTime)) +
    (data.ipAddress
      ? htmlInfoRow("IP Address", data.ipAddress)
      : "") +
    (data.userAgent
      ? htmlInfoRow(
        "Browser",
        `<span style="font-size:11px;color:${t.textMuted};">${data.userAgent.substring(0, 100)}${data.userAgent.length > 100 ? "..." : ""}</span>`
      )
      : "")
  )}
    ${htmlSuccessBox(
    `<strong>${data.userName}</strong> (${data.userRole}) logged in at ${formatDateTime(data.loginTime)}.`
  )}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td align="center">
          ${htmlButton("View Dashboard", `${appUrl}/dashboard`)}
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    to,
    subject: `Login Alert: ${data.userName} (${data.userRole}) - ESIPL`,
    html: emailLayout(
      content,
      `${data.userName} logged in as ${data.userRole}`
    ),
    text: `Login Notification\n\nUser: ${data.userName}\nEmail: ${data.userEmail}\nRole: ${data.userRole}\nTime: ${formatDateTime(data.loginTime)}\n\nThis is an automated notification.`,
  });
};

// ─── Project Email ───────────────────────────────────────────────────────
export interface ProjectEmailData {
  recipientName: string;
  projectNo: string;
  projectId: string;
  customerName: string;
  date: Date | string;
  salesPersonName: string;
  items: Array<{
    productCode: string;
    productName: string;
    quantity: number;
    finalPrice: number;
    total: number;
  }>;
  grandTotal: number;
  cgst: number;
  sgst: number;
  grandTotalWithGst: number;
}

export const sendProjectEmail = async (
  to: string,
  data: ProjectEmailData,
  type: "created" | "sent" | "revised" | "approved",
  cc?: string
): Promise<boolean> => {
  const typeConfig = {
    created: {
      title: "New Project Created",
      subtitle:
        "A new project has been created and is ready for review.",
      badge: htmlBadge("Created", "info"),
      icon: icons.project,
    },
    sent: {
      title: "Project Quotation",
      subtitle:
        "Please find the project quotation details below.",
      badge: htmlBadge("Sent", "warning"),
      icon: icons.mail,
    },
    revised: {
      title: "Project Revised",
      subtitle:
        "The project has been revised with updated details.",
      badge: htmlBadge("Revised", "warning"),
      icon: icons.project,
    },
    approved: {
      title: "Project Approved",
      subtitle:
        "The project has been approved successfully.",
      badge: htmlBadge("Approved", "success"),
      icon: icons.check,
    },
  };

  const config = typeConfig[type];
  const appUrl = env.cors.origin || "http://localhost:5173";

  // Build items table rows
  const itemsRows = data.items
    .map(
      (item, i) =>
        `<tr style="background-color:${i % 2 === 1 ? t.cream : t.card};">
          <td class="items-td" style="padding:10px 14px;font-size:13px;border-bottom:1px solid ${t.borderLight};text-align:center;color:${t.textMuted};font-family:${t.font};">${i + 1}</td>
          <td class="items-td" style="padding:10px 14px;font-size:13px;border-bottom:1px solid ${t.borderLight};font-family:${t.font};">
            <strong style="color:${t.text};">${item.productCode}</strong><br>
            <span style="font-size:11px;color:${t.textMuted};line-height:1.4;">${item.productName}</span>
          </td>
          <td class="items-td" style="padding:10px 14px;font-size:13px;border-bottom:1px solid ${t.borderLight};text-align:center;color:${t.text};font-family:${t.font};">${item.quantity}</td>
          <td class="items-td" style="padding:10px 14px;font-size:13px;border-bottom:1px solid ${t.borderLight};text-align:right;font-variant-numeric:tabular-nums;color:${t.text};font-family:${t.font};">${formatCurrency(item.finalPrice)}</td>
          <td class="items-td" style="padding:10px 14px;font-size:13px;border-bottom:1px solid ${t.borderLight};text-align:right;font-variant-numeric:tabular-nums;font-weight:600;color:${t.text};font-family:${t.font};">${formatCurrency(item.total)}</td>
        </tr>`
    )
    .join("");

  const content = `
    ${htmlTitle(config.icon, config.title)}
    ${htmlAccentDivider()}
    ${htmlSubtitle(`Dear ${data.recipientName},`)}
    ${htmlSubtitle(config.subtitle)}
    ${htmlInfoTable(
    htmlInfoRow(
      "Project No",
      `<strong>${data.projectNo}</strong>&nbsp;&nbsp;${config.badge}`
    ) +
    htmlInfoRow("Customer", data.customerName) +
    htmlInfoRow("Date", formatDate(data.date)) +
    htmlInfoRow("Sales Manager", data.salesPersonName)
  )}
    ${htmlDivider()}
    <h3 style="font-size:15px;font-weight:700;margin:0 0 14px;color:${t.text};font-family:${t.font};">
      ${icons.project} Quotation Items
    </h3>
    <!-- Items Table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid ${t.border};overflow:hidden;">
      <thead>
        <tr>
          <th class="items-th" style="background:${t.peach};padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${t.primary};text-align:center;border-bottom:2px solid ${t.border};width:40px;font-family:${t.font};">Sr</th>
          <th class="items-th" style="background:${t.peach};padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${t.primary};text-align:left;border-bottom:2px solid ${t.border};font-family:${t.font};">Product</th>
          <th class="items-th" style="background:${t.peach};padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${t.primary};text-align:center;border-bottom:2px solid ${t.border};width:50px;font-family:${t.font};">Qty</th>
          <th class="items-th" style="background:${t.peach};padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${t.primary};text-align:right;border-bottom:2px solid ${t.border};width:100px;font-family:${t.font};">Price</th>
          <th class="items-th" style="background:${t.peach};padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${t.primary};text-align:right;border-bottom:2px solid ${t.border};width:100px;font-family:${t.font};">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        <!-- Grand Total Row -->
        <tr>
          <td colspan="4" style="background:${t.mutedBg};padding:12px 14px;font-weight:700;border-top:2px solid ${t.border};text-align:right;font-size:13px;color:${t.text};font-family:${t.font};">Grand Total</td>
          <td style="background:${t.mutedBg};padding:12px 14px;font-weight:800;border-top:2px solid ${t.border};text-align:right;font-variant-numeric:tabular-nums;font-size:14px;color:${t.primary};font-family:${t.font};">${formatCurrency(data.grandTotal)}</td>
        </tr>
      </tbody>
    </table>
    <!-- GST Breakdown -->
    ${htmlHighlightBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr class="gst-row">
          <td style="padding:5px 0;font-size:13px;color:${t.textSecondary};font-family:${t.font};">Subtotal</td>
          <td style="padding:5px 0;font-size:13px;text-align:right;font-weight:600;font-variant-numeric:tabular-nums;color:${t.text};font-family:${t.font};">${formatCurrency(data.grandTotal)}</td>
        </tr>
        <tr class="gst-row">
          <td style="padding:5px 0;font-size:13px;color:${t.textSecondary};font-family:${t.font};">CGST (9%)</td>
          <td style="padding:5px 0;font-size:13px;text-align:right;font-variant-numeric:tabular-nums;color:${t.text};font-family:${t.font};">${formatCurrency(data.cgst)}</td>
        </tr>
        <tr class="gst-row">
          <td style="padding:5px 0;font-size:13px;color:${t.textSecondary};font-family:${t.font};">SGST (9%)</td>
          <td style="padding:5px 0;font-size:13px;text-align:right;font-variant-numeric:tabular-nums;color:${t.text};font-family:${t.font};">${formatCurrency(data.sgst)}</td>
        </tr>
        <tr class="gst-total">
          <td style="padding:10px 0 4px;font-size:15px;font-weight:800;border-top:2px solid ${t.border};color:${t.text};font-family:${t.font};">Total with GST</td>
          <td style="padding:10px 0 4px;font-size:16px;font-weight:800;text-align:right;border-top:2px solid ${t.border};color:${t.accent};font-variant-numeric:tabular-nums;font-family:${t.font};">${formatCurrency(data.grandTotalWithGst)}</td>
        </tr>
      </table>
    `)}
    <!-- Action Buttons -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td align="center">
          ${htmlButton("View Project", `${appUrl}/projects/${data.projectId}`)}
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top:12px;">
          ${htmlButton("View PDF", `${appUrl}/projects/${data.projectId}/pdf`, "outline")}
        </td>
      </tr>
    </table>
  `;

  const subject =
    type === "sent"
      ? `Quotation ${data.projectNo} - ESIPL`
      : `Project ${data.projectNo} ${type.charAt(0).toUpperCase() + type.slice(1)} - ESIPL`;

  // ★ Check if PDF exists for this project and attach it
  const pdfAttachments: Array<{
    filename: string;
    path: string;
    contentType: string;
  }> = [];

  const pdfPath = path.join(PDF_UPLOAD_DIR, `${data.projectId}.pdf`);
  if (fs.existsSync(pdfPath)) {
    pdfAttachments.push({
      filename: `${data.projectNo || data.projectId}.pdf`,
      path: pdfPath,
      contentType: "application/pdf",
    });
    logger.info(
      `Attaching PDF for project ${data.projectId}: ${pdfPath}`
    );
  } else {
    logger.info(
      `No PDF found for project ${data.projectId} at ${pdfPath}`
    );
  }

  return sendEmail({
    to,
    cc,
    subject,
    html: emailLayout(content, `${config.title} - ${data.projectNo}`),
    text: `${config.title}\n\nProject: ${data.projectNo}\nCustomer: ${data.customerName}\nTotal: ${formatCurrency(data.grandTotalWithGst)}\n\nView: ${appUrl}/projects/${data.projectId}`,
    attachments: pdfAttachments,
  });
};

// ─── Status Update Email ─────────────────────────────────────────────────
export const sendStatusUpdateEmail = async (
  to: string,
  data: {
    recipientName: string;
    projectNo: string;
    projectId: string;
    oldStatus: string;
    newStatus: string;
    updatedBy: string;
  }
): Promise<boolean> => {
  const statusBadgeType = (
    status: string
  ): "success" | "warning" | "error" | "info" => {
    const map: Record<string, "success" | "warning" | "error" | "info"> = {
      draft: "info",
      sent: "warning",
      approved: "success",
      expired: "error",
      cancelled: "error",
    };
    return map[status] || "info";
  };

  const appUrl = env.cors.origin || "http://localhost:5173";

  const content = `
    ${htmlTitle(icons.status, "Project Status Updated")}
    ${htmlAccentDivider()}
    ${htmlSubtitle(`Hello ${data.recipientName},`)}
    ${htmlSubtitle(
    `The status of project <strong style="color:${t.text};">${data.projectNo}</strong> has been updated.`
  )}
    <!-- Status Transition -->
    ${htmlHighlightBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <p style="margin:0 0 12px;font-size:11px;color:${t.textMuted};text-transform:uppercase;letter-spacing:1px;font-weight:600;font-family:${t.font};">Status Change</p>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 10px;">
                  ${htmlBadge(
    data.oldStatus.charAt(0).toUpperCase() +
    data.oldStatus.slice(1),
    statusBadgeType(data.oldStatus)
  )}
                </td>
                <td style="padding:0 10px;font-size:20px;color:${t.accent};font-weight:700;">&#8594;</td>
                <td style="padding:0 10px;">
                  ${htmlBadge(
    data.newStatus.charAt(0).toUpperCase() +
    data.newStatus.slice(1),
    statusBadgeType(data.newStatus)
  )}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `)}
    ${htmlInfoTable(
    htmlInfoRow("Project No", `<strong>${data.projectNo}</strong>`) +
    htmlInfoRow("Updated By", data.updatedBy) +
    htmlInfoRow("Updated At", formatDateTime(new Date()))
  )}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td align="center">
          ${htmlButton("View Project", `${appUrl}/projects/${data.projectId}`)}
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    to,
    subject: `Project ${data.projectNo} - Status Updated to ${data.newStatus}`,
    html: emailLayout(
      content,
      `Project ${data.projectNo} status: ${data.newStatus}`
    ),
  });
};

// ─── Welcome Email ───────────────────────────────────────────────────────
export const sendWelcomeEmail = async (
  to: string,
  data: {
    name: string;
    email: string;
    role: string;
    tempPassword?: string;
  }
): Promise<boolean> => {
  const appUrl = env.cors.origin || "http://localhost:5173";

  const passwordRow = data.tempPassword
    ? htmlInfoRow(
      "Temp Password",
      `<code style="background:${t.mutedBg};padding:4px 10px;border:1px solid ${t.borderLight};font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:700;color:${t.primary};">${data.tempPassword}</code>`
    )
    : "";

  const content = `
    ${htmlTitle(icons.user, "Welcome!")}
    ${htmlAccentDivider()}
    ${htmlSubtitle(`Hello ${data.name},`)}
    ${htmlSubtitle(
    "Your account has been created successfully. You can now access the platform using the credentials below."
  )}
    ${htmlInfoTable(
    htmlInfoRow("Name", data.name) +
    htmlInfoRow("Email", data.email) +
    htmlInfoRow("Role", htmlBadge(data.role, "info")) +
    passwordRow
  )}
    ${data.tempPassword
      ? htmlWarningBox(
        "<strong>Important:</strong> Please change your temporary password after your first login for security."
      )
      : ""
    }
    ${htmlSuccessBox("Your account is active and ready to use.")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td align="center">
          ${htmlButton("Log in to Dashboard", `${appUrl}/login`)}
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    to,
    subject: "Welcome to ESIPL",
    html: emailLayout(content, `Welcome ${data.name}! Your account is ready.`),
  });
};

// ─── Approval Notification Email ─────────────────────────────────────────
export const sendApprovalNotificationEmail = async (
  to: string,
  data: {
    recipientName: string;
    entityType: string;
    entityName: string;
    action: "approved" | "rejected";
    approvedBy: string;
    reason?: string;
  }
): Promise<boolean> => {
  const isApproved = data.action === "approved";
  const iconHtml = isApproved ? icons.check : icons.cross;

  const statusBox = isApproved
    ? htmlSuccessBox(
      `<strong>${data.entityName}</strong> has been <strong>approved</strong> by ${data.approvedBy}.${data.reason ? `<br><br><em>Note: ${data.reason}</em>` : ""}`
    )
    : htmlWarningBox(
      `<strong>${data.entityName}</strong> has been <strong>rejected</strong> by ${data.approvedBy}.${data.reason ? `<br><br><em>Reason: ${data.reason}</em>` : ""}`
    );

  const content = `
    ${htmlTitle(
    iconHtml,
    `${data.entityType} ${isApproved ? "Approved" : "Rejected"}`
  )}
    ${htmlAccentDivider()}
    ${htmlSubtitle(`Hello ${data.recipientName},`)}
    ${htmlSubtitle(
    `Your ${data.entityType.toLowerCase()} request has been ${data.action}.`
  )}
    ${statusBox}
    ${htmlInfoTable(
    htmlInfoRow("Type", htmlBadge(data.entityType, "info")) +
    htmlInfoRow("Name", `<strong>${data.entityName}</strong>`) +
    htmlInfoRow(
      isApproved ? "Approved By" : "Rejected By",
      data.approvedBy
    ) +
    htmlInfoRow("Date", formatDateTime(new Date()))
  )}
  `;

  return sendEmail({
    to,
    subject: `${data.entityType} ${data.action}: ${data.entityName}`,
    html: emailLayout(
      content,
      `${data.entityType} ${data.entityName} has been ${data.action}`
    ),
  });
};

// ─── Backward Compatibility: sendQuotationEmail ──────────────────────────
// ★ NOW ATTACHES PDF if found at uploads/pdfs/{projectId}.pdf
export const sendQuotationEmail = async (
  to: string,
  quotationNo: string,
  customerName: string,
  _pdfBuffer?: Buffer,
  projectId?: string
): Promise<boolean> => {
  const content = `
    ${htmlTitle(icons.project, "Project Quotation")}
    ${htmlAccentDivider()}
    ${htmlSubtitle(`Dear ${customerName},`)}
    ${htmlSubtitle(
    `Please find the quotation <strong style="color:${t.text};">${quotationNo}</strong> details below.`
  )}
    ${htmlInfoTable(
    htmlInfoRow("Quotation No", `<strong>${quotationNo}</strong>`) +
    htmlInfoRow("Customer", customerName) +
    htmlInfoRow("Date", formatDate(new Date()))
  )}
    <p style="font-size:14px;color:${t.textSecondary};margin:20px 0 0;line-height:1.6;font-family:${t.font};">
      Thank you for your interest in our products. For any queries, please feel free to contact us.
    </p>
    <p style="font-size:14px;margin:24px 0 0;line-height:1.6;color:${t.text};font-family:${t.font};">
      Best regards,<br>
      <strong style="color:${t.primary};">Ecstatics Spaces India Pvt. Ltd.</strong>
    </p>
  `;

  // ★ Build PDF attachment if file exists
  const pdfAttachments: Array<{
    filename: string;
    path: string;
    contentType: string;
  }> = [];

  if (projectId) {
    const pdfPath = path.join(PDF_UPLOAD_DIR, `${projectId}.pdf`);
    if (fs.existsSync(pdfPath)) {
      pdfAttachments.push({
        filename: `${quotationNo || projectId}.pdf`,
        path: pdfPath,
        contentType: "application/pdf",
      });
      logger.info(
        `Attaching PDF for quotation ${quotationNo}, project ${projectId}: ${pdfPath}`
      );
    } else {
      logger.info(
        `No PDF found for project ${projectId} at ${pdfPath}`
      );
    }
  }

  return sendEmail({
    to,
    subject: `Quotation ${quotationNo} - ESIPL`,
    html: emailLayout(
      content,
      `Quotation ${quotationNo} for ${customerName}`
    ),
    attachments: pdfAttachments,
  });
};