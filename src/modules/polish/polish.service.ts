// src/modules/polish/polish.service.ts
import { BaseCrudService } from '../shared/baseCrud.service';
import Polish from '../../models/Polish.model';

class PolishService extends BaseCrudService<Polish> {
  constructor() { super(Polish, 'Polish'); }
}

export const polishService = new PolishService();