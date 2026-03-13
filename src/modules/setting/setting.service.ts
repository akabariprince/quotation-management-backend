import Setting from "../../models/Setting.model";

export class SettingService {
  /**
   * Get a setting by key.
   * If the setting doesn't exist, returns the provided default value.
   */
  async getSetting(key: string, defaultValue: any = null): Promise<any> {
    const setting = await Setting.findOne({ where: { key } });
    if (setting) {
      return setting.value;
    }
    return defaultValue;
  }

  /**
   * Create or update a setting.
   */
  async updateSetting(key: string, value: any): Promise<any> {
    const [setting, created] = await Setting.upsert({
      key,
      value,
    });
    return setting.value;
  }
}

export const settingService = new SettingService();
