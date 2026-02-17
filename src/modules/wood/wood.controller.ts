// src/modules/wood/wood.controller.ts
import { BaseCrudController } from '../shared/baseCrud.controller';
import { woodService } from './wood.service';
import Wood from '../../models/Wood.model';

class WoodController extends BaseCrudController<Wood> {
  constructor() { super(woodService, 'Wood'); }
}

export const woodController = new WoodController();