import { BaseCrudController } from "../shared/baseCrud.controller";
import { selectionService } from "./selection.service";
import Selection from "../../models/Selection.model";

class SelectionController extends BaseCrudController<Selection> {
  constructor() {
    super(selectionService, "Selection");
  }
}

export const selectionController = new SelectionController();
