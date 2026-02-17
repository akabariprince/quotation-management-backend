// src/modules/customer/customer.controller.ts
import { Request, Response } from 'express';
import { customerService } from './customer.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

class CustomerController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await customerService.findAll(req.query);
    res.json(ApiResponse.success(result.data, 'Customers fetched', 200, result.meta));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.findById(req.params.id as string);
    res.json(ApiResponse.success(customer));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.create(req.body);
    res.status(201).json(ApiResponse.created(customer, 'Customer created'));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.update(req.params.id as string, req.body);
    res.json(ApiResponse.success(customer, "Customer updated"));
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await customerService.delete(req.params.id as string);
    res.json(ApiResponse.noContent('Customer deleted'));
  });
}

export const customerController = new CustomerController();