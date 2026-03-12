import { Op, fn, col } from "sequelize";
import { sequelize } from "../../models";
import Project from "../../models/Project.model";
import ProjectItem from "../../models/ProjectItem.model";
import Customer from "../../models/Customer.model";
import User from "../../models/User.model";
import OTPLog from "../../models/OTPLog.model";
import EmailLog from "../../models/EmailLog.model";

/** Reusable include snippet for salesPerson */
const salesPersonInclude = {
  model: User,
  as: "salesPerson" as const,
  attributes: ["id", "name", "email"],
  required: false,
};

class ReportsService {
  /* ─── 1. MASTER REPORT ─── */
  async getMasterReport() {
    try {
      const [totalProjects, totalCustomers, totalRevenue, statusCounts] =
        await Promise.all([
          Project.count(),
          Customer.count(),
          Project.sum("grandTotalWithGst"),
          Project.findAll({
            attributes: [
              "status",
              [fn("COUNT", col("Project.id")), "count"],
              [fn("SUM", col("Project.grand_total_with_gst")), "value"],
            ],
            group: ["status"],
            raw: true,
          }),
        ]);

      const totalItems = await ProjectItem.count();

      return {
        totalProjects: totalProjects || 0,
        totalCustomers: totalCustomers || 0,
        totalRevenue: totalRevenue || 0,
        totalItems: totalItems || 0,
        statusCounts: statusCounts || [],
      };
    } catch (error) {
      console.error("Master report error:", error);
      throw error;
    }
  }

