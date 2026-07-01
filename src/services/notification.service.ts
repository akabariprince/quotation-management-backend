import crypto from "crypto";
import { EmailLog } from "../models";
import { logger } from "../utils/logger";
import {
  NotificationChannel,
  NotificationType,
} from "./notification.constants";
import { notificationSettingsService } from "./notificationSettings.service";
import { whatsappService } from "./whatsapp.service";

interface BaseNotificationLogInput {
  channel: NotificationChannel;
  recipient: string;
  toEmail?: string | null;
  toPhone?: string | null;
  subject: string;
  type: string;
  referenceId?: string | null;
  referenceType?: string | null;
  sentBy?: string | null;
  status: "queued" | "pending" | "sent" | "delivered" | "read" | "failed";
  providerMessageId?: string | null;
  providerStatus?: string | null;
  requestPayload?: any;
  responsePayload?: any;
  errorMessage?: string | null;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  readAt?: Date | null;
  failedAt?: Date | null;
}

interface DispatchEmailInput {
  notificationType: NotificationType;
  recipient: string;
  subject: string;
  sendFn: () => Promise<boolean>;
  toEmail: string;
  referenceId?: string | null;
  referenceType?: string | null;
  sentBy?: string | null;
  requestPayload?: any;
}

interface DispatchWhatsAppInput {
  notificationType: NotificationType;
  recipient: string;
  subject: string;
  toPhone: string;
  templateParameters: string[];
  headerDocumentUrl?: string;
  headerDocumentFilename?: string;
  referenceId?: string | null;
  referenceType?: string | null;
  sentBy?: string | null;
  requestPayload?: any;
}

const mapProviderStatus = (
  status: string | null | undefined,
): BaseNotificationLogInput["status"] => {
  switch ((status || "").toUpperCase()) {
    case "QUEUED":
      return "queued";
    case "SCHEDULED":
      return "pending";
    case "SENT":
      return "sent";
    case "DELIVERED":
      return "delivered";
    case "READ":
      return "read";
    case "FAILED":
      return "failed";
    default:
      return "sent";
  }
};

export class NotificationService {
  private extractTemplateVariableNumbers(template: any) {
    const values = new Set<number>();
    const strings: string[] = [];
    const pushString = (value: any) => {
      if (typeof value === "string") strings.push(value);
    };

    const form = template?.components?.inboundsageForm;
    if (form) {
      pushString(form.body);
      pushString(form.footer);
      pushString(form.headerText);
    }

    const meta = Array.isArray(template?.components?.meta)
      ? template.components.meta
      : [];
    for (const component of meta) {
      pushString(component?.text);
      pushString(component?.body);
    }

    for (const text of strings) {
      const matches = text.match(/\{\{(\d+)\}\}/g) || [];
      for (const match of matches) {
        const parsed = Number(match.replace(/[{}]/g, ""));
        if (Number.isFinite(parsed)) values.add(parsed);
      }
    }

    return Array.from(values).sort((a, b) => a - b);
  }

  private templateRequiresDocumentHeader(template: any) {
    const headerType = String(
      template?.components?.inboundsageForm?.headerType ||
        template?.components?.meta?.find?.((item: any) => item?.type === "HEADER")?.format ||
        "",
    ).toUpperCase();
    return headerType === "DOC" || headerType === "DOCUMENT";
  }

  private templateHasDynamicUrlButton(template: any) {
    const meta = Array.isArray(template?.components?.meta)
      ? template.components.meta
      : [];

    const metaButtons = meta.find((item: any) => item?.type === "BUTTONS");
    const hasDynamicMetaUrlButton = Array.isArray(metaButtons?.buttons)
      && metaButtons.buttons.some(
        (button: any) =>
          String(button?.type || "").toUpperCase() === "URL" &&
          /\{\{\d+\}\}/.test(String(button?.url || "")),
      );

    const formButtons = Array.isArray(template?.components?.inboundsageForm?.buttons)
      ? template.components.inboundsageForm.buttons
      : [];
    const hasOtpFormButton = formButtons.some(
      (button: any) => String(button?.type || "").toUpperCase() === "OTP",
    );

    return hasDynamicMetaUrlButton || hasOtpFormButton;
  }

  async createLog(data: BaseNotificationLogInput) {
    return EmailLog.create({
      channel: data.channel,
      recipient: data.recipient,
      toEmail: data.toEmail || null,
      toPhone: data.toPhone || null,
      subject: data.subject,
      type: data.type,
      referenceId: data.referenceId || null,
      referenceType: data.referenceType || null,
      status: data.status,
      providerMessageId: data.providerMessageId || null,
      providerStatus: data.providerStatus || null,
      requestPayload: data.requestPayload || null,
      responsePayload: data.responsePayload || null,
      errorMessage: data.errorMessage || null,
      sentBy: data.sentBy || null,
      sentAt: data.sentAt || null,
      deliveredAt: data.deliveredAt || null,
      readAt: data.readAt || null,
      failedAt: data.failedAt || null,
    });
  }

  async dispatchEmail(input: DispatchEmailInput) {
    const enabled = await notificationSettingsService.isChannelEnabled(
      input.notificationType,
      "email",
    );
    if (!enabled) return null;

    try {
      const sent = await input.sendFn();
      return this.createLog({
        channel: "email",
        recipient: input.recipient,
        toEmail: input.toEmail,
        subject: input.subject,
        type: input.notificationType,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
        status: sent ? "sent" : "failed",
        sentBy: input.sentBy,
        requestPayload: input.requestPayload,
        sentAt: sent ? new Date() : null,
        failedAt: sent ? null : new Date(),
        errorMessage: sent ? null : "Email send failed",
      });
    } catch (error: any) {
      logger.error("Email notification dispatch failed:", error);
      return this.createLog({
        channel: "email",
        recipient: input.recipient,
        toEmail: input.toEmail,
        subject: input.subject,
        type: input.notificationType,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
        status: "failed",
        sentBy: input.sentBy,
        requestPayload: input.requestPayload,
        failedAt: new Date(),
        errorMessage: error?.message || "Email send failed",
      });
    }
  }

