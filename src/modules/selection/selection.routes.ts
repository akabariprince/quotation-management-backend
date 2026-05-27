import { Router } from "express";
import { selectionController } from "./selection.controller";
import { validate } from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import {
  createSelectionSchema,
  updateSelectionSchema,
} from "./selection.validation";

const router = Router();

router.use(authenticate);

router.get("/", selectionController.getAll);
router.get("/:id", selectionController.getById);
router.post("/", validate(createSelectionSchema), selectionController.create);
router.put("/:id", validate(updateSelectionSchema), selectionController.update);
router.delete("/:id", selectionController.delete);

export default router;
