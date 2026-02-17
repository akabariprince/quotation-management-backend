import { Op } from "sequelize";
import { sequelize } from "../../models";
import Project from "../../models/Project.model";
import ProjectItem from "../../models/ProjectItem.model";
import Customer from "../../models/Customer.model";

class ReportsService {
  async getSalesReport(query: any) {
    const where: any = {};

    if (query.startDate && query.endDate) {
      where.date = {
        [Op.between]: [query.startDate, query.endDate],
      };
    }

    if (query.status) where.status = query.status;

    // NOTE: Your Project model has "salesPersonId" not "salesManager"
    // If you want to filter by salesPerson, use salesPersonId
    if (query.salesPersonId) where.salesPersonId = query.salesPersonId;

    const report = await Project.findAll({
      where,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "city", "state"],
        },
      ],
      attributes: [
        "id",
        "projectNo",
        "date",
        "salesPersonId", // Changed from "salesManager" - this field doesn't exist
        "status",
        "subtotal",
        "totalDiscount",
        "cgst",
        "sgst",
        "igst",
        "grandTotal",
        "grandTotalWithGst",
      ],
      order: [["date", "DESC"]],
    });

    const summary = {
      totalProjects: report.length,
      totalValue: report.reduce(
        (sum, p) => sum + Number(p.grandTotalWithGst || 0),
        0,
      ),
      totalDiscount: report.reduce(
        (sum, p) => sum + Number(p.totalDiscount || 0),
        0,
      ),
      totalCgst: report.reduce((sum, p) => sum + Number(p.cgst || 0), 0),
      totalSgst: report.reduce((sum, p) => sum + Number(p.sgst || 0), 0),
      totalIgst: report.reduce((sum, p) => sum + Number(p.igst || 0), 0),
      avgOrderValue:
        report.length > 0
          ? report.reduce(
              (sum, p) => sum + Number(p.grandTotalWithGst || 0),
              0,
            ) / report.length
          : 0,
    };

    return { projects: report, summary };
  }

  async getQuotationReport(query: any) {
    const projectWhere: any = {};

    if (query.startDate && query.endDate) {
      projectWhere.date = {
        [Op.between]: [query.startDate, query.endDate],
      };
    }

    if (query.status) projectWhere.status = query.status;

    try {
      const quotationStats = await ProjectItem.findAll({
        attributes: [
          "quotationId",
          "quotationName",
          [sequelize.fn("COUNT", sequelize.col("ProjectItem.id")), "timesUsed"],
          [
            sequelize.fn("SUM", sequelize.col("ProjectItem.quantity")),
            "totalQuantity",
          ],
          [
            sequelize.fn("SUM", sequelize.col("ProjectItem.total_with_gst")),
            "totalRevenue",
          ],
        ],
        include: [
          {
            model: Project,
            as: "project",
            where:
              Object.keys(projectWhere).length > 0 ? projectWhere : undefined,
            attributes: [],
            required: Object.keys(projectWhere).length > 0,
          },
        ],
        group: ["ProjectItem.quotation_id", "ProjectItem.quotation_name"],
        order: [
          [
            sequelize.fn("SUM", sequelize.col("ProjectItem.total_with_gst")),
            "DESC",
          ],
        ],
        raw: true,
      });

      return quotationStats;
    } catch (error) {
      console.error("Quotation report error:", error);
      throw error;
    }
  }

  async getCustomerReport(query: any) {
    const where: any = {};

    if (query.startDate && query.endDate) {
      where.date = {
        [Op.between]: [query.startDate, query.endDate],
      };
    }

    if (query.status) where.status = query.status;

    try {
      const customerStats = await Project.findAll({
        attributes: [
          "customerId",
          [sequelize.fn("COUNT", sequelize.col("Project.id")), "totalProjects"],
          [
            sequelize.fn("SUM", sequelize.col("Project.grand_total_with_gst")),
            "totalValue",
          ],
          [
            sequelize.fn("SUM", sequelize.col("Project.total_discount")),
            "totalDiscount",
          ],
        ],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "name", "city", "state", "mobile", "email"],
          },
        ],
        where,
        group: [
          "Project.customer_id",
          "customer.id",
          "customer.name",
          "customer.city",
          "customer.state",
          "customer.mobile",
          "customer.email",
        ],
        order: [
          [
            sequelize.fn("SUM", sequelize.col("Project.grand_total_with_gst")),
            "DESC",
          ],
        ],
      });

      return customerStats;
    } catch (error) {
      console.error("Customer report error:", error);
      throw error;
    }
  }
}

export const reportsService = new ReportsService();
