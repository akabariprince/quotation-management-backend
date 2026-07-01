import { Router } from "express";
import { webhookController } from "./webhook.controller";

const router = Router();

router.post("/inboundsage", webhookController.inboundSage);

export default router;
