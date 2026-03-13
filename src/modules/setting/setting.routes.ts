import { Router } from "express";
import { getSetting, updateSetting } from "./setting.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/:key", getSetting);
router.put("/:key", updateSetting);

export default router;
