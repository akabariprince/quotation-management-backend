// src/modules/category/category.controller.ts
import { BaseCrudController } from '../shared/baseCrud.controller';
import { categoryService } from './category.service';
import Category from '../../models/Category.model';

class CategoryController extends BaseCrudController<Category> {
  constructor() {
    super(categoryService, 'Category');
  }
}

export const categoryController = new CategoryController();