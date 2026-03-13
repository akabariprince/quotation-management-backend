import { Request, Response } from "express";
import { settingService } from "./setting.service";
import { logger } from "../../utils/logger";

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
