// src/modules/wood/wood.service.ts
import { BaseCrudService } from '../shared/baseCrud.service';
import Wood from '../../models/Wood.model';

class WoodService extends BaseCrudService<Wood> {
  constructor() { super(Wood, 'Wood'); }
}

export const woodService = new WoodService();