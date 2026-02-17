// src/utils/email.service.ts
import nodemailer from "nodemailer";
import { env } from "../config/environment";
import { logger } from "./logger";

// ─── Transporter (single instance) ─────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.password,
  },
});

// ─── Theme (light mode only) ────────────────────────────────────────────────

const t = {
  primary: "#1a1a1f",
  accent: "#8B6914",
  success: "#166534",
  warning: "#854d0e",
  destructive: "#b91c1c",
  bg: "#f5f5f4",
  card: "#ffffff",
  text: "#1a1a1f",
  textSecondary: "#4b5563",
  textMuted: "#9ca3af",
  border: "#e5e5e4",
  mutedBg: "#f3f4f6",
  // Web-safe font stack — Inter won't load via @import in most email clients
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

// ─── Styled Icon (replaces emojis) ──────────────────────────────────────────

const icon = (letter: string, bg: string, color: string) =>
  `<span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:6px;background:${bg};color:${color};font-weight:700;font-size:14px;font-family:${t.font};vertical-align:middle;margin-right:8px;">${letter}</span>`;

const icons = {
  otp: icon("OTP", t.primary, "#ffffff"),
  lock: icon("&#128274;", "#eef2ff", "#3730a3"),
  discount: icon("%", "#fef3c7", t.warning),
  master: icon("M", "#dcfce7", t.success),
  project: icon("P", "#e0e7ff", "#3730a3"),
  mail: icon("@", "#fce7f3", "#be185d"),
  check: icon("&#10003;", "#dcfce7", t.success),
  cross: icon("&#10005;", "#fee2e2", t.destructive),
  status: icon("S", "#e0e7ff", "#3730a3"),
  user: icon("U", "#f3e8ff", "#7c3aed"),
  warn: icon("!", "#fef3c7", t.warning),
};

// ─── Base Layout (light mode enforced) ──────────────────────────────────────

const emailLayout = (content: string, previewText: string = "") => `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>Ecstatics Spaces</title>
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
    /* Force light mode */
    :root { color-scheme: light only; supported-color-schemes: light only; }
    
    /* Dark mode prevention for all major clients */
    [data-ogsc] body,
    [data-ogsb] body,
    .dark body,
    body.dark,
    body[data-outlook-cycle] {
      background-color: ${t.bg} !important;
      color: ${t.text} !important;
    }
    
    @media (prefers-color-scheme: dark) {
      body, .wrapper, .card, .body-content, .footer-section,
      td, th, div, p, span, h1, h2, h3, h4, a {
        background-color: ${t.bg} !important;
        color: ${t.text} !important;
      }
      .card-inner {
        background-color: ${t.card} !important;
      }
      .header-section {
        background-color: ${t.primary} !important;
      }
      .footer-section {
        background-color: ${t.mutedBg} !important;
      }
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: ${t.font};
      background-color: ${t.bg};
      color: ${t.text};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    table { border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { padding: 0; }
    img { border: 0; line-height: 100%; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { color: ${t.accent}; text-decoration: none; }
    
    @media only screen and (max-width: 620px) {
      .wrapper-table { width: 100% !important; }
      .body-content { padding: 24px 20px !important; }
      .footer-section { padding: 16px 20px !important; }
      .otp-code-cell { font-size: 28px !important; letter-spacing: 8px !important; padding: 16px 24px !important; }
      .items-th, .items-td { padding: 8px 10px !important; font-size: 12px !important; }
      .info-label, .info-value { padding: 8px 12px !important; }
      .responsive-hide { display: none !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${t.bg};font-family:${t.font};color:${t.text};">
  ${previewText ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">${previewText}${"&nbsp;&zwnj;".repeat(30)}</div>` : ""}
  
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${t.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!-- Card -->
        <table role="presentation" class="wrapper-table" width="600" cellpadding="0" cellspacing="0" style="background-color:${t.card};border-radius:12px;border:1px solid ${t.border};box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td class="header-section" style="background-color:${t.primary};padding:24px 32px;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-1px;line-height:1;font-family:${t.font};">
                      ecstatics<span style="color:${t.accent};">.</span>
                    </div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:6px;letter-spacing:1.5px;text-transform:uppercase;font-weight:500;">
                      Spaces India Pvt. Ltd.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td class="body-content card-inner" style="padding:32px;background-color:${t.card};">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer-section" style="padding:20px 32px;background-color:${t.mutedBg};border-top:1px solid ${t.border};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;font-size:11px;color:${t.textMuted};line-height:1.6;font-family:${t.font};">
                    Ecstatics Spaces India Pvt. Ltd.<br>
                    3120, Ganga Trueno, Airport Road, Viman Nagar, Pune<br>
                    GST No: 27AAFCE9942B1ZM
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-top:12px;">
                    <a href="tel:+917066466060" style="color:${t.accent};font-size:12px;font-weight:500;text-decoration:none;margin:0 8px;">(+91) 7066 46 6060</a>
                    <a href="mailto:info@esipl.in" style="color:${t.accent};font-size:12px;font-weight:500;text-decoration:none;margin:0 8px;">info@esipl.in</a>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-top:12px;font-size:10px;color:#c0c0c0;font-family:${t.font};">
                    This is an automated email. Please do not reply directly.
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

// ─── Reusable HTML Components ───────────────────────────────────────────────

const htmlTitle = (iconHtml: string, text: string) =>
  `<h2 style="font-size:20px;font-weight:700;color:${t.text};margin-bottom:8px;line-height:1.3;font-family:${t.font};">${iconHtml}${text}</h2>`;

const htmlSubtitle = (text: string) =>
  `<p style="font-size:14px;color:${t.textSecondary};margin-bottom:16px;line-height:1.5;font-family:${t.font};">${text}</p>`;

const htmlDivider = () =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-top:1px solid ${t.border};"></td></tr></table>`;

const htmlBadge = (
  text: string,
  type: "success" | "warning" | "error" | "info",
) => {
  const styles: Record<string, { bg: string; color: string }> = {
    success: { bg: "#dcfce7", color: t.success },
    warning: { bg: "#fef3c7", color: t.warning },
    error: { bg: "#fee2e2", color: t.destructive },
    info: { bg: "#e0e7ff", color: "#3730a3" },
  };
  const s = styles[type];
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;background:${s.bg};color:${s.color};font-family:${t.font};">${text}</span>`;
};

const htmlInfoRow = (label: string, value: string) =>
  `<tr>
    <td class="info-label" style="padding:10px 14px;font-size:13px;border-bottom:1px solid ${t.border};color:${t.textSecondary};font-weight:500;width:140px;font-family:${t.font};">${label}</td>
    <td class="info-value" style="padding:10px 14px;font-size:13px;border-bottom:1px solid ${t.border};font-weight:600;color:${t.text};font-family:${t.font};">${value}</td>
  </tr>`;

const htmlInfoTable = (rows: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${rows}</table>`;

const htmlButton = (
  text: string,
  href: string,
  variant: "primary" | "outline" = "primary",
) => {
  if (variant === "outline") {
    return `<a href="${href}" target="_blank" style="display:inline-block;border:1.5px solid ${t.border};color:${t.text};padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:500;font-size:13px;font-family:${t.font};">${text}</a>`;
  }
  return `<a href="${href}" target="_blank" style="display:inline-block;background-color:${t.accent};color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;font-family:${t.font};">${text}</a>`;
};

const htmlWarningBox = (text: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr>
      <td style="background:#fffbeb;border:1px solid #fde68a;border-left:4px solid ${t.warning};border-radius:8px;padding:14px 18px;font-size:12px;color:${t.warning};line-height:1.5;font-family:${t.font};">
        ${icons.warn} ${text}
      </td>
    </tr>
  </table>`;

const htmlSuccessBox = (text: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr>
      <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid ${t.success};border-radius:8px;padding:14px 18px;font-size:12px;color:${t.success};line-height:1.5;font-family:${t.font};">
        ${icons.check} ${text}
      </td>
    </tr>
  </table>`;

const htmlHighlightBox = (innerHtml: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr>
      <td style="background:${t.mutedBg};border:1px solid ${t.border};border-radius:8px;padding:16px 20px;">
        ${innerHtml}
      </td>
    </tr>
  </table>`;

// ─── Format Helpers ─────────────────────────────────────────────────────────

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

// ─── Core Send Function ────────────────────────────────────────────────────

export interface EmailOptions {
  to: string;
  cc?: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const mailOptions = {
      from: env.smtp.from,
      to: options.to,
      cc: options.cc || undefined,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId} to ${options.to}`);
    return true;
  } catch (error) {
    logger.error("Email send failed:", error);
    return false;
  }
};

// ─── OTP Email ──────────────────────────────────────────────────────────────

export const sendOTPEmail = async (
  to: string,
  otp: string,
  purpose: string,
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
    master_activation: "An OTP has been requested to activate a master record.",
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
    ${htmlSubtitle(descText)}

    <!-- OTP Code -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td class="otp-code-cell" style="background:${t.primary};color:#ffffff;font-size:36px;font-weight:800;letter-spacing:12px;padding:20px 40px;border-radius:12px;font-family:'Courier New',Courier,monospace;text-align:center;">
                ${otp}
              </td>
            </tr>
          </table>
          <p style="font-size:12px;color:${t.textMuted};margin-top:12px;font-family:${t.font};">
            This OTP expires in <strong style="color:${t.text};">${env.otp.expiryMinutes} minutes</strong>
          </p>
        </td>
      </tr>
    </table>

    ${htmlInfoTable(
      htmlInfoRow("Purpose", htmlBadge(purposeLabel, "info")) +
        htmlInfoRow(
          "Valid Until",
          formatDateTime(new Date(Date.now() + env.otp.expiryMinutes * 60000)),
        ),
    )}

    ${htmlWarningBox(
      `<strong>Security Notice:</strong> Do not share this OTP with anyone. Ecstatics staff will never ask for your OTP. If you did not request this, please ignore this email or contact support immediately.`,
    )}
  `;

  return sendEmail({
    to,
    subject: `OTP for ${purposeLabel} - Ecstatics Spaces`,
    html: emailLayout(content, `Your OTP is ${otp}`),
    text: `Your OTP for ${purposeLabel} is: ${otp}. Valid for ${env.otp.expiryMinutes} minutes. Do not share this with anyone.`,
  });
};

// ─── Project Email ──────────────────────────────────────────────────────────

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
  cc?: string,
): Promise<boolean> => {
  const typeConfig = {
    created: {
      title: "New Project Created",
      subtitle: "A new project has been created and is ready for review.",
      badge: htmlBadge("Created", "info"),
      icon: icons.project,
    },
    sent: {
      title: "Project Quotation",
      subtitle: "Please find the project quotation details below.",
      badge: htmlBadge("Sent", "warning"),
      icon: icons.mail,
    },
    revised: {
      title: "Project Revised",
      subtitle: "The project has been revised with updated details.",
      badge: htmlBadge("Revised", "warning"),
      icon: icons.project,
    },
    approved: {
      title: "Project Approved",
      subtitle: "The project has been approved successfully.",
      badge: htmlBadge("Approved", "success"),
      icon: icons.check,
    },
  };

  const config = typeConfig[type];
  const appUrl = env.cors.origin || "http://localhost:5173";

  // Build items table rows
  const itemsRows = data.items
    .map(
      (item, i) => `
    <tr>
      <td class="items-td" style="padding:10px 14px;font-size:13px;border-bottom:1px solid ${t.border};text-align:center;font-family:${t.font};">${i + 1}</td>
      <td class="items-td" style="padding:10px 14px;font-size:13px;border-bottom:1px solid ${t.border};font-family:${t.font};">
        <strong style="color:${t.text};">${item.productCode}</strong><br>
        <span style="font-size:11px;color:${t.textMuted};">${item.productName}</span>
      </td>
      <td class="items-td" style="padding:10px 14px;font-size:13px;border-bottom:1px solid ${t.border};text-align:center;font-family:${t.font};">${item.quantity}</td>
      <td class="items-td" style="padding:10px 14px;font-size:13px;border-bottom:1px solid ${t.border};text-align:right;font-variant-numeric:tabular-nums;font-family:${t.font};">${formatCurrency(item.finalPrice)}</td>
      <td class="items-td" style="padding:10px 14px;font-size:13px;border-bottom:1px solid ${t.border};text-align:right;font-variant-numeric:tabular-nums;font-family:${t.font};">${formatCurrency(item.total)}</td>
    </tr>`,
    )
    .join("");

  const content = `
    ${htmlTitle(config.icon, config.title)}
    ${htmlSubtitle(`Dear ${data.recipientName},`)}
    ${htmlSubtitle(config.subtitle)}

    ${htmlInfoTable(
      htmlInfoRow(
        "Project No",
        `<strong>${data.projectNo}</strong> ${config.badge}`,
      ) +
        htmlInfoRow("Customer", data.customerName) +
        htmlInfoRow("Date", formatDate(data.date)) +
        htmlInfoRow("Sales Manager", data.salesPersonName),
    )}

    ${htmlDivider()}

    <h3 style="font-size:15px;font-weight:700;margin-bottom:12px;color:${t.text};font-family:${t.font};">Quotation Items</h3>

    <!-- Items Table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid ${t.border};border-radius:8px;overflow:hidden;">
      <thead>
        <tr>
          <th class="items-th" style="background:${t.mutedBg};padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${t.textSecondary};text-align:center;border-bottom:1.5px solid ${t.border};width:40px;font-family:${t.font};">Sr</th>
          <th class="items-th" style="background:${t.mutedBg};padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${t.textSecondary};text-align:left;border-bottom:1.5px solid ${t.border};font-family:${t.font};">Product</th>
          <th class="items-th" style="background:${t.mutedBg};padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${t.textSecondary};text-align:center;border-bottom:1.5px solid ${t.border};width:60px;font-family:${t.font};">Qty</th>
          <th class="items-th" style="background:${t.mutedBg};padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${t.textSecondary};text-align:right;border-bottom:1.5px solid ${t.border};width:100px;font-family:${t.font};">Price</th>
          <th class="items-th" style="background:${t.mutedBg};padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${t.textSecondary};text-align:right;border-bottom:1.5px solid ${t.border};width:100px;font-family:${t.font};">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        <tr>
          <td colspan="4" style="background:${t.mutedBg};padding:10px 14px;font-weight:700;border-top:1.5px solid ${t.border};text-align:right;font-size:13px;color:${t.text};font-family:${t.font};">Grand Total</td>
          <td style="background:${t.mutedBg};padding:10px 14px;font-weight:700;border-top:1.5px solid ${t.border};text-align:right;font-variant-numeric:tabular-nums;font-size:13px;color:${t.text};font-family:${t.font};">${formatCurrency(data.grandTotal)}</td>
        </tr>
      </tbody>
    </table>

    <!-- GST Breakdown -->
    ${htmlHighlightBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:${t.textSecondary};font-family:${t.font};">Grand Total</td>
          <td style="padding:4px 0;font-size:13px;text-align:right;font-weight:600;font-variant-numeric:tabular-nums;color:${t.text};font-family:${t.font};">${formatCurrency(data.grandTotal)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:${t.textSecondary};font-family:${t.font};">CGST (9%)</td>
          <td style="padding:4px 0;font-size:13px;text-align:right;font-variant-numeric:tabular-nums;color:${t.text};font-family:${t.font};">${formatCurrency(data.cgst)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:${t.textSecondary};font-family:${t.font};">SGST (9%)</td>
          <td style="padding:4px 0;font-size:13px;text-align:right;font-variant-numeric:tabular-nums;color:${t.text};font-family:${t.font};">${formatCurrency(data.sgst)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0 4px;font-size:15px;font-weight:800;border-top:1.5px solid ${t.border};color:${t.text};font-family:${t.font};">Total with GST</td>
          <td style="padding:8px 0 4px;font-size:15px;font-weight:800;text-align:right;border-top:1.5px solid ${t.border};color:${t.accent};font-variant-numeric:tabular-nums;font-family:${t.font};">${formatCurrency(data.grandTotalWithGst)}</td>
        </tr>
      </table>
    `)}

    <!-- Action Buttons -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td align="center">
          ${htmlButton("View Project", `${appUrl}/projects/${data.projectId}`)}
          <br><br>
          ${htmlButton("View PDF", `${appUrl}/projects/${data.projectId}/pdf`, "outline")}
        </td>
      </tr>
    </table>
  `;

  const subject =
    type === "sent"
      ? `Quotation ${data.projectNo} - Ecstatics Spaces`
      : `Project ${data.projectNo} ${type.charAt(0).toUpperCase() + type.slice(1)} - Ecstatics Spaces`;

  return sendEmail({
    to,
    cc,
    subject,
    html: emailLayout(content, `${config.title} - ${data.projectNo}`),
    text: `${config.title}\n\nProject: ${data.projectNo}\nCustomer: ${data.customerName}\nTotal: ${formatCurrency(data.grandTotalWithGst)}\n\nView: ${appUrl}/projects/${data.projectId}`,
  });
};

// ─── Status Update Email ────────────────────────────────────────────────────

export const sendStatusUpdateEmail = async (
  to: string,
  data: {
    recipientName: string;
    projectNo: string;
    projectId: string;
    oldStatus: string;
    newStatus: string;
    updatedBy: string;
  },
): Promise<boolean> => {
  const statusBadgeType = (
    status: string,
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
    ${htmlSubtitle(`Hello ${data.recipientName},`)}
    ${htmlSubtitle(`The status of project <strong style="color:${t.text};">${data.projectNo}</strong> has been updated.`)}

    ${htmlHighlightBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <p style="margin-bottom:8px;font-size:12px;color:${t.textMuted};font-family:${t.font};">Status Changed</p>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 8px;">${htmlBadge(data.oldStatus.charAt(0).toUpperCase() + data.oldStatus.slice(1), statusBadgeType(data.oldStatus))}</td>
                <td style="padding:0 8px;font-size:18px;color:${t.textMuted};">&#8594;</td>
                <td style="padding:0 8px;">${htmlBadge(data.newStatus.charAt(0).toUpperCase() + data.newStatus.slice(1), statusBadgeType(data.newStatus))}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `)}

    ${htmlInfoTable(
      htmlInfoRow("Project No", `<strong>${data.projectNo}</strong>`) +
        htmlInfoRow("Updated By", data.updatedBy) +
        htmlInfoRow("Updated At", formatDateTime(new Date())),
    )}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
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
      `Project ${data.projectNo} status: ${data.newStatus}`,
    ),
  });
};

