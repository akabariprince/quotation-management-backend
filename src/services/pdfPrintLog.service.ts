import fs from "fs";
import path from "path";
import { Op } from "sequelize";
import PdfPrintLog from "../models/PdfPrintLog.model";
import Project from "../models/Project.model";
import User from "../models/User.model";
import { ApiError } from "../utils/ApiError";
import { generateProjectPDF } from "./pdf.service";

export function sanitizeSegment(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getDateStamp(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
}

export function getUniqueNo(date = new Date()): string {
  return [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
    String(date.getMilliseconds()).padStart(3, "0"),
  ].join("");
}

function getProjectFolder(projectNo: string): string {
  return path.join(process.cwd(), "uploads", "pdfs", sanitizeSegment(projectNo));
}

class PdfPrintLogService {
  async createSnapshot(project: any, generatedBy?: string | null) {
    const now = new Date();
    const dateStamp = getDateStamp(now);
    const uniqueNo = getUniqueNo(now);
    const projectName = sanitizeSegment(project.projectName || "Project");
    const fileName = `esipl_${projectName}_${dateStamp}_${uniqueNo}.pdf`;
    const folderPath = getProjectFolder(project.projectNo || project.id);

    fs.mkdirSync(folderPath, { recursive: true });

    const sourcePdfPath = await generateProjectPDF(project);
    const targetPdfPath = path.join(folderPath, fileName);
    fs.copyFileSync(sourcePdfPath, targetPdfPath);

    return PdfPrintLog.create({
      projectId: project.id,
      projectNo: project.projectNo,
      projectName: project.projectName || null,
      fileName,
      filePath: targetPdfPath,
      uniqueNo,
      generatedBy: generatedBy || null,
    });
  }

  async getSentPdfLogs(query: any) {
    const where: any = {};

    if (query.startDate && query.endDate) {
      const start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = {
        [Op.between]: [start, end],
      };
    } else if (query.startDate) {
      const start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      where.createdAt = {
        [Op.gte]: start,
      };
    } else if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = {
        [Op.lte]: end,
      };
    }

    if (query.search) {
      where[Op.or] = [
        { projectNo: { [Op.iLike]: `%${query.search}%` } },
        { projectName: { [Op.iLike]: `%${query.search}%` } },
        { uniqueNo: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    const logs = await PdfPrintLog.findAll({
      where,
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "projectNo", "projectName", "status", "date"],
        },
        {
          model: User,
          as: "generator",
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return {
      items: logs,
      summary: {
        totalDocuments: logs.length,
      },
    };
  }

  async getLogById(id: string) {
    const log = await PdfPrintLog.findByPk(id, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "projectNo", "projectName", "status"],
        },
      ],
    });

    if (!log) {
      throw ApiError.notFound("PDF log not found");
    }

    return log;
  }
}

export const pdfPrintLogService = new PdfPrintLogService();
