// src/modules/fabric/fabric.service.ts
import { BaseCrudService } from '../shared/baseCrud.service';
import Fabric from '../../models/Fabric.model';

class FabricService extends BaseCrudService<Fabric> {
  constructor() { super(Fabric, 'Fabric'); }
}

export const fabricService = new FabricService();