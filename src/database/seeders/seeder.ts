// src/database/seeder.ts
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../utils/logger";
import User from "../../models/User.model";
import Category from "../../models/Category.model";
import QuotationType from "../../models/QuotationType.model";
import QuotationModel from "../../models/QuotationModel.model";
import Wood from "../../models/Wood.model";
import Polish from "../../models/Polish.model";
import Fabric from "../../models/Fabric.model";
import Quotation from "../../models/Quotation.model";
import Customer from "../../models/Customer.model";
import Project from "../../models/Project.model";
import ProjectItem from "../../models/ProjectItem.model";
import { Role } from "@/models";
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from "@/utils/permissions";

export const seedDatabase = async (): Promise<void> => {
  try {
    const roleCount = await Role.count();
    if (roleCount > 0) {
      logger.info("Database already seeded. Skipping...");
      return;
    }

    logger.info("Seeding database...");

    // 1. ROLES
    const roleAdminId = uuidv4();
    const roleMasterId = uuidv4();
    const roleCreatorId = uuidv4();
    const roleDataEntryId = uuidv4();

    await Role.bulkCreate([
      {
        id: roleAdminId,
        name: "admin",
        displayName: "Administrator",
        description: "Full system access",
        permissions: ALL_PERMISSIONS as unknown as string[],
        isSystem: true,
        isActive: true,
      },
      {
        id: roleMasterId,
        name: "master",
        displayName: "Master",
        description:
          "Can manage quotations, projects, customers, masters",
        permissions:
          DEFAULT_ROLE_PERMISSIONS.master as unknown as string[],
        isSystem: true,
        isActive: true,
      },
      {
        id: roleCreatorId,
        name: "creator",
        displayName: "Creator",
        description: "Can create and edit projects and customers",
        permissions:
          DEFAULT_ROLE_PERMISSIONS.creator as unknown as string[],
        isSystem: true,
        isActive: true,
      },
      {
        id: roleDataEntryId,
        name: "data_entry",
        displayName: "Data Entry",
        description: "Can add customers and create projects",
        permissions:
          DEFAULT_ROLE_PERMISSIONS.data_entry as unknown as string[],
        isSystem: true,
        isActive: true,
      },
    ]);

    // 2. USERS
    const adminUserId = uuidv4();
    const masterUserId = uuidv4();
    const creatorUserId = uuidv4();
    const dataEntryUserId = uuidv4();

    await User.bulkCreate([
      {
        id: adminUserId,
        name: "Admin User",
        email: "admin@esipl.in",
        password: await bcrypt.hash("password123", 12),
        roleId: roleAdminId,
        isActive: true,
      },
      {
        id: masterUserId,
        name: "Master User",
        email: "master@esipl.in",
        password: await bcrypt.hash("password123", 12),
        roleId: roleMasterId,
        isActive: true,
      },
      {
        id: creatorUserId,
        name: "Creator User",
        email: "creator@esipl.in",
        password: await bcrypt.hash("password123", 12),
        roleId: roleCreatorId,
        isActive: true,
      },
      {
        id: dataEntryUserId,
        name: "Data Entry User",
        email: "dataentry@esipl.in",
        password: await bcrypt.hash("password123", 12),
        roleId: roleDataEntryId,
        isActive: true,
      },
    ]);

    // 3. CATEGORIES
    const catLR = uuidv4();
    const catD = uuidv4();
    const catBR = uuidv4();
    const catO = uuidv4();

    await Category.bulkCreate([
      { id: catLR, name: "Living Room", status: "active" },
      { id: catD, name: "Dining", status: "active" },
      { id: catBR, name: "Bedroom", status: "active" },
      { id: catO, name: "Office", status: "active" },
    ]);

    // 4. QUOTATION TYPES (was Product Types)
    const qtSofa = uuidv4();
    const qtCT = uuidv4();
    const qtST = uuidv4();
    const qtDT = uuidv4();
    const qtDC = uuidv4();
    const qtBed = uuidv4();
    const qtSC = uuidv4();
    const qtAC = uuidv4();

    await QuotationType.bulkCreate([
      {
        id: qtSofa,
        name: "Sofa",
        categoryId: catLR,
        status: "active",
      },
      {
        id: qtCT,
        name: "Center Table",
        categoryId: catLR,
        status: "active",
      },
      {
        id: qtST,
        name: "Side Table",
        categoryId: catLR,
        status: "active",
      },
      {
        id: qtDT,
        name: "Dining Table",
        categoryId: catD,
        status: "active",
      },
      {
        id: qtDC,
        name: "Dining Chair",
        categoryId: catD,
        status: "active",
      },
      {
        id: qtBed,
        name: "Bed",
        categoryId: catBR,
        status: "active",
      },
      {
        id: qtSC,
        name: "Side Cabinet",
        categoryId: catBR,
        status: "active",
      },
      {
        id: qtAC,
        name: "Accent Chair",
        categoryId: catLR,
        status: "active",
      },
    ]);

    // 5. QUOTATION MODELS (was Product Models)
    const qmSec = uuidv4();
    const qmLS = uuidv4();
    const qmRnd = uuidv4();
    const qmNP = uuidv4();
    const qm6S = uuidv4();
    const qmStd = uuidv4();
    const qmKS = uuidv4();
    const qmMod = uuidv4();
    const qmLng = uuidv4();

    await QuotationModel.bulkCreate([
      {
        id: qmSec,
        name: "Sectional",
        quotationTypeId: qtSofa,
        status: "active",
      },
      {
        id: qmLS,
        name: "L-Shaped",
        quotationTypeId: qtSofa,
        status: "active",
      },
      {
        id: qmRnd,
        name: "Round",
        quotationTypeId: qtCT,
        status: "active",
      },
      {
        id: qmNP,
        name: "Nested Pair",
        quotationTypeId: qtST,
        status: "active",
      },
      {
        id: qm6S,
        name: "6 Seater",
        quotationTypeId: qtDT,
        status: "active",
      },
      {
        id: qmStd,
        name: "Standard",
        quotationTypeId: qtDC,
        status: "active",
      },
      {
        id: qmKS,
        name: "King Size",
        quotationTypeId: qtBed,
        status: "active",
      },
      {
        id: qmMod,
        name: "Modern",
        quotationTypeId: qtSC,
        status: "active",
      },
      {
        id: qmLng,
        name: "Lounge",
        quotationTypeId: qtAC,
        status: "active",
      },
    ]);

    // 6. WOODS
    const wTeak = uuidv4();
    const wOak = uuidv4();
    const wWal = uuidv4();
    const wPly = uuidv4();
    const wMS = uuidv4();

    await Wood.bulkCreate([
      { id: wTeak, name: "Teakwood", status: "active" },
      { id: wOak, name: "Oak", status: "active" },
      { id: wWal, name: "Walnut", status: "active" },
      { id: wPly, name: "Plywood with Veneer", status: "active" },
      { id: wMS, name: "M.S Frame", status: "active" },
    ]);

    // 7. POLISHES
    const pPU = uuidv4();
    const pPUP = uuidv4();
    const pNat = uuidv4();
    const pMat = uuidv4();

    await Polish.bulkCreate([
      {
        id: pPU,
        name: "P.U Polish (Water Based)",
        status: "active",
      },
      {
        id: pPUP,
        name: "P.U Paint (Satin Black)",
        status: "active",
      },
      { id: pNat, name: "Natural Finish", status: "active" },
      { id: pMat, name: "Matte Finish", status: "active" },
    ]);

    // 8. FABRICS
    const fAL = uuidv4();
    const fPrem = uuidv4();
    const fVel = uuidv4();
    const fLin = uuidv4();

    await Fabric.bulkCreate([
      { id: fAL, name: "Artificial Leather", status: "active" },
      { id: fPrem, name: "Premium Fabric", status: "active" },
      { id: fVel, name: "Velvet", status: "active" },
      { id: fLin, name: "Linen", status: "active" },
    ]);

    // 9. CUSTOMERS
    const c1 = uuidv4();
    const c2 = uuidv4();
    const c3 = uuidv4();

    await Customer.bulkCreate([
      {
        id: c1,
        name: "Mayank Shah",
        mobile: "+919423871364",
        email: "mayank.shah@gmail.com",
        address: "Flat 302, KP",
        gstin: "27AAFCS1234M1ZM",
        contactPerson: "Mayank Shah",
        city: "Pune",
        state: "Maharashtra",
        region: "West",
      },
      {
        id: c2,
        name: "Priya Patel",
        mobile: "+919876543210",
        email: "priya.patel@gmail.com",
        address: "B-201, Bandra",
        gstin: "27AAFCP5678N1ZN",
        contactPerson: "Priya Patel",
        city: "Mumbai",
        state: "Maharashtra",
        region: "West",
      },
      {
        id: c3,
        name: "Rahul Sharma",
        mobile: "+918765432109",
        email: "rahul.sharma@gmail.com",
        address: "House 45, Sec 15",
        gstin: "06AAFCR9012P1ZP",
        contactPerson: "Rahul Sharma",
        city: "Gurgaon",
        state: "Haryana",
        region: "North",
      },
    ]);

    // 10. QUOTATIONS (was Products)
    const q1 = uuidv4();
    const q4 = uuidv4();
    const q5 = uuidv4();
    const q7 = uuidv4();

    await Quotation.bulkCreate([
      {
        id: q1,
        name: "Sectional Sofa",
        partCode: "S00_Vx(Sx)",
        categoryId: catLR,
        quotationTypeId: qtSofa,
        quotationModelId: qmSec,
        length: 0,
        width: 0,
        height: 0,
        description: "Base frame sofa",
        basePrice: 265000,
        defaultDiscount: 15,
        gstPercent: 18,
        images: [
          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
        ],
        status: "active",
      },
      {
        id: q4,
        name: "Dining Table 6 Seater",
        partCode: "HT00_Vx(Sx)",
        categoryId: catD,
        quotationTypeId: qtDT,
        quotationModelId: qm6S,
        length: 0,
        width: 0,
        height: 0,
        description: "6 Seater dining table",
        basePrice: 180000,
        defaultDiscount: 15,
        gstPercent: 18,
        images: [
          "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800",
        ],
        status: "active",
      },
      {
        id: q5,
        name: "Dining Chair Standard",
        partCode: "GC12_V1(Sx)",
        categoryId: catD,
        quotationTypeId: qtDC,
        quotationModelId: qmStd,
        length: 0,
        width: 0,
        height: 0,
        description: "Standard dining chair",
        basePrice: 22500,
        defaultDiscount: 15,
        gstPercent: 18,
        images: [
          "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800",
        ],
        status: "active",
      },
      {
        id: q7,
        name: "King Size Bed",
        partCode: "GB11_V1(Sx)",
        categoryId: catBR,
        quotationTypeId: qtBed,
        quotationModelId: qmKS,
        length: 0,
        width: 0,
        height: 0,
        description: "King size bed. Mattress not included.",
        basePrice: 225000,
        defaultDiscount: 15,
        gstPercent: 18,
        images: [
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
        ],
        status: "active",
      },
    ]);

    // 11. PROJECTS (was Quotations)
    const pj1 = uuidv4();
    const pj2 = uuidv4();

    await Project.bulkCreate([
      {
        id: pj1,
        projectNo: "PJ-20250207-0001",
        date: "2025-02-07",
        customerId: c1,
        salesPersonId: creatorUserId,
        subtotal: 225250,
        totalDiscount: 39750,
        igst: 0,
        cgst: 20273,
        sgst: 20273,
        grandTotal: 225250,
        grandTotalWithGst: 265795,
        status: "sent",
      },
      {
        id: pj2,
        projectNo: "PJ-20250215-0001",
        date: "2025-02-15",
        customerId: c2,
        salesPersonId: masterUserId,
        subtotal: 267750,
        totalDiscount: 30375,
        igst: 0,
        cgst: 24098,
        sgst: 24098,
        grandTotal: 267750,
        grandTotalWithGst: 315945,
        status: "draft",
      },
    ]);

    // 12. PROJECT ITEMS (was Quotation Items)
    await ProjectItem.bulkCreate([
      {
        id: uuidv4(),
        projectId: pj1,
        projectQuotationNo: "PJ-20250207-0001-Q00001",
        quotationId: q1,
        quotationCode: "S00_Vx(Sx)",
        quotationName: "Sectional Sofa",
        description:
          "Teakwood, PU polish, Artificial leather",
        images: [],
        woodId: wTeak,
        woodName: "Teakwood",
        polishId: pPU,
        polishName: "P.U Polish (Water Based)",
        fabricId: fAL,
        fabricName: "Artificial Leather",
        basePrice: 265000,
        discountPercent: 15,
        discountAmount: 39750,
        finalPrice: 225250,
        quantity: 1,
        total: 225250,
        gstPercent: 18,
        igst: 0,
        cgst: 20273,
        sgst: 20273,
        totalWithGst: 265795,
        notes: [
          "Teakwood",
          "PU polish",
          "Artificial leather",
        ],
        sortOrder: 0,
      },
      {
        id: uuidv4(),
        projectId: pj2,
        projectQuotationNo: "PJ-20250215-0001-Q00001",
        quotationId: q4,
        quotationCode: "HT00_Vx(Sx)",
        quotationName: "Dining Table 6 Seater",
        description: "MS Frame, PU Paint",
        images: [],
        woodId: wMS,
        woodName: "M.S Frame",
        polishId: pPUP,
        polishName: "P.U Paint (Satin Black)",
        fabricId: null,
        fabricName: null,
        basePrice: 180000,
        discountPercent: 15,
        discountAmount: 27000,
        finalPrice: 153000,
        quantity: 1,
        total: 153000,
        gstPercent: 18,
        igst: 0,
        cgst: 13770,
        sgst: 13770,
        totalWithGst: 180540,
        notes: ["MS Frame", "Satin Black"],
        sortOrder: 0,
      },
      {
        id: uuidv4(),
        projectId: pj2,
        projectQuotationNo: "PJ-20250215-0001-Q00002",
        quotationId: q5,
        quotationCode: "GC12_V1(Sx)",
        quotationName: "Dining Chair Standard",
        description:
          "Teakwood, PU polish, Artificial leather",
        images: [],
        woodId: wTeak,
        woodName: "Teakwood",
        polishId: pPU,
        polishName: "P.U Polish (Water Based)",
        fabricId: fAL,
        fabricName: "Artificial Leather",
        basePrice: 22500,
        discountPercent: 15,
        discountAmount: 3375,
        finalPrice: 19125,
        quantity: 6,
        total: 114750,
        gstPercent: 18,
        igst: 0,
        cgst: 10328,
        sgst: 10328,
        totalWithGst: 135405,
        notes: ["6 chairs"],
        sortOrder: 1,
      },
    ]);

    logger.info("Database seeded successfully!");
    logger.info("");
    logger.info(
      "Login Credentials (all password: password123):"
    );
    logger.info("  Admin      -> admin@esipl.in");
    logger.info("  Master     -> master@esipl.in");
    logger.info("  Creator    -> creator@esipl.in");
    logger.info("  Data Entry -> dataentry@esipl.in");
  } catch (error) {
    logger.error("Seeding failed:", error);
    throw error;
  }
};