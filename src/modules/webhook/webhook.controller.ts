import { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { notificationSettingsService } from "../../services/notificationSettings.service";
import { whatsappService } from "../../services/whatsapp.service";
import { notificationService } from "../../services/notification.service";
import { ApiError } from "../../utils/ApiError";

class WebhookController {
  inboundSage = asyncHandler(async (req: Request, res: Response) => {
    const rawBody = req.body as Buffer;
    const signature = String(req.headers["x-inboundsage-signature"] || "");
    const config = await notificationSettingsService.getWhatsAppConfig();

    if (!config.webhookSecret) {
      throw ApiError.forbidden("Webhook secret is not configured");
    }

    const expected = whatsappService.verifySignature(
      rawBody,
      signature,
      config.webhookSecret,
    );
    if (!expected) {
      throw ApiError.forbidden("Invalid webhook signature");
    }

    const payload = JSON.parse(rawBody.toString("utf8"));
    const providerStatus =
      payload?.data?.status ||
      payload?.type?.replace("message.", "") ||
      payload?.status;
    const providerMessageId =
      payload?.data?.meta_message_id ||
      payload?.data?.message_id ||
      payload?.data?.metaMessageId;

    if (providerMessageId && providerStatus) {
      await notificationService.updateWhatsAppStatusByProviderMessageId({
        providerMessageId,
        providerStatus,
        payload,
        eventType: payload?.type || "unknown",
      });
    }

    res.json(ApiResponse.success({ received: true }, "Webhook received"));
  });
}

export const webhookController = new WebhookController();
