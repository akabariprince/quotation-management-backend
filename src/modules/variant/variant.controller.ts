import { BaseCrudController } from '../shared/baseCrud.controller';
import Variant from '../../models/Variant.model';
import { variantService } from './variant.service';

class VariantController extends BaseCrudController<Variant> {
  constructor() {
    super(variantService, 'Variant');
  }
}

export const variantController = new VariantController();