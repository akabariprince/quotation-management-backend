import { settingService } from "../modules/setting/setting.service";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_WHATSAPP_CONFIG,
  DEFAULT_WHATSAPP_TEMPLATES,
  NotificationPreferences,
  WhatsAppConfig,
  WhatsAppTemplateSettings,
  SETTING_KEYS,
} from "./notification.constants";

export class NotificationSettingsService {
  async getWhatsAppConfig(): Promise<WhatsAppConfig> {
    const stored = await settingService.getSetting(
      SETTING_KEYS.whatsappConfig,
      {},
    );
    return { ...DEFAULT_WHATSAPP_CONFIG, ...(stored || {}) };
  }

  async getWhatsAppTemplates(): Promise<WhatsAppTemplateSettings> {
    const stored = await settingService.getSetting(
      SETTING_KEYS.whatsappTemplates,
      {},
    );
    return { ...DEFAULT_WHATSAPP_TEMPLATES, ...(stored || {}) };
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const stored = await settingService.getSetting(
      SETTING_KEYS.notificationPreferences,
      {},
    );

    return Object.entries(DEFAULT_NOTIFICATION_PREFERENCES).reduce(
      (acc, [type, defaults]) => {
        const notificationType = type as keyof NotificationPreferences;
        const storedValue = stored?.[type] || {};
        acc[notificationType] = {
          email: storedValue.email ?? defaults.email,
          whatsapp: storedValue.whatsapp ?? defaults.whatsapp,
        };
        return acc;
      },
      {} as NotificationPreferences,
    );
  }

  async isChannelEnabled(
    type: keyof NotificationPreferences,
    channel: "email" | "whatsapp",
  ): Promise<boolean> {
    const preferences = await this.getNotificationPreferences();
    return preferences[type]?.[channel] ?? false;
  }
}

export const notificationSettingsService = new NotificationSettingsService();
