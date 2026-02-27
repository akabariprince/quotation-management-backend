// src/modules/project/project.service.ts

import { Includeable, Op, Transaction } from "sequelize";
import { EmailLog, sequelize, User } from "../../models";
import Project from "../../models/Project.model";
import ProjectItem from "../../models/ProjectItem.model";
import Customer from "../../models/Customer.model";
import Quotation from "../../models/Quotation.model";
import Wood from "../../models/Wood.model";
import Polish from "../../models/Polish.model";
import Fabric from "../../models/Fabric.model";
import { ApiError } from "../../utils/ApiError";
import {
  parsePagination,
  buildPaginationMeta,
} from "../../utils/pagination.utils";
import { logger } from "../../utils/logger";
import { ProjectEmailData, sendProjectEmail } from "@/utils/email.service";

// ─── NEW IMPORT ──────────────────────────────────────────
import {
  generateProjectPDF,
  deleteProjectPDF,
  getProjectPDFPath,
  projectPDFExists,
} from "../../services/pdf.service";

const projectIncludes: Includeable[] = [
  {
    model: Customer,
    as: "customer",
    attributes: [
      "id",
      "name",
      "mobile",
      "email",
      "address",
      "landmark",
      "gstin",
      "contactPerson",
      "city",
      "state",
      "region",
      "pincode",
      "deliveryAddress",
      "deliveryLandmark",
      "deliveryCity",
      "deliveryState",
      "deliveryPincode",
      "deliverySameAsBilling",
    ],
  },
  {
    model: User,
    as: "salesPerson",
    attributes: ["id", "name", "email"],
    required: false,
  },
  {
    model: ProjectItem,
    as: "items",
    include: [
      {
        model: Quotation,
        as: "quotation",
        attributes: ["id", "name", "partCode", "width", "length", "height"],
      },
      { model: Wood, as: "wood", attributes: ["id", "name"] },
      { model: Polish, as: "polish", attributes: ["id", "name"] },
      { model: Fabric, as: "fabric", attributes: ["id", "name"] },
    ],
    order: [["sort_order", "ASC"]],
  },
];

class ProjectService {
  // ────────────────────────────────────────────────────────
  //  Helper – fire-and-forget PDF generation
  // ────────────────────────────────────────────────────────
  private async triggerPDFGeneration(projectId: string): Promise<void> {
    try {
      const fullProject = await this.findById(projectId);
      await generateProjectPDF(fullProject);
    } catch (err) {
      // Never let PDF failures break the main flow
      logger.error(`Background PDF generation failed for ${projectId}:`, err);
    }
  }

