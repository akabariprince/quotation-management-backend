import { BaseCrudService } from '../shared/baseCrud.service';
import Category from '../../models/Category.model';

class CategoryService extends BaseCrudService<Category> {
  constructor() {
    super(Category, 'Category');
  }
}

export const categoryService = new CategoryService();