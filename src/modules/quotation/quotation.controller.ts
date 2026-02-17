import { Request, Response } from 'express';
import { BaseCrudController } from '../shared/baseCrud.controller';
import { quotationService } from './quotation.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import Quotation from '../../models/Quotation.model';
import fs from 'fs';
import path from 'path';

class QuotationController extends BaseCrudController<Quotation> {
  constructor() {
    super(quotationService, 'Quotation');
  }

  // Override create to handle file uploads
  create = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const body = req.body;

    // Build images array from uploaded files
    const images: string[] = [];
    if (files && files.length > 0) {
      files.forEach((file) => {
        images.push(`uploads/quotations/${file.filename}`);
      });
    }

    // Parse existing images if provided
    if (body.existingImages) {
      try {
        const existingImages = JSON.parse(body.existingImages);
        if (Array.isArray(existingImages)) {
          images.push(...existingImages);
        }
      } catch (e) {
        // ignore parse error
      }
    }

    // Parse numeric fields
    const quotationData = {
      name: body.name,
      partCode: body.partCode,
      categoryId: body.categoryId,
      quotationTypeId: body.quotationTypeId,
      quotationModelId: body.quotationModelId || null,
      woodId: body.woodId || null,
      polishId: body.polishId || null,
      fabricId: body.fabricId || null,
      length: parseFloat(body.length) || 0,
      width: parseFloat(body.width) || 0,
      height: parseFloat(body.height) || 0,
      description: body.description || '',
      basePrice: parseFloat(body.basePrice) || 0,
      defaultDiscount: parseFloat(body.defaultDiscount) || 0,
      gstPercent: parseFloat(body.gstPercent) || 18,
      images,
      status: body.status || 'pending',
    };

    const record = await this.service.create(quotationData as any);
    res.status(201).json(ApiResponse.created(record, 'Quotation created'));
  });

  // Override update to handle file uploads
  update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const files = req.files as Express.Multer.File[] | undefined;
    const body = req.body;

    const updateData: any = {};

    // Only include fields that are present in the request
    if (body.name !== undefined) updateData.name = body.name;
    if (body.partCode !== undefined) updateData.partCode = body.partCode;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.quotationTypeId !== undefined)
      updateData.quotationTypeId = body.quotationTypeId;
    if (body.quotationModelId !== undefined)
      updateData.quotationModelId = body.quotationModelId || null;
    if (body.woodId !== undefined) updateData.woodId = body.woodId || null;
    if (body.polishId !== undefined) updateData.polishId = body.polishId || null;
    if (body.fabricId !== undefined) updateData.fabricId = body.fabricId || null;
    if (body.length !== undefined)
      updateData.length = parseFloat(body.length) || 0;
    if (body.width !== undefined)
      updateData.width = parseFloat(body.width) || 0;
    if (body.height !== undefined)
      updateData.height = parseFloat(body.height) || 0;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.basePrice !== undefined)
      updateData.basePrice = parseFloat(body.basePrice) || 0;
    if (body.defaultDiscount !== undefined)
      updateData.defaultDiscount = parseFloat(body.defaultDiscount) || 0;
    if (body.gstPercent !== undefined)
      updateData.gstPercent = parseFloat(body.gstPercent) || 18;
    if (body.status !== undefined) updateData.status = body.status;

    // Handle images
    const hasNewFiles = files && files.length > 0;
    const hasExistingImages = body.existingImages !== undefined;

    if (hasNewFiles || hasExistingImages) {
      const images: string[] = [];

      // Add newly uploaded files
      if (hasNewFiles) {
        files!.forEach((file) => {
          images.push(`uploads/quotations/${file.filename}`);
        });
      }

      // Parse existing images
      if (body.existingImages) {
        try {
          const existingImages = JSON.parse(body.existingImages);
          if (Array.isArray(existingImages)) {
            images.push(...existingImages);
          }
        } catch (e) {
          // ignore parse error
        }
      }

      updateData.images = images;

      // Cleanup old images that are no longer referenced
      try {
        const existingQuotation = await this.service.findById(id);
        if (existingQuotation) {
          const quotationData = existingQuotation.toJSON() as any;
          const oldImages: string[] = quotationData.images || [];
          const removedImages = oldImages.filter(
            (img: string) => !images.includes(img) && img.startsWith('uploads/')
          );
          removedImages.forEach((imgPath: string) => {
            const fullPath = path.join(process.cwd(), imgPath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          });
        }
      } catch (e) {
        // ignore cleanup errors
      }
    }

    const record = await this.service.update(id, updateData);
    res.json(ApiResponse.success(record, 'Quotation updated'));
  });

  // Separate endpoint for uploading images to existing quotation
  uploadImages = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json(ApiResponse.success(null, 'No files uploaded', 400));
      return;
    }

    const existingQuotation = await this.service.findById(id);
    if (!existingQuotation) {
      res
        .status(404)
        .json(ApiResponse.success(null, 'Quotation not found', 404));
      return;
    }

    const quotationData = existingQuotation.toJSON() as any;
    const newImagePaths = files.map(
      (file) => `uploads/quotations/${file.filename}`
    );
    const currentImages: string[] = quotationData.images || [];
    const updatedImages = [...currentImages, ...newImagePaths];

    const record = await this.service.update(id, {
      images: updatedImages,
    } as any);
    res.json(ApiResponse.success(record, 'Images uploaded successfully'));
  });

  // Override delete to cleanup image files
  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    // Get quotation to find image paths before deletion
    try {
      const quotation = await this.service.findById(id);
      if (quotation) {
        const quotationData = quotation.toJSON() as any;
        const images: string[] = quotationData.images || [];
        images.forEach((imgPath: string) => {
          if (imgPath.startsWith('uploads/')) {
            const fullPath = path.join(process.cwd(), imgPath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          }
        });
      }
    } catch (e) {
      // continue with delete even if cleanup fails
    }

    await this.service.delete(id);
    res.json(ApiResponse.noContent('Quotation deleted'));
  });
}

export const quotationController = new QuotationController();