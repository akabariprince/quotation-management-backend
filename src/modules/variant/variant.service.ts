import { BaseCrudService } from '../shared/baseCrud.service';
import Variant from '../../models/Variant.model';

class VariantService extends BaseCrudService<Variant> {
  constructor() {
    super(Variant, 'Variant');
  }
}

export const variantService = new VariantService();