  // ────────────────────────────────────────────────────────
  private formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  private generateRandomDigits(length: number): string {
    let result = "";
    const chars = "0123456789";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async getNextProjectNumber(): Promise<string> {
    let projectNo: string;
    let exists = true;
    while (exists) {
      const randomPart = this.generateRandomDigits(10);
      projectNo = `PJ${randomPart}`;
      const existing = await Project.findOne({
        where: { projectNo },
        paranoid: false,
      });
      if (!existing) exists = false;
    }
    return projectNo!;
  }

  private generateItemNumber(projectNo: string, index: number): string {
    const randomPart = this.generateRandomDigits(6);
    return `${projectNo}Q${randomPart}${index}`;
  }

  // ────────────────────────────────────────────────────────
  async findAll(query: any) {
    const pagination = parsePagination(query, "createdAt", [
      "createdAt",
      "projectNo",
      "date",
      "grandTotalWithGst",
      "status",
    ]);

    const where: any = {};
    const customerWhere: any = {};
    let hasCustomerSearch = false;

    if (query.search) {
      // Build project-level conditions
      const projectConditions: any[] = [
        { projectNo: { [Op.iLike]: `%${query.search}%` } },
      ];

      // Only add projectName search if the column exists
      // This is safe even if column exists - it won't error
      try {
        projectConditions.push({
          projectName: { [Op.iLike]: `%${query.search}%` },
        });
      } catch {
        // column doesn't exist yet, skip
      }

      where[Op.or] = projectConditions;

      // Search customer name via include where (separate from main where)
      hasCustomerSearch = true;
    }

    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;

    if (query.startDate && query.endDate)
      where.date = { [Op.between]: [query.startDate, query.endDate] };
    else if (query.startDate) where.date = { [Op.gte]: query.startDate };
    else if (query.endDate) where.date = { [Op.lte]: query.endDate };

    // When searching, we need to search across customer name too
    // Use two-step approach: first get IDs, then fetch full data
    if (hasCustomerSearch && query.search) {
      // Find customer IDs matching search
      const matchingCustomers = await Customer.findAll({
        where: {
          name: { [Op.iLike]: `%${query.search}%` },
        },
        attributes: ["id"],
        raw: true,
      });

      const customerIds = matchingCustomers.map((c: any) => c.id);

      // Combine: project matches OR customer matches
      if (customerIds.length > 0) {
        const projectConditions = where[Op.or] || [];
        where[Op.or] = [
          ...projectConditions,
          { customerId: { [Op.in]: customerIds } },
        ];
      }
    }

    const { count, rows } = await Project.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "mobile", "email", "city", "state"],
        },
      ],
      order: [[pagination.sortBy, pagination.sortOrder]],
      limit: pagination.limit,
      offset: pagination.offset,
      distinct: true,
    });

    return {
      data: rows,
      meta: buildPaginationMeta(count, pagination.page, pagination.limit),
    };
  }

  // ────────────────────────────────────────────────────────
  async findById(id: string) {
    const project = await Project.findByPk(id, { include: projectIncludes });
    if (!project) throw ApiError.notFound("Project not found");
    return project;
  }

  // ────────────────────────────────────────────────────────
  //  CREATE  → commit  → return data  → generate PDF
  // ────────────────────────────────────────────────────────
  async create(data: any) {
    const transaction: Transaction = await sequelize.transaction();
    try {
      const projectNo = await this.getNextProjectNumber();
      const { items, ...projectData } = data;

      const project = await Project.create(
        { ...projectData, projectNo },
        { transaction },
      );

      if (items?.length) {
        const rows = items.map((item: any, index: number) => ({
          ...item,
          projectId: project.id, // or id for update
          projectQuotationNo: this.generateItemNumber(projectNo, index),
          sortOrder: index,
          specialNote: item.specialNote || null,
        }));
        await ProjectItem.bulkCreate(rows, { transaction });
      }

      await transaction.commit();

      const fullProject = await this.findById(project.id);

      // ★ Generate PDF (fire-and-forget)
      this.triggerPDFGeneration(project.id);

      return fullProject;
    } catch (error) {
      await transaction.rollback();
      logger.error("Error creating project:", error);
      throw error;
    }
  }

  // ────────────────────────────────────────────────────────
  //  UPDATE  → commit  → return data  → regenerate PDF
  // ────────────────────────────────────────────────────────
  async update(id: string, data: any) {
    const transaction: Transaction = await sequelize.transaction();
    try {
      const project = await Project.findByPk(id);
      if (!project) throw ApiError.notFound("Project not found");

      const { items, ...projectData } = data;
      await project.update(projectData, { transaction });

      if (items !== undefined) {
        await ProjectItem.destroy({ where: { projectId: id }, transaction });
        if (items.length) {
          const rows = items.map((item: any, index: number) => ({
            ...item,
            projectId: id,
            projectQuotationNo: this.generateItemNumber(
              project.projectNo,
              index,
            ),
            sortOrder: index,
          }));
          await ProjectItem.bulkCreate(rows, { transaction });
        }
      }

      await transaction.commit();

      const fullProject = await this.findById(id);

      // ★ Regenerate PDF (fire-and-forget)
      this.triggerPDFGeneration(id);

      return fullProject;
    } catch (error) {
      await transaction.rollback();
      logger.error("Error updating project:", error);
      throw error;
    }
  }

  // ────────────────────────────────────────────────────────
  async updateStatus(id: string, status: string) {
    const project = await Project.findByPk(id);
    if (!project) throw ApiError.notFound("Project not found");
    await project.update({ status: status as any });

    // ★ Regenerate PDF (status may appear on the doc later)
    this.triggerPDFGeneration(id);

    return this.findById(id);
  }

  // ────────────────────────────────────────────────────────
  //  DELETE  → also remove the PDF file
  // ────────────────────────────────────────────────────────
  async delete(id: string) {
    const project = await Project.findByPk(id);
    if (!project) throw ApiError.notFound("Project not found");
    await ProjectItem.destroy({ where: { projectId: id } });
    await project.destroy();

    // ★ Remove stale PDF
    deleteProjectPDF(id);
  }

  // ────────────────────────────────────────────────────────
  async getProjectStats() {
    const totalProjects = await Project.count();
    const draftCount = await Project.count({ where: { status: "draft" } });
    const sentCount = await Project.count({ where: { status: "sent" } });
    const approvedCount = await Project.count({
      where: { status: "approved" },
    });
    const expiredCount = await Project.count({ where: { status: "expired" } });
    const totalValue = (await Project.sum("grandTotalWithGst")) || 0;
    const approvedValue =
      (await Project.sum("grandTotalWithGst", {
        where: { status: "approved" },
      })) || 0;

    return {
      totalProjects,
      draftCount,
      sentCount,
      approvedCount,
      expiredCount,
      totalValue: Number(totalValue),
      approvedValue: Number(approvedValue),
    };
  }

  // ────────────────────────────────────────────────────────
  async duplicate(id: string) {
    const original = await this.findById(id);
    if (!original) throw ApiError.notFound("Project not found");

    const data = {
      date: new Date().toISOString().split("T")[0],
      customerId: original.customerId,
      projectName: original.projectName,
      salesPersonId: original.salesPersonId,
      deliveryAddress: (original as any).deliveryAddress,
      deliveryLandmark: (original as any).deliveryLandmark,
      deliveryCity: (original as any).deliveryCity,
      deliveryState: (original as any).deliveryState,
      deliveryPincode: (original as any).deliveryPincode,
      subtotal: original.subtotal,
      totalDiscount: original.totalDiscount,
      igst: original.igst,
      cgst: original.cgst,
      sgst: original.sgst,
      grandTotal: original.grandTotal,
      grandTotalWithGst: original.grandTotalWithGst,
      status: "draft" as const,
      items:
        original.items?.map((item: any) => ({
          quotationId: item.quotationId,
          quotationCode: item.quotationCode,
          quotationName: item.quotationName,
          description: item.description,
          images: item.images,
          woodId: item.woodId,
          woodName: item.woodName,
          polishId: item.polishId,
          polishName: item.polishName,
          fabricId: item.fabricId,
          fabricName: item.fabricName,
          basePrice: item.basePrice,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          finalPrice: item.finalPrice,
          quantity: item.quantity,
          total: item.total,
          gstPercent: item.gstPercent,
          igst: item.igst,
          cgst: item.cgst,
          sgst: item.sgst,
          totalWithGst: item.totalWithGst,
          notes: item.notes,
          specialNote: item.specialNote || null,
        })) || [],
    };

    // create() already triggers PDF generation
    return this.create(data);
  }

  // ────────────────────────────────────────────────────────
  //  Get PDF path (used by controller for download)
  // ────────────────────────────────────────────────────────
  getPDFPath(projectId: string): string {
    return getProjectPDFPath(projectId);
  }

  pdfExists(projectId: string): boolean {
    return projectPDFExists(projectId);
  }

  async ensurePDF(projectId: string): Promise<string> {
    if (!projectPDFExists(projectId)) {
      const project = await this.findById(projectId);
      return generateProjectPDF(project);
    }
    return getProjectPDFPath(projectId);
  }

  // ────────────────────────────────────────────────────────
  async sendProjectEmail(
    projectId: string,
    emailData: {
      to: string;
      cc?: string;
      subject?: string;
      message?: string;
      type: string;
    },
    userId: string,
  ) {
    const project = await Project.findByPk(projectId, {
      include: [
        { model: Customer, as: "customer" },
        { model: User, as: "salesPerson", attributes: ["id", "name", "email"] },
        { model: ProjectItem, as: "items" },
      ],
    });

    if (!project) throw new Error("Project not found");

    const customer = project.customer;
    const salesPerson = project.salesPerson;

    const projectEmailData: ProjectEmailData = {
      recipientName: customer?.name || "Customer",
      projectNo: project.projectNo,
      projectId: project.id,
      customerName: customer?.name || "Unknown",
      date: project.date,
      salesPersonName: salesPerson?.name || "N/A",
      items: (project.items || []).map((item: any) => ({
        productCode: item.quotationCode,
        productName: item.quotationName,
        quantity: Number(item.quantity) || 1,
        finalPrice: Number(item.finalPrice) || 0,
        total: Number(item.total) || 0,
      })),
      grandTotal: Number(project.grandTotal) || 0,
      cgst: Number(project.cgst) || 0,
      sgst: Number(project.sgst) || 0,
      grandTotalWithGst: Number(project.grandTotalWithGst) || 0,
    };

    const emailType =
      emailData.type === "revised"
        ? "revised"
        : emailData.type === "approved"
          ? "approved"
          : emailData.type === "created"
            ? "created"
            : "sent";

    const emailSent = await sendProjectEmail(
      emailData.to,
      projectEmailData,
      emailType,
      emailData.cc,
    );

    await EmailLog.create({
      toEmail: emailData.to,
      subject:
        emailData.subject || `Project ${project.projectNo} - Ecstatics Spaces`,
      type: `project_${emailType}`,
      referenceId: project.id,
      referenceType: "project",
      status: emailSent ? "sent" : "failed",
      sentBy: userId,
    });

    if (!emailSent)
      throw new Error("Failed to send email. Please check SMTP configuration.");

    if (project.status === "draft") {
      await project.update({ status: "sent" });
    }

    return {
      success: true,
      message: `Email sent to ${emailData.to}`,
      projectNo: project.projectNo,
    };
  }
}

export const projectService = new ProjectService();
