// src/modules/dashboard/dashboard.service.ts
import { Op } from "sequelize";
import { sequelize } from "../../models";
import Project from "../../models/Project.model";
import Customer from "../../models/Customer.model";
import Quotation from "../../models/Quotation.model";
import Category from "../../models/Category.model";

class DashboardService {
  async getDashboardStats() {
    const totalCustomers = await Customer.count();
    const totalQuotations = await Quotation.count();
    const totalProjects = await Project.count();

    const projectsByStatus = await Project.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [
          sequelize.fn("SUM", sequelize.col("grand_total_with_gst")),
          "totalValue",
        ],
      ],
      group: ["status"],
      raw: true,
    });

    // Recent projects (was recentQuotations)
    const recentProjects = await Project.findAll({
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "city"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Project.findAll({
      attributes: [
        [
          sequelize.fn("DATE_TRUNC", "month", sequelize.col("date")),
          "month",
        ],
        [
          sequelize.fn("SUM", sequelize.col("grand_total_with_gst")),
          "totalValue",
        ],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: {
        date: { [Op.gte]: sixMonthsAgo },
        status: { [Op.in]: ["sent", "approved"] },
      },
      group: [
        sequelize.fn("DATE_TRUNC", "month", sequelize.col("date")),
      ],
      order: [
        [
          sequelize.fn("DATE_TRUNC", "month", sequelize.col("date")),
          "ASC",
        ],
      ],
      raw: true,
    });

    // Total project values
    const totalValue =
      (await Project.sum("grandTotalWithGst")) || 0;
    const approvedValue =
      (await Project.sum("grandTotalWithGst", {
        where: { status: "approved" },
      })) || 0;

    return {
      totalCustomers,
      totalQuotations,
      totalProjects,
      totalValue: Number(totalValue),
      approvedValue: Number(approvedValue),
      projectsByStatus,
      recentProjects,
      monthlyRevenue,
    };
  }
}

export const dashboardService = new DashboardService();