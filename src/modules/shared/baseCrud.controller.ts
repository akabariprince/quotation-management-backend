// src/modules/shared/baseCrud.controller.ts
import { Request, Response } from 'express';
import { BaseCrudService } from './baseCrud.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { Model } from 'sequelize';

export class BaseCrudController<T extends Model> {
  protected service: BaseCrudService<T>;
  protected entityName: string;

  constructor(service: BaseCrudService<T>, entityName: string) {
    this.service = service;
    this.entityName = entityName;
  }

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.findAll(req.query);
    res.json(ApiResponse.success(result.data, `${this.entityName} list fetched`, 200, result.meta));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.service.findById(req.params.id as string);
    res.json(ApiResponse.success(record, `${this.entityName} fetched`));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.service.create(req.body);
    res.status(201).json(ApiResponse.created(record, `${this.entityName} created`));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const record = await this.service.update(req.params.id as string, req.body);
    res.json(ApiResponse.success(record, `${this.entityName} updated`));
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.service.delete(req.params.id as string);
    res.json(ApiResponse.noContent(`${this.entityName} deleted`));
  });
}