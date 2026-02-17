// src/modules/project/project.controller.ts

import { Request, Response } from "express";
import fs from "fs";
import { projectService } from "./project.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

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
    const { to, cc, subject, message, type } = req.body;
    const userId = (req as any).user?.id;
    if (!to) {
      return res
        .status(400)
        .json(ApiResponse.error("Recipient email is required", 400));
    }
    const result = await projectService.sendProjectEmail(
      id as string,
      { to, cc, subject, message, type: type || "sent" },
      userId,
    );
    res.json(ApiResponse.success(result, "Email sent successfully"));
  });

  downloadPDF = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Ensure the project exists
    const project = await projectService.findById(id as string);

    // Generate on-demand if it doesn't exist yet
    const pdfPath = await projectService.ensurePDF(id as string);

    if (!fs.existsSync(pdfPath)) {
      return res
        .status(404)
        .json(
          ApiResponse.error("PDF not found. Please try regenerating.", 404),
        );
    }

    const stat = fs.statSync(pdfPath);
    const filename = `${project.projectNo || id}.pdf`;

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
}

export const projectController = new ProjectController();