  async dispatchWhatsApp(input: DispatchWhatsAppInput) {
    const enabled = await notificationSettingsService.isChannelEnabled(
      input.notificationType,
      "whatsapp",
    );
    if (!enabled) return null;

    const config = await notificationSettingsService.getWhatsAppConfig();
    const templates = await notificationSettingsService.getWhatsAppTemplates();
    const templateName = templates[input.notificationType];

    if (!config.apiKey || !config.wabaId || !config.phoneNumberId || !templateName) {
      return this.createLog({
        channel: "whatsapp",
        recipient: input.recipient,
        toPhone: input.toPhone,
        subject: input.subject,
        type: input.notificationType,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
        status: "failed",
        sentBy: input.sentBy,
        requestPayload: {
          ...input.requestPayload,
          templateParameters: input.templateParameters,
        },
        failedAt: new Date(),
        errorMessage:
          "WhatsApp configuration or template name is missing in settings",
      });
    }

    const templateList = await whatsappService.listTemplates(config);
    const selectedTemplate = templateList.items.find(
      (item) => item.name === templateName,
    );

    if (!selectedTemplate) {
      return this.createLog({
        channel: "whatsapp",
        recipient: input.recipient,
        toPhone: input.toPhone,
        subject: input.subject,
        type: input.notificationType,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
        status: "failed",
        sentBy: input.sentBy,
        requestPayload: {
          ...input.requestPayload,
          templateParameters: input.templateParameters,
          templateName,
        },
        failedAt: new Date(),
        errorMessage: `Selected WhatsApp template "${templateName}" was not found in InboundSage`,
      });
    }

    const requiredVariables = this.extractTemplateVariableNumbers(selectedTemplate);
    if (requiredVariables.length !== input.templateParameters.length) {
      return this.createLog({
        channel: "whatsapp",
        recipient: input.recipient,
        toPhone: input.toPhone,
        subject: input.subject,
        type: input.notificationType,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
        status: "failed",
        sentBy: input.sentBy,
        requestPayload: {
          ...input.requestPayload,
          templateParameters: input.templateParameters,
          templateName,
          templateRequiredVariables: requiredVariables,
        },
        failedAt: new Date(),
        errorMessage:
          `Template "${templateName}" expects ${requiredVariables.length} variable(s), but the app supplied ${input.templateParameters.length}`,
      });
    }

    if (
      this.templateRequiresDocumentHeader(selectedTemplate) &&
      !input.headerDocumentUrl
    ) {
      return this.createLog({
        channel: "whatsapp",
        recipient: input.recipient,
        toPhone: input.toPhone,
        subject: input.subject,
        type: input.notificationType,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
        status: "failed",
        sentBy: input.sentBy,
        requestPayload: {
          ...input.requestPayload,
          templateParameters: input.templateParameters,
          templateName,
        },
        failedAt: new Date(),
        errorMessage:
          `Template "${templateName}" requires a document header, but no document URL was supplied`,
      });
    }

    const result = await whatsappService.sendTemplate({
      to: input.toPhone,
      templateName,
      parameters: input.templateParameters,
      buttonUrlParameter:
        this.templateHasDynamicUrlButton(selectedTemplate) &&
        input.templateParameters.length > 0
          ? input.templateParameters[0]
          : undefined,
      headerDocumentUrl: input.headerDocumentUrl,
      headerDocumentFilename: input.headerDocumentFilename,
      notificationType: input.notificationType,
      config,
      idempotencyKey: crypto.randomUUID(),
    });

    return this.createLog({
      channel: "whatsapp",
      recipient: input.recipient,
      toPhone: input.toPhone,
      subject: input.subject,
      type: input.notificationType,
      referenceId: input.referenceId,
      referenceType: input.referenceType,
      status: mapProviderStatus(result.providerStatus),
      providerMessageId: result.providerMessageId,
      providerStatus: result.providerStatus,
      requestPayload: result.requestPayload,
      responsePayload: result.body,
      sentBy: input.sentBy,
      sentAt: result.ok ? new Date() : null,
      failedAt: result.ok ? null : new Date(),
      errorMessage: result.errorMessage || null,
    });
  }

  async updateWhatsAppStatusByProviderMessageId(params: {
    providerMessageId: string;
    providerStatus: string;
    payload: any;
    eventType: string;
  }) {
    const log = await EmailLog.findOne({
      where: {
        channel: "whatsapp",
        providerMessageId: params.providerMessageId,
      },
      order: [["createdAt", "DESC"]],
    });

    if (!log) return null;

    const status = mapProviderStatus(params.providerStatus);
    const updateData: Record<string, any> = {
      status,
      providerStatus: params.providerStatus,
      responsePayload: {
        ...(log.responsePayload || {}),
        lastWebhookEvent: params.eventType,
        lastWebhookPayload: params.payload,
      },
    };

    if (status === "sent") updateData.sentAt = log.sentAt || new Date();
    if (status === "delivered") updateData.deliveredAt = new Date();
    if (status === "read") updateData.readAt = new Date();
    if (status === "failed") {
      updateData.failedAt = new Date();
      updateData.errorMessage =
        params.payload?.data?.error?.message ||
        log.errorMessage ||
        "WhatsApp delivery failed";
    }

    await log.update(updateData);
    return log;
  }
}

export const notificationService = new NotificationService();