  /* ─── 2. QUOTATION SUMMARY REPORT ─── */
  async getQuotationSummaryReport(query: any) {
    try {
      const where: any = {};

      if (query.startDate && query.endDate) {
        where.date = { [Op.between]: [query.startDate, query.endDate] };
      }
      if (query.status && query.status !== "all") where.status = query.status;
      if (query.salesPersonId) where.salesPersonId = query.salesPersonId;
      if (query.customerId) where.customerId = query.customerId;
      if (query.projectName) {
        where.projectName = { [Op.iLike]: `%${query.projectName}%` };
      }
      if (query.search) {
        where[Op.or] = [
          { projectNo: { [Op.iLike]: `%${query.search}%` } },
          { projectName: { [Op.iLike]: `%${query.search}%` } },
        ];
      }

      const projects = await Project.findAll({
        where,
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "name", "city", "state", "mobile", "email"],
          },
          salesPersonInclude,
        ],
        attributes: [
          "id",
          "projectNo",
          "date",
          "customerId",
          "salesPersonId",
          "subtotal",
          "totalDiscount",
          "cgst",
          "sgst",
          "igst",
          "grandTotal",
          "grandTotalWithGst",
          "projectName",
          "status",
        ],
        order: [["date", "DESC"]],
      });

      // Monthly chart data
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthlyMap: Record<string, number> = {};
      projects.forEach((p) => {
        const d = new Date(p.date);
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
        monthlyMap[key] =
          (monthlyMap[key] || 0) + (Number(p.grandTotalWithGst) || 0);
      });
      const monthlyChartData = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => {
          const [, mi] = key.split("-");
          return { month: monthNames[parseInt(mi)], value: Math.round(value) };
        });

      // Status pie chart
      const statusMap: Record<string, number> = {};
      projects.forEach((p) => {
        statusMap[p.status] = (statusMap[p.status] || 0) + 1;
      });
      const statusColors: Record<string, string> = {
        draft: "#6B7280",
        sent: "#A16207",
        approved: "#166534",
        expired: "#DC2626",
      };
      const statusDistribution = Object.entries(statusMap).map(
        ([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: statusColors[name] || "#6B7280",
        }),
      );

      const summary = {
        totalQuotations: projects.length,
        totalValue: projects.reduce(
          (s, p) => s + (Number(p.grandTotalWithGst) || 0),
          0,
        ),
        totalDiscount: projects.reduce(
          (s, p) => s + (Number(p.totalDiscount) || 0),
          0,
        ),
        avgValue:
          projects.length > 0
            ? projects.reduce(
              (s, p) => s + (Number(p.grandTotalWithGst) || 0),
              0,
            ) / projects.length
            : 0,
      };

      return { projects, monthlyChartData, statusDistribution, summary };
    } catch (error) {
      console.error("Quotation summary error:", error);
      throw error;
    }
  }

  /* ─── 3. CONVERSION REPORT ─── */
  async getConversionReport(query: any) {
    try {
      const where: any = {};
      if (query.startDate && query.endDate) {
        where.date = { [Op.between]: [query.startDate, query.endDate] };
      }
      if (query.customerId) where.customerId = query.customerId;
      if (query.salesPersonId) where.salesPersonId = query.salesPersonId;

      const projects = await Project.findAll({
        where,
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "name"],
          },
          salesPersonInclude,
        ],
        order: [["date", "DESC"]],
      });

      const converted = projects.filter((p) => p.status === "approved");
      const pending = projects.filter(
        (p) => p.status !== "approved" && p.status !== "expired",
      );
      const expired = projects.filter((p) => p.status === "expired");

      const summary = {
        totalQuotations: projects.length,
        totalConverted: converted.length,
        totalPending: pending.length,
        totalExpired: expired.length,
        conversionRate:
          projects.length > 0
            ? Math.round((converted.length / projects.length) * 100)
            : 0,
        convertedValue: converted.reduce(
          (s, p) => s + (Number(p.grandTotalWithGst) || 0),
          0,
        ),
        pendingValue: pending.reduce(
          (s, p) => s + (Number(p.grandTotalWithGst) || 0),
          0,
        ),
        lostValue: expired.reduce(
          (s, p) => s + (Number(p.grandTotalWithGst) || 0),
          0,
        ),
      };

      const data = projects.map((p) => ({
        id: p.id,
        quoteNo: p.projectNo,
        date: p.date,
        customer: p.customer?.name || "-",
        customerId: p.customerId,
        quoteAmount: Number(p.grandTotalWithGst) || 0,
        orderNo:
          p.status === "approved"
            ? `ORD-${p.projectNo.replace(/\D/g, "")}`
            : null,
        orderAmount:
          p.status === "approved" ? Number(p.grandTotalWithGst) || 0 : null,
        status:
          p.status === "approved"
            ? "Converted"
            : p.status === "expired"
              ? "Lost"
              : "Pending",
        projectName: p.projectName || "-",
        salesPersonId: p.salesPersonId,
        salesPersonName: p.salesPerson?.name || "-",
      }));

      return { data, summary };
    } catch (error) {
      console.error("Conversion report error:", error);
      throw error;
    }
  }

  /* ─── 4. PENDING QUOTATION REPORT ─── */
  async getPendingQuotationReport(query: any) {
    try {
      const where: any = {
        status: { [Op.in]: ["draft", "sent"] },
      };
      if (query.startDate && query.endDate) {
        where.date = { [Op.between]: [query.startDate, query.endDate] };
      }
      if (query.customerId) where.customerId = query.customerId;
      if (query.salesPersonId) where.salesPersonId = query.salesPersonId;

      const projects = await Project.findAll({
        where,
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "name", "mobile", "email"],
          },
          salesPersonInclude,
        ],
        order: [["date", "ASC"]],
      });

      const today = new Date();
      const data = projects.map((p) => {
        const created = new Date(p.date);
        const daysPending = Math.floor(
          (today.getTime() - created.getTime()) / 86400000,
        );
        const followUp = new Date(created);
        followUp.setDate(followUp.getDate() + 7);

        return {
          id: p.id,
          quoteNo: p.projectNo,
          date: p.date,
          customer: p.customer?.name || "-",
          customerMobile: p.customer?.mobile || "-",
          customerEmail: p.customer?.email || "-",
          amount: Number(p.grandTotalWithGst) || 0,
          daysPending,
          followUpDate: followUp.toISOString().split("T")[0],
          status: p.status,
          salesPersonId: p.salesPersonId,
          salesPersonName: p.salesPerson?.name || "-",
          projectName: p.projectName || "-",
        };
      });

      const summary = {
        totalPending: data.length,
        totalPendingValue: data.reduce((s, d) => s + d.amount, 0),
        avgDaysPending:
          data.length > 0
            ? Math.round(
              data.reduce((s, d) => s + d.daysPending, 0) / data.length,
            )
            : 0,
        overdueCount: data.filter((d) => d.daysPending > 7).length,
        draftCount: data.filter((d) => d.status === "draft").length,
        sentCount: data.filter((d) => d.status === "sent").length,
      };

      return { data, summary };
    } catch (error) {
      console.error("Pending report error:", error);
      throw error;
    }
  }

  /* ─── 5. SALESMAN PERFORMANCE REPORT ─── */
  async getSalesmanPerformanceReport(query: any) {
    try {
      const where: any = { salesPersonId: { [Op.ne]: null } };
      if (query.startDate && query.endDate) {
        where.date = { [Op.between]: [query.startDate, query.endDate] };
      }

      // All quotations per salesperson
      const allData = (await Project.findAll({
        attributes: [
          "salesPersonId",
          [fn("COUNT", col("Project.id")), "totalQuotations"],
          [fn("SUM", col("Project.grand_total_with_gst")), "totalRevenue"],
          [fn("SUM", col("Project.total_discount")), "totalDiscount"],
        ],
        where,
        group: ["salesPersonId"],
        order: [[fn("SUM", col("Project.grand_total_with_gst")), "DESC"]],
        raw: true,
      })) as any[];

      // Converted quotations per salesperson
      const convertedData = (await Project.findAll({
        attributes: [
          "salesPersonId",
          [fn("COUNT", col("Project.id")), "converted"],
          [fn("SUM", col("Project.grand_total_with_gst")), "convertedRevenue"],
        ],
        where: { ...where, status: "approved" },
        group: ["salesPersonId"],
        raw: true,
      })) as any[];

      const convMap: Record<string, { converted: number; revenue: number }> =
        {};
      convertedData.forEach((c: any) => {
        convMap[c.salesPersonId] = {
          converted: Number(c.converted) || 0,
          revenue: Number(c.convertedRevenue) || 0,
        };
      });

      // Fetch user names for all salesPersonIds
      const salesPersonIds = allData
        .map((d: any) => d.salesPersonId)
        .filter(Boolean);
      const users = await User.findAll({
        where: { id: { [Op.in]: salesPersonIds } },
        attributes: ["id", "name", "email"],
        paranoid: false, // include soft-deleted users
        raw: true,
      });
      const userMap: Record<string, { name: string; email: string }> = {};
      users.forEach((u: any) => {
        userMap[u.id] = { name: u.name, email: u.email };
      });

      const data = allData.map((s: any) => {
        const totalQ = Number(s.totalQuotations) || 0;
        const conv = convMap[s.salesPersonId] || {
          converted: 0,
          revenue: 0,
        };
        const userInfo = userMap[s.salesPersonId] || {
          name: "Unknown",
          email: "-",
        };
        return {
          salesPersonId: s.salesPersonId,
          salesPersonName: userInfo.name,
          salesPersonEmail: userInfo.email,
          totalQuotations: totalQ,
          converted: conv.converted,
          conversionPercent:
            totalQ > 0 ? Math.round((conv.converted / totalQ) * 100) : 0,
          totalRevenue: Number(s.totalRevenue) || 0,
          convertedRevenue: conv.revenue,
          totalDiscount: Number(s.totalDiscount) || 0,
        };
      });

      const summary = {
        totalSalespeople: data.length,
        totalRevenue: data.reduce((s, d) => s + d.totalRevenue, 0),
        avgConversion:
          data.length > 0
            ? Math.round(
              data.reduce((s, d) => s + d.conversionPercent, 0) / data.length,
            )
            : 0,
      };

      return { data, summary };
    } catch (error) {
      console.error("Salesman report error:", error);
      throw error;
    }
  }

  /* ─── 6. CUSTOMER HISTORY REPORT ─── */
  async getCustomerHistoryReport(query: any) {
    try {
      const { customerId, startDate, endDate } = query;

      // No customer selected → return customer list with summaries
      if (!customerId) {
        const customerSummaries = await Project.findAll({
          attributes: [
            "customerId",
            [fn("COUNT", col("Project.id")), "totalQuotations"],
            [fn("SUM", col("Project.grand_total_with_gst")), "totalRevenue"],
          ],
          include: [
            {
              model: Customer,
              as: "customer",
              attributes: [
                "id",
                "name",
                "mobile",
                "email",
                "gstin",
                "city",
                "state",
                "address",
              ],
            },
          ],
          group: [
            "Project.customer_id",
            "customer.id",
            "customer.name",
            "customer.mobile",
            "customer.email",
            "customer.gstin",
            "customer.city",
            "customer.state",
            "customer.address",
          ],
          order: [[fn("SUM", col("Project.grand_total_with_gst")), "DESC"]],
          raw: false,
        });

        const allCustomers = await Customer.findAll({
          attributes: [
            "id",
            "name",
            "mobile",
            "email",
            "gstin",
            "city",
            "state",
          ],
          order: [["name", "ASC"]],
        });

        return {
          mode: "list",
          customers: allCustomers,
          customerSummaries,
          profile: null,
          summary: null,
          quotations: [],
        };
      }

      // Customer selected → return full history
      const customer = await Customer.findByPk(customerId);
      if (!customer) throw new Error("Customer not found");

      const projectWhere: any = { customerId };
      if (startDate && endDate) {
        projectWhere.date = { [Op.between]: [startDate, endDate] };
      }

      const projects = await Project.findAll({
        where: projectWhere,
        include: [{ model: ProjectItem, as: "items" }, salesPersonInclude],
        order: [["date", "DESC"]],
      });

      const profile = {
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        gstin: customer.gstin,
        address: [customer.address, customer.city, customer.state]
          .filter(Boolean)
          .join(", "),
        city: customer.city,
        state: customer.state,
      };

      const summary = {
        totalQuotations: projects.length,
        totalOrders: projects.filter((p) => p.status === "approved").length,
        totalRevenue: projects.reduce(
          (s, p) => s + (Number(p.grandTotalWithGst) || 0),
          0,
        ),
        totalDiscount: projects.reduce(
          (s, p) => s + (Number(p.totalDiscount) || 0),
          0,
        ),
      };

      const quotations = projects.map((p) => ({
        id: p.id,
        date: p.date,
        quoteNo: p.projectNo,
        amount: Number(p.grandTotalWithGst) || 0,
        subtotal: Number(p.subtotal) || 0,
        discount: Number(p.totalDiscount) || 0,
        discountPercent:
          (Number(p.subtotal) || 0) > 0
            ? (
              ((Number(p.totalDiscount) || 0) / (Number(p.subtotal) || 0)) *
              100
            ).toFixed(1)
            : "0",
        status: p.status,
        salesPersonId: p.salesPersonId,
        salesPersonName: p.salesPerson?.name || "-",
        projectName: p.projectName,
        items: (p.items || []).map((item: any) => ({
          id: item.id,
          product: item.quotationName,
          code: item.quotationCode,
          quantity: item.quantity,
          rate: Number(item.finalPrice) || 0,
          amount: Number(item.totalWithGst) || 0,
          basePrice: Number(item.basePrice) || 0,
          discountPercent: Number(item.discountPercent) || 0,
          wood: item.woodName,
          polish: item.polishName,
          fabric: item.fabricName,
        })),
      }));

      return {
        mode: "detail",
        customers: null,
        profile,
        summary,
        quotations,
      };
    } catch (error) {
      console.error("Customer history error:", error);
      throw error;
    }
  }

  /* ─── 7. PRODUCT REPORT ─── */
  async getProductReport(query: any) {
    try {
      const projectWhere: any = {};
      if (query.startDate && query.endDate) {
        projectWhere.date = {
          [Op.between]: [query.startDate, query.endDate],
        };
      }
      if (query.status && query.status !== "all") {
        projectWhere.status = query.status;
      }
      const hasProjectFilter = Object.keys(projectWhere).length > 0;

      // Aggregate by product
      const productSummary = (await ProjectItem.findAll({
        attributes: [
          "quotationId",
          "quotationName",
          "quotationCode",
          [fn("COUNT", col("ProjectItem.id")), "timesUsed"],
          [fn("SUM", col("ProjectItem.quantity")), "totalQuantity"],
          [fn("SUM", col("ProjectItem.total_with_gst")), "totalRevenue"],
          [fn("AVG", col("ProjectItem.final_price")), "avgPrice"],
          [fn("SUM", col("ProjectItem.discount_amount")), "totalDiscount"],
        ],
        include: [
          {
            model: Project,
            as: "project",
            where: hasProjectFilter ? projectWhere : undefined,
            attributes: [],
            required: hasProjectFilter,
          },
        ],
        group: [
          "ProjectItem.quotation_id",
          "ProjectItem.quotation_name",
          "ProjectItem.quotation_code",
        ],
        order: [[fn("SUM", col("ProjectItem.total_with_gst")), "DESC"]],
        raw: true,
      })) as any[];

      // Detailed product records with project context + salesPerson
      const productDetails = await ProjectItem.findAll({
        attributes: [
          "id",
          "quotationId",
          "quotationName",
          "quotationCode",
          "quantity",
          "basePrice",
          "finalPrice",
          "discountPercent",
          "discountAmount",
          "total",
          "totalWithGst",
          "woodName",
          "polishName",
          "fabricName",
        ],
        include: [
          {
            model: Project,
            as: "project",
            where: hasProjectFilter ? projectWhere : undefined,
            attributes: ["id", "projectNo", "date", "salesPersonId", "status"],
            required: true,
            include: [
              {
                model: Customer,
                as: "customer",
                attributes: ["id", "name"],
              },
              {
                model: User,
                as: "salesPerson",
                attributes: ["id", "name"],
                required: false,
              },
            ],
          },
        ],
        order: [[{ model: Project, as: "project" }, "date", "DESC"]],
        limit: 200,
      });

      return { summary: productSummary, details: productDetails };
    } catch (error) {
      console.error("Product report error:", error);
      throw error;
    }
  }

  /* ─── 8. DISCOUNT APPROVAL REPORT ─── */
  async getDiscountApprovalReport(query: any) {
    try {
      const projectWhere: any = {};
      if (query.startDate && query.endDate) {
        projectWhere.date = {
          [Op.between]: [query.startDate, query.endDate],
        };
      }
      const hasProjectFilter = Object.keys(projectWhere).length > 0;

      const discountedItems = await ProjectItem.findAll({
        where: { discountPercent: { [Op.gt]: 0 } },
        attributes: [
          "id",
          "quotationName",
          "quotationCode",
          "basePrice",
          "discountPercent",
          "discountAmount",
          "finalPrice",
          "quantity",
          "totalWithGst",
        ],
        include: [
          {
            model: Project,
            as: "project",
            where: hasProjectFilter ? projectWhere : undefined,
            attributes: ["id", "projectNo", "date", "salesPersonId", "status"],
            required: true,
            include: [
              {
                model: Customer,
                as: "customer",
                attributes: ["id", "name"],
              },
              {
                model: User,
                as: "salesPerson",
                attributes: ["id", "name"],
                required: false,
              },
            ],
          },
        ],
        order: [[{ model: Project, as: "project" }, "date", "DESC"]],
      });

      // ═══ FIX: Fetch OTP logs WITHOUT eager-loading User ═══
      // Then resolve user names separately to avoid the
      // "associated multiple times" Sequelize error
      const otpWhere: any = { type: "discount" };
      if (query.startDate && query.endDate) {
        otpWhere.createdAt = {
          [Op.between]: [query.startDate, query.endDate],
        };
      }

      const otpLogsRaw = await OTPLog.findAll({
        where: otpWhere,
        order: [["createdAt", "DESC"]],
        raw: false,
      });

      // Collect all unique user IDs from requestedBy + approvedBy
      const userIds = new Set<string>();
      otpLogsRaw.forEach((log) => {
        if (log.requestedBy) userIds.add(log.requestedBy);
        if (log.approvedBy) userIds.add(log.approvedBy);
      });

      // Fetch user names in one query
      const userMap: Record<string, string> = {};
      if (userIds.size > 0) {
        const users = await User.findAll({
          where: { id: { [Op.in]: Array.from(userIds) } },
          attributes: ["id", "name"],
          paranoid: false,
          raw: true,
        });
        users.forEach((u: any) => {
          userMap[u.id] = u.name;
        });
      }

      // Attach user names to each log
      const otpLogs = otpLogsRaw.map((log) => {
        const plain = log.toJSON() as any;
        plain.requestedByName = userMap[plain.requestedBy] || "-";
        plain.approvedByName = userMap[plain.approvedBy] || "-";
        return plain;
      });

      const summary = {
        totalDiscountedItems: discountedItems.length,
        totalDiscountValue: discountedItems.reduce(
          (s, i: any) =>
            s + (Number(i.discountAmount) || 0) * (i.quantity || 1),
          0,
        ),
        totalOTPRequests: otpLogs.length,
        approvedOTPs: otpLogs.filter((o: any) => o.status === "approved")
          .length,
        pendingOTPs: otpLogs.filter((o: any) => o.status === "pending").length,
      };

      return { items: discountedItems, otpLogs, summary };
    } catch (error) {
      console.error("Discount report error:", error);
      throw error;
    }
  }

  /* ─── 9. DETAILED QUOTATION REPORT ─── */
  async getDetailedQuotationReport(projectId: string) {
    try {
      const project = await Project.findByPk(projectId, {
        include: [
          { model: Customer, as: "customer" },
          { model: ProjectItem, as: "items" },
          {
            model: User,
            as: "salesPerson",
            attributes: ["id", "name", "email"],
            required: false,
          },
        ],
      });

      if (!project) throw new Error("Quotation not found");

      const emailLogs = await EmailLog.findAll({
        where: { referenceId: projectId, referenceType: "project" },
        order: [["createdAt", "DESC"]],
      });

      // ═══ FIX: Same approach — no eager-loading User on OTPLog ═══
      const otpLogsRaw = await OTPLog.findAll({
        where: { entityId: projectId, type: "discount" },
        order: [["createdAt", "DESC"]],
      });

      const userIds = new Set<string>();
      otpLogsRaw.forEach((log) => {
        if (log.requestedBy) userIds.add(log.requestedBy);
        if (log.approvedBy) userIds.add(log.approvedBy);
      });

      const userMap: Record<string, string> = {};
      if (userIds.size > 0) {
        const users = await User.findAll({
          where: { id: { [Op.in]: Array.from(userIds) } },
          attributes: ["id", "name"],
          paranoid: false,
          raw: true,
        });
        users.forEach((u: any) => {
          userMap[u.id] = u.name;
        });
      }

      const otpLogs = otpLogsRaw.map((log) => {
        const plain = log.toJSON() as any;
        plain.requestedByName = userMap[plain.requestedBy] || "-";
        plain.approvedByName = userMap[plain.approvedBy] || "-";
        return plain;
      });

      return { project, emailLogs, otpLogs };
    } catch (error) {
      console.error("Detailed report error:", error);
      throw error;
    }
  }
}

export const reportsService = new ReportsService();
