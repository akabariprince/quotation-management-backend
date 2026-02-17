// src/modules/project/project.routes.ts

import { Router } from "express";
import { projectController } from "./project.controller";
import { validate } from "../../middleware/validate.middleware";
import {
  authenticate,
  requirePermission,
} from "../../middleware/auth.middleware";
import {
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
} from "./project.validation";
import { PERMISSIONS } from "../../utils/permissions";

const router = Router();

router.use(authenticate);

router.get(
  "/stats",
  requirePermission(PERMISSIONS.PROJECT_VIEW),
  projectController.getStats,
);
router.get(
  "/next-number",
  requirePermission(PERMISSIONS.PROJECT_CREATE),
  projectController.getNextNumber,
);

router.get(
  "/",
  requirePermission(PERMISSIONS.PROJECT_VIEW),
  projectController.getAll,
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.PROJECT_VIEW),
  projectController.getById,
);

router.post(
  "/",
  requirePermission(PERMISSIONS.PROJECT_CREATE),
  validate(createProjectSchema),
  projectController.create,
);
router.put(
  "/:id",
  requirePermission(PERMISSIONS.PROJECT_EDIT),
  validate(updateProjectSchema),
  projectController.update,
);
router.patch(
  "/:id/status",
  requirePermission(PERMISSIONS.PROJECT_EDIT),
  validate(updateProjectStatusSchema),
  projectController.updateStatus,
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.PROJECT_DELETE),
  projectController.delete,
);
router.post(
  "/:id/duplicate",
  requirePermission(PERMISSIONS.PROJECT_CREATE),
  projectController.duplicate,
);
router.post("/:id/send-email", projectController.sendEmail);

router.get(
  "/:id/pdf",
  requirePermission(PERMISSIONS.PROJECT_VIEW),
  projectController.downloadPDF,
);

router.post(
  "/:id/regenerate-pdf",
  requirePermission(PERMISSIONS.PROJECT_EDIT),
  projectController.regeneratePDF,
);

export default router;
