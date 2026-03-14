import { Request, Response } from "express";
import { BaseCrudController } from "../shared/baseCrud.controller";
import { quotationService } from "./quotation.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import Quotation from "../../models/Quotation.model";
import ProjectItem from "../../models/ProjectItem.model";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";

class QuotationController extends BaseCrudController<Quotation> {
  constructor() {
    super(quotationService, "Quotation");
  }

  async findOne(condition: any) {
    return await Quotation.findOne({ where: condition });
  }

  create = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const body = req.body;

    const images: string[] = [];
    if (files && files.length > 0) {
      files.forEach((file) => {
        images.push(`uploads/quotations/${file.filename}`);
      });
    }

    if (body.existingImages) {
      try {
        const existingImages = JSON.parse(body.existingImages);
        if (Array.isArray(existingImages)) {
          images.push(...existingImages);
        }
      } catch (e) { }
    }

    //  Check if partCode already exists
    const existingQuotation = await this.findOne({
      partCode: body.partCode,
    });

    if (existingQuotation) {
      //  Clean up uploaded files since we're rejecting the request
      if (files && files.length > 0) {
        files.forEach((file) => {
          const fullPath = path.join(
            process.cwd(),
            `uploads/quotations/${file.filename}`
          );
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        });
      }
      return res
        .status(400)
        .json(
          ApiResponse.error(
            `Product Code "${body.partCode}" already exists. Please use a different code.`
          )
        );
    }

    const quotationData = {
      name: body.name,
      partCode: body.partCode,
      categoryId: body.categoryId,
      categoryNoId: body.categoryNoId || null,
      quotationTypeId: body.quotationTypeId,
      quotationModelId: body.quotationModelId || null,
      variantId: body.variantId || null,
      woodId: body.woodId || null,
      polishId: body.polishId || null,
      fabricId: body.fabricId || null,
      length: parseFloat(body.length) || 0,
      width: parseFloat(body.width) || 0,
      height: parseFloat(body.height) || 0,
      description: body.description || "",
      basePrice: parseFloat(body.basePrice) || 0,
      defaultDiscount: parseFloat(body.defaultDiscount) || 0,
      gstPercent: parseFloat(body.gstPercent) || 18,
      images,
      status: body.status || "pending",
    };

    const record = await this.service.create(quotationData as any);

    res.status(201).json(ApiResponse.created(record, "Quotation created"));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const files = req.files as Express.Multer.File[] | undefined;
    const body = req.body;

    //  Check if partCode already exists for ANOTHER quotation (not this one)
    if (body.partCode !== undefined) {
      const existingQuotation = await Quotation.findOne({
        where: {
          partCode: body.partCode,
          id: { [Op.ne]: id }, // exclude current record
        },
      });

      if (existingQuotation) {
        //  Clean up uploaded files since we're rejecting the request
        if (files && files.length > 0) {
          files.forEach((file) => {
            const fullPath = path.join(
              process.cwd(),
              `uploads/quotations/${file.filename}`
            );
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          });
        }
        return res
          .status(400)
          .json(
            ApiResponse.error(
              `Product Code "${body.partCode}" is already used by another product. Please use a different code.`
            )
          );
      }
    }

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.partCode !== undefined) updateData.partCode = body.partCode;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.categoryNoId !== undefined)
      updateData.categoryNoId = body.categoryNoId || null;
    if (body.quotationTypeId !== undefined)
      updateData.quotationTypeId = body.quotationTypeId;
    if (body.quotationModelId !== undefined)
      updateData.quotationModelId = body.quotationModelId || null;
    if (body.variantId !== undefined)
      updateData.variantId = body.variantId || null;
    if (body.woodId !== undefined) updateData.woodId = body.woodId || null;
    if (body.polishId !== undefined)
      updateData.polishId = body.polishId || null;
    if (body.fabricId !== undefined)
      updateData.fabricId = body.fabricId || null;
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

    const hasNewFiles = files && files.length > 0;
    const hasExistingImages = body.existingImages !== undefined;

    if (hasNewFiles || hasExistingImages) {
      const images: string[] = [];

      if (hasNewFiles) {
        files!.forEach((file) => {
          images.push(`uploads/quotations/${file.filename}`);
        });
      }

      if (body.existingImages) {
        try {
          const existingImages = JSON.parse(body.existingImages);
          if (Array.isArray(existingImages)) {
            images.push(...existingImages);
          }
        } catch (e) { }
      }

      updateData.images = images;

      try {
        const existingQuotation = await this.service.findById(id);
        if (existingQuotation) {
          const quotationData = existingQuotation.toJSON() as any;
          const oldImages: string[] = quotationData.images || [];
          const removedImages = oldImages.filter(
            (img: string) =>
              !images.includes(img) && img.startsWith("uploads/")
          );
          removedImages.forEach((imgPath: string) => {
            const fullPath = path.join(process.cwd(), imgPath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          });
        }
      } catch (e) { }
    }

    const record = await this.service.update(id, updateData);
    res.json(ApiResponse.success(record, "Quotation updated"));
  });

  uploadImages = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json(ApiResponse.success(null, "No files uploaded", 400));
      return;
    }

    const existingQuotation = await this.service.findById(id);
    if (!existingQuotation) {
      res
        .status(404)
        .json(ApiResponse.success(null, "Quotation not found", 404));
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
    res.json(ApiResponse.success(record, "Images uploaded successfully"));
  });

  //  DELETE — check if quotation is used in any ProjectItem
  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    //  First check if quotation exists
    const quotation = await this.service.findById(id);
    if (!quotation) {
      return res
        .status(404)
        .json(ApiResponse.error("Quotation not found"));
    }

    //  Check if this quotation is used in any project items
    const usedInProjects = await ProjectItem.findAll({
      where: { quotationId: id },
      include: [
        {
          model: require("../../models/Project.model").default,
          as: "project",
          attributes: ["id", "projectNo", "projectName"],
        },
      ],
      limit: 10, // limit for performance; show up to 10 references
    });

    if (usedInProjects && usedInProjects.length > 0) {
      //  Build a helpful message listing which projects use this quotation
      const quotationData = quotation.toJSON() as any;
      const projectDetails = usedInProjects.map((item: any) => {
        const project = item.project;
        return project
          ? `${project.projectNo}${project.projectName ? ` (${project.projectName})` : ""}`
          : "Unknown Project";
      });

      // Remove duplicates (same project can have multiple items with same quotation)
      const uniqueProjects = [...new Set(projectDetails)];

      const projectList = uniqueProjects.join(", ");
      const totalCount = usedInProjects.length;

      return res.status(400).json(
        ApiResponse.error(
          `Cannot delete product "${quotationData.name || quotationData.partCode}". ` +
          `It is currently used in ${totalCount} project item(s) across the following project(s): ${projectList}. ` +
          `Please remove it from all projects before deleting.`
        )
      );
    }

    //  Safe to delete — clean up images
    try {
      const quotationData = quotation.toJSON() as any;
      const images: string[] = quotationData.images || [];
      images.forEach((imgPath: string) => {
        if (imgPath.startsWith("uploads/")) {
          const fullPath = path.join(process.cwd(), imgPath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }
      });
    } catch (e) { }

    await this.service.delete(id);
    res.json(ApiResponse.noContent("Quotation deleted successfully"));
  });
}

export const quotationController = new QuotationController();