// ─── Welcome Email ──────────────────────────────────────────────────────────

export const sendWelcomeEmail = async (
  to: string,
  data: {
    name: string;
    email: string;
    role: string;
    tempPassword?: string;
  },
): Promise<boolean> => {
  const appUrl = env.cors.origin || "http://localhost:5173";

  const passwordRow = data.tempPassword
    ? htmlInfoRow(
        "Temp Password",
        `<code style="background:${t.mutedBg};padding:4px 8px;border-radius:4px;font-family:'Courier New',Courier,monospace;font-size:13px;color:${t.text};">${data.tempPassword}</code>`,
      )
    : "";

  const content = `
    ${htmlTitle(icons.user, "Welcome to Ecstatics Spaces!")}
    ${htmlSubtitle(`Hello ${data.name},`)}
    ${htmlSubtitle("Your account has been created successfully.")}

    ${htmlInfoTable(
      htmlInfoRow("Name", data.name) +
        htmlInfoRow("Email", data.email) +
        htmlInfoRow("Role", htmlBadge(data.role, "info")) +
        passwordRow,
    )}

    ${
      data.tempPassword
        ? htmlWarningBox(
            "<strong>Important:</strong> Please change your temporary password after your first login for security.",
          )
        : ""
    }

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td align="center">
          ${htmlButton("Login to Dashboard", `${appUrl}/login`)}
        </td>
      </tr>
    </table>
  `;

  return sendEmail({
    to,
    subject: "Welcome to Ecstatics Spaces",
    html: emailLayout(content, `Welcome ${data.name}! Your account is ready.`),
  });
};

