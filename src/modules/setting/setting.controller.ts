import { Request, Response } from "express";
import { settingService } from "./setting.service";
import { logger } from "../../utils/logger";
import { notificationSettingsService } from "../../services/notificationSettings.service";
import { whatsappService } from "../../services/whatsapp.service";

export const getSetting = async (req: Request, res: Response) => {
  try {
    const key = req.params.key as string;
    const value = await settingService.getSetting(key);
    res.status(200).json({
      success: true,
      data: value,
    });
  } catch (error: any) {
    logger.error("Error in getSetting:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get setting",
    });
  }
};

export const updateSetting = async (req: Request, res: Response) => {
  try {
    const key = req.params.key as string;
    const value = req.body;
    
    const updatedValue = await settingService.updateSetting(key, value);
    
    res.status(200).json({
      success: true,
      message: "Setting updated successfully",
      data: updatedValue,
    });
  } catch (error: any) {
    logger.error("Error in updateSetting:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update setting",
    });
  }
};

export const getWhatsAppTemplates = async (_req: Request, res: Response) => {
  try {
    const config = await notificationSettingsService.getWhatsAppConfig();
    if (!config.apiKey) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "WhatsApp API key is not configured",
      });
    }

    const result = await whatsappService.listTemplates(config);
    res.status(200).json({
      success: true,
      data: result.items,
      meta: {
        status: result.status,
      },
    });
  } catch (error: any) {
    logger.error("Error in getWhatsAppTemplates:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch WhatsApp templates",
    });
  }
};

export const syncWhatsAppConfig = async (req: Request, res: Response) => {
  try {
    const existingConfig = await notificationSettingsService.getWhatsAppConfig();
    const apiKey = req.body?.apiKey || existingConfig.apiKey;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: "WhatsApp API key is required before sync",
      });
    }

    const result = await whatsappService.listWabas({ apiKey });
    const wabas = result.items || [];
    const selectedWaba =
      wabas.find((waba) => waba.status === "ACTIVE" && waba.phoneNumbers.length > 0) ||
      wabas.find((waba) => waba.phoneNumbers.length > 0) ||
      wabas[0];

    if (!selectedWaba) {
      return res.status(400).json({
        success: false,
        message: "No WhatsApp Business Account found for this API key",
      });
    }

    const selectedPhone =
      selectedWaba.phoneNumbers.find((phone) => phone.status === "CONNECTED") ||
      selectedWaba.phoneNumbers[0];

    if (!selectedPhone) {
      return res.status(400).json({
        success: false,
        message: "No connected phone number found for this WABA",
      });
    }

    const syncedConfig = {
      apiKey,
      wabaId: selectedWaba.metaWabaId || selectedWaba.id,
      phoneNumberId: selectedPhone.metaPhoneId || selectedPhone.id,
      webhookSecret: existingConfig.webhookSecret || "",
      inboundsageWabaRecordId: selectedWaba.id,
      inboundsagePhoneRecordId: selectedPhone.id,
      wabaName: selectedWaba.name || null,
      wabaStatus: selectedWaba.status || null,
      metaWabaId: selectedWaba.metaWabaId || null,
      businessId: selectedWaba.businessId || null,
      currency: selectedWaba.currency || null,
      displayNumber: selectedPhone.displayNumber || null,
      verifiedName: selectedPhone.verifiedName || null,
      phoneStatus: selectedPhone.status || null,
      qualityRating: selectedPhone.qualityRating || null,
      qualityDisplay: selectedPhone.qualityDisplay || null,
      messagingTierLabel: selectedPhone.messagingTierLabel || null,
      remainingQuota: selectedPhone.remainingQuota ?? null,
      dailyLimit: selectedPhone.dailyLimit ?? null,
      sentToday: selectedPhone.sentToday ?? null,
      syncedAt: new Date().toISOString(),
    };

    await settingService.updateSetting("whatsapp_config", syncedConfig);

    res.status(200).json({
      success: true,
      message: "WhatsApp configuration synced successfully",
      data: {
        config: syncedConfig,
        wabas,
      },
    });
  } catch (error: any) {
    logger.error("Error in syncWhatsAppConfig:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to sync WhatsApp configuration",
    });
  }
};
