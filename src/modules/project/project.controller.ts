// src/modules/project/project.controller.ts
// src/modules/project/project.controller.ts

import { Request, Response } from "express";
import fs from "fs";
import { projectService } from "./project.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { pdfPrintLogService, sanitizeSegment, getDateStamp, getUniqueNo } from "../../services/pdfPrintLog.service";
import PdfPrintLog from "../../models/PdfPrintLog.model";
import { ApiError } from "../../utils/ApiError";

class ProjectController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await projectService.findAll(req.query);
    res.json(
      ApiResponse.success(result.data, "Projects fetched", 200, result.meta),
    );
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.findById(req.params.id as string);
    res.json(ApiResponse.success(project, "Project fetched"));
  });

  getNextNumber = asyncHandler(async (req: Request, res: Response) => {
    const nextNumber = await projectService.getNextProjectNumber();
    res.json(ApiResponse.success({ projectNo: nextNumber }));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.create(req.body);
    res.status(201).json(ApiResponse.created(project, "Project created"));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.update(
      req.params.id as string,
      req.body,
    );
    res.json(ApiResponse.success(project, "Project updated"));
  });

  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.updateStatus(
      req.params.id as string,
      req.body.status,
    );
    res.json(ApiResponse.success(project, "Project status updated"));
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await projectService.delete(req.params.id as string);
    res.json(ApiResponse.noContent("Project deleted"));
  });

  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await projectService.getProjectStats();
    res.json(ApiResponse.success(stats, "Project stats fetched"));
  });

  duplicate = asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.duplicate(req.params.id as string);
    res.status(201).json(ApiResponse.created(project, "Project duplicated"));
  });

  sendEmail = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      sendToCustomer,
      sendToCustomerEmail,
      sendToCustomerWhatsApp,
      subject,
      message,
      type,
      userId,
    } = req.body;
    const shouldSendCustomer =
      sendToCustomer === true ||
      sendToCustomerEmail === true ||
      sendToCustomerWhatsApp === true;

    if (shouldSendCustomer) {
      const userPermissions = (req as any).user?.permissions || [];
      const roleName = (req as any).user?.roleName;
      const isUserAdmin = roleName === "admin";
      const hasSendCustomerPermission = isUserAdmin || userPermissions.includes("project:send_customer");

      if (!hasSendCustomerPermission) {
        throw ApiError.forbidden("You do not have permission to send emails to customers");
      }
    }

    const result = await projectService.sendProjectEmail(
      id as string,
      {
        sendToCustomerEmail:
          sendToCustomerEmail === true || sendToCustomer === true,
        sendToCustomerWhatsApp: sendToCustomerWhatsApp === true,
        subject,
        message,
        type: type || "sent",
      },
      userId,
    );
    res.json(ApiResponse.success(result, "Email sent successfully"));
  });

  downloadPDF = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Ensure the project exists
    const project = await projectService.findById(id as string);

    let pdfPath: string;
    let filename: string;

    // Look for latest printed PDF snapshot log first (if exists on disk, use it)
    const latestLog = await PdfPrintLog.findOne({
      where: { projectId: id },
      order: [["createdAt", "DESC"]],
    });

    if (latestLog && fs.existsSync(latestLog.filePath)) {
      pdfPath = latestLog.filePath;
      const projectName = sanitizeSegment(project.projectName || "Project");
      const dateStamp = getDateStamp(new Date(latestLog.createdAt));
      const uniqueNo = latestLog.uniqueNo;
      filename = `esipl_${projectName}_${dateStamp}_${uniqueNo}.pdf`;
    } else if (project.status === "sent") {
      const log = await pdfPrintLogService.createSnapshot(
        project,
        req.user?.id || null,
      );
      pdfPath = log.filePath;
      const projectName = sanitizeSegment(project.projectName || "Project");
      const dateStamp = getDateStamp(new Date(log.createdAt));
      const uniqueNo = log.uniqueNo;
      filename = `esipl_${projectName}_${dateStamp}_${uniqueNo}.pdf`;
    } else {
      pdfPath = await projectService.ensurePDF(id as string);
      const projectName = sanitizeSegment(project.projectName || "Project");
      const now = new Date(project.date ? `${project.date}T00:00:00` : new Date());
      const dateStamp = getDateStamp(now);
      const uniqueNo = getUniqueNo(new Date(project.createdAt || new Date()));
      filename = `esipl_${projectName}_${dateStamp}_${uniqueNo}.pdf`;
    }

    if (!fs.existsSync(pdfPath)) {
      return res
        .status(404)
        .json(
          ApiResponse.error("PDF not found. Please try regenerating.", 404),
        );
    }

    const stat = fs.statSync(pdfPath);

    // Set proper headers for file download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Stream the file
    const stream = fs.createReadStream(pdfPath);
    stream.pipe(res);
    stream.on("error", (err) => {
      console.error("Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json(ApiResponse.error("Error streaming PDF", 500));
      }
    });
  });

  // ─── NEW: Force-regenerate PDF ─────────────────────────
  regeneratePDF = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const project = await projectService.findById(id as string);

    const { generateProjectPDF } = await import("../../services/pdf.service");
    const pdfPath = await generateProjectPDF(project);

    res.json(
      ApiResponse.success(
        { pdfPath: `/uploads/pdfs/${id}.pdf` },
        "PDF regenerated successfully",
      ),
    );
  });

  downloadLoggedPDF = asyncHandler(async (req: Request, res: Response) => {
    const log = await pdfPrintLogService.getLogById(req.params.logId as string);

    if (!fs.existsSync(log.filePath)) {
      return res
        .status(404)
        .json(ApiResponse.error("Stored PDF not found", 404));
    }

    const stat = fs.statSync(log.filePath);
    const projectName = sanitizeSegment(log.projectName || "Project");
    const dateStamp = getDateStamp(new Date(log.createdAt));
    const uniqueNo = log.uniqueNo;
    const filename = `esipl_${projectName}_${dateStamp}_${uniqueNo}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", stat.size);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`,
    );

    const stream = fs.createReadStream(log.filePath);
    stream.pipe(res);
  });
}

export const projectController = new ProjectController();
