import crypto from "crypto";
import https from "https";
import { URL } from "url";
import { NotificationType, WhatsAppConfig } from "./notification.constants";

export interface WhatsAppTemplateParameter {
  type: "text";
  text: string;
}

export interface WhatsAppTemplatePayload {
  to: string;
  templateName: string;
  parameters: string[];
  buttonUrlParameter?: string;
  headerDocumentUrl?: string;
  headerDocumentFilename?: string;
  notificationType: NotificationType;
  config: WhatsAppConfig;
  idempotencyKey: string;
}

export interface WhatsAppSendResult {
  ok: boolean;
  status: number;
  body: any;
  providerMessageId?: string | null;
  providerStatus?: string | null;
  errorMessage?: string | null;
  requestPayload: any;
}

export interface InboundSageTemplateSummary {
  id: string;
  name: string;
  status: string;
  category?: string | null;
  language?: string | null;
  components?: any;
}

export interface InboundSagePhoneNumberSummary {
  id: string;
  metaPhoneId?: string | null;
  displayNumber?: string | null;
  verifiedName?: string | null;
  status?: string | null;
  qualityRating?: string | null;
  messagingLimitTier?: string | null;
  qualityDisplay?: string | null;
  messagingTierLabel?: string | null;
  remainingQuota?: number | null;
  dailyLimit?: number | null;
  sentToday?: number | null;
}

export interface InboundSageWabaSummary {
  id: string;
  metaWabaId?: string | null;
  businessId?: string | null;
  name: string;
  currency?: string | null;
  timezoneId?: string | null;
  qualityRating?: string | null;
  messagingTier?: string | null;
  status?: string | null;
  isTier0?: boolean | null;
  phoneNumbers: InboundSagePhoneNumberSummary[];
}

const requestJson = async (
  method: string,
  urlString: string,
  headers: Record<string, string>,
  body?: any,
): Promise<{ status: number; body: any }> => {
  const url = new URL(urlString);
  const rawBody = body ? JSON.stringify(body) : "";

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method,
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        protocol: url.protocol,
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(rawBody).toString(),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let parsed: any = text;
          try {
            parsed = text ? JSON.parse(text) : {};
          } catch {
            parsed = text;
          }
          resolve({
            status: res.statusCode || 500,
            body: parsed,
          });
        });
      },
    );

    req.on("error", reject);
    if (rawBody) req.write(rawBody);
    req.end();
  });
};

export class WhatsAppService {
  async listWabas(config: Pick<WhatsAppConfig, "apiKey">) {
    const response = await requestJson(
      "GET",
      "https://api.inboundsage.com/v1/wabas",
      {
        Authorization: `Bearer ${config.apiKey}`,
      },
    );

    const items = Array.isArray(response.body) ? response.body : response.body?.items || [];

    return {
      status: response.status,
      items: items.map((item: any) => ({
        id: item.id,
        metaWabaId: item.metaWabaId || null,
        businessId: item.businessId || null,
        name: item.name,
        currency: item.currency || null,
        timezoneId: item.timezoneId || null,
        qualityRating: item.qualityRating || null,
        messagingTier: item.messagingTier || null,
        status: item.status || null,
        isTier0: item.isTier0 ?? null,
        phoneNumbers: Array.isArray(item.phoneNumbers)
          ? item.phoneNumbers.map((phone: any) => ({
              id: phone.id,
              metaPhoneId: phone.metaPhoneId || null,
              displayNumber: phone.displayNumber || null,
              verifiedName: phone.verifiedName || null,
              status: phone.status || null,
              qualityRating: phone.qualityRating || null,
              messagingLimitTier: phone.messagingLimitTier || null,
              qualityDisplay: phone.qualityDisplay || null,
              messagingTierLabel: phone.messagingTierLabel || null,
              remainingQuota: phone.remainingQuota ?? null,
              dailyLimit: phone.dailyLimit ?? null,
              sentToday: phone.sentToday ?? null,
            }))
          : [],
      })) as InboundSageWabaSummary[],
      raw: response.body,
    };
  }

  async listTemplates(config: WhatsAppConfig) {
    const response = await requestJson(
      "GET",
      "https://api.inboundsage.com/v1/templates",
      {
        Authorization: `Bearer ${config.apiKey}`,
      },
    );

    const items = Array.isArray(response.body?.items) ? response.body.items : [];
    return {
      status: response.status,
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        status: item.status,
        category: item.category || null,
        language: item.language || null,
        components: item.components || null,
      })) as InboundSageTemplateSummary[],
      raw: response.body,
    };
  }

  buildTemplateRequest(payload: WhatsAppTemplatePayload) {
    const components: any[] = [];

    if (payload.headerDocumentUrl) {
      components.push({
        type: "header",
        parameters: [
          {
            type: "document",
            document: {
              link: payload.headerDocumentUrl,
              filename: payload.headerDocumentFilename || "document.pdf",
            },
          },
        ],
      });
    }

    if (payload.parameters.length) {
      components.push({
        type: "body",
        parameters: payload.parameters.map((text) => ({
          type: "text",
          text,
        })),
      });
    }

    if (payload.buttonUrlParameter) {
      components.push({
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [
          {
            type: "text",
            text: payload.buttonUrlParameter,
          },
        ],
      });
    }

    return {
      waba_id: payload.config.wabaId,
      phone_number_id: payload.config.phoneNumberId,
      to: payload.to,
      type: "template",
      template: {
        name: payload.templateName,
        language: "en",
        components: components.length ? components : undefined,
      },
    };
  }

  async sendTemplate(
    payload: WhatsAppTemplatePayload,
  ): Promise<WhatsAppSendResult> {
    const requestPayload = this.buildTemplateRequest(payload);
    console.log("WhatsApp template request:", JSON.stringify(requestPayload, null, 2));
    try {
      const response = await requestJson(
        "POST",
        "https://api.inboundsage.com/v1/messages/send",
        {
          Authorization: `Bearer ${payload.config.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": payload.idempotencyKey,
        },
        requestPayload,
      );
      console.log("WhatsApp template headers:", {
          Authorization: `Bearer ${payload.config.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": payload.idempotencyKey,
        });
      console.log("WhatsApp template response:", JSON.stringify(response.body, null, 2));
      const ok = response.status >= 200 && response.status < 300;
      return {
        ok,
        status: response.status,
        body: response.body,
        providerMessageId: response.body?.meta_message_id || null,
        providerStatus: response.body?.status || null,
        errorMessage: ok
          ? null
          : response.body?.message || "WhatsApp send failed",
        requestPayload,
      };
    } catch (error: any) {
      return {
        ok: false,
        status: 500,
        body: null,
        providerMessageId: null,
        providerStatus: "FAILED",
        errorMessage: error?.message || "WhatsApp send failed",
        requestPayload,
      };
    }
  }

  verifySignature(rawBody: Buffer, signature: string, secret: string) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (!signature || signature.length !== expected.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(signature || "", "utf8"),
      Buffer.from(expected, "utf8"),
    );
  }
}

export const whatsappService = new WhatsAppService();