// ─── Approval Notification Email ────────────────────────────────────────────

export const sendApprovalNotificationEmail = async (
  to: string,
  data: {
    recipientName: string;
    entityType: string;
    entityName: string;
    action: "approved" | "rejected";
    approvedBy: string;
    reason?: string;
  },
): Promise<boolean> => {
  const isApproved = data.action === "approved";
  const iconHtml = isApproved ? icons.check : icons.cross;

  const statusBox = isApproved
    ? htmlSuccessBox(
        `<strong>${data.entityName}</strong> has been <strong>approved</strong> by ${data.approvedBy}.${
          data.reason ? `<br><br>Note: ${data.reason}` : ""
        }`,
      )
    : htmlWarningBox(
        `<strong>${data.entityName}</strong> has been <strong>rejected</strong> by ${data.approvedBy}.${
          data.reason ? `<br><br>Reason: ${data.reason}` : ""
        }`,
      );

  const content = `
    ${htmlTitle(
      iconHtml,
      `${data.entityType} ${isApproved ? "Approved" : "Rejected"}`,
    )}
    ${htmlSubtitle(`Hello ${data.recipientName},`)}
    ${htmlSubtitle(
      `Your ${data.entityType.toLowerCase()} request has been ${data.action}.`,
    )}

    ${statusBox}

    ${htmlInfoTable(
      htmlInfoRow("Type", htmlBadge(data.entityType, "info")) +
        htmlInfoRow("Name", `<strong>${data.entityName}</strong>`) +
        htmlInfoRow(
          isApproved ? "Approved By" : "Rejected By",
          data.approvedBy,
        ) +
        htmlInfoRow("Date", formatDateTime(new Date())),
    )}
  `;

  return sendEmail({
    to,
    subject: `${data.entityType} ${data.action}: ${data.entityName}`,
    html: emailLayout(
      content,
      `${data.entityType} ${data.entityName} has been ${data.action}`,
    ),
  });
};

