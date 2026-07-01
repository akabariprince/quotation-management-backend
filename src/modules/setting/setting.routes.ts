import { Router } from "express";
import {
  getSetting,
  getWhatsAppTemplates,
  syncWhatsAppConfig,
  updateSetting,
} from "./setting.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.post("/whatsapp/sync", syncWhatsAppConfig);
router.get("/whatsapp/templates", getWhatsAppTemplates);
router.get("/:key", getSetting);
router.put("/:key", updateSetting);

export default router;
