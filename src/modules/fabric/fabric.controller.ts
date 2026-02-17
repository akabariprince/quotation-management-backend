// src/modules/fabric/fabric.controller.ts
import { BaseCrudController } from '../shared/baseCrud.controller';
import { fabricService } from './fabric.service';
import Fabric from '../../models/Fabric.model';

class FabricController extends BaseCrudController<Fabric> {
  constructor() { super(fabricService, 'Fabric'); }
}

export const fabricController = new FabricController();