// ─── Backward Compatibility ─────────────────────────────────────────────────

export const sendQuotationEmail = async (
  to: string,
  quotationNo: string,
  customerName: string,
  _pdfBuffer?: Buffer,
): Promise<boolean> => {
  const content = `
    ${htmlTitle(icons.project, "Project Quotation")}
    ${htmlSubtitle(`Dear ${customerName},`)}
    ${htmlSubtitle(
      `Please find the quotation <strong style="color:${t.text};">${quotationNo}</strong> details.`,
    )}

    ${htmlInfoTable(
      htmlInfoRow("Quotation No", `<strong>${quotationNo}</strong>`) +
        htmlInfoRow("Customer", customerName) +
        htmlInfoRow("Date", formatDate(new Date())),
    )}

    <p style="font-size:14px;color:${t.textSecondary};margin-top:16px;line-height:1.5;font-family:${t.font};">
      Thank you for your interest in our products. For any queries, please feel free to contact us.
    </p>

    <p style="font-size:14px;margin-top:24px;line-height:1.5;color:${t.text};font-family:${t.font};">
      Best regards,<br>
      <strong>Ecstatics Spaces India Pvt. Ltd.</strong>
    </p>
  `;

  return sendEmail({
    to,
    subject: `Quotation ${quotationNo} - Ecstatics Spaces`,
    html: emailLayout(content, `Quotation ${quotationNo} for ${customerName}`),
  });
};
