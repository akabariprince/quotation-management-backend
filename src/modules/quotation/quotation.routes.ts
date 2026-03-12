import { Router } from "express";
import { quotationController } from "./quotation.controller";
import {
  authenticate,
  requirePermission,
} from "../../middleware/auth.middleware";
import { quotationImageUpload } from "../../config/multer.config";
import { PERMISSIONS } from "../../utils/permissions";

const router = Router();

router.use(authenticate);

router.get("/", quotationController.getAll);
router.get("/:id", quotationController.getById);
router.post(
  "/",
  quotationImageUpload.array("images", 10),
  quotationController.create,
);
router.put(
  "/:id",
  quotationImageUpload.array("images", 10),
  quotationController.update,
);
router.post(
  "/:id/images",
  quotationImageUpload.array("images", 10),
  quotationController.uploadImages,
);
router.delete("/:id", quotationController.delete);

export default router;
