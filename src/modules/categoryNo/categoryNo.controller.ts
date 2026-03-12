import { BaseCrudController } from '../shared/baseCrud.controller';
import CategoryNo from '../../models/CategoryNo.model';
import { categoryNoService } from './categoryNo.service';

class CategoryNoController extends BaseCrudController<CategoryNo> {
  constructor() {
    super(categoryNoService, 'CategoryNo');
  }
}

export const categoryNoController = new CategoryNoController();