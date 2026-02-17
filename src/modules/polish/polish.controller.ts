// src/modules/polish/polish.controller.ts
import { BaseCrudController } from '../shared/baseCrud.controller';
import { polishService } from './polish.service';
import Polish from '../../models/Polish.model';

class PolishController extends BaseCrudController<Polish> {
  constructor() { super(polishService, 'Polish'); }
}

export const polishController = new PolishController();