import sequelize from "../config/sequelize";
import Role from "./Role.model";
import User from "./User.model";
import Category from "./Category.model";
import QuotationType from "./QuotationType.model";
import QuotationModel from "./QuotationModel.model";
import Wood from "./Wood.model";
import Polish from "./Polish.model";
import Fabric from "./Fabric.model";
import Quotation from "./Quotation.model";
import Customer from "./Customer.model";
import Project from "./Project.model";
import ProjectItem from "./ProjectItem.model";
import OTPLog from "./OTPLog.model";
import EmailLog from "./EmailLog.model";
import CategoryNo from "./CategoryNo.model";
import Variant from "./Variant.model";
import Setting from "./Setting.model";
import Selection from "./Selection.model";
import SelectionVariantMapping from "./SelectionVariantMapping.model";
import SelectionValue from "./SelectionValue.model";
import PdfPrintLog from "./PdfPrintLog.model";

// Role -> User
Role.hasMany(User, { foreignKey: "roleId", as: "users" });
User.belongsTo(Role, { foreignKey: "roleId", as: "role" });

// QuotationType -> QuotationModel
QuotationType.hasMany(QuotationModel, {
  foreignKey: "quotationTypeId",
  as: "quotationModels",
});
QuotationModel.belongsTo(QuotationType, {
  foreignKey: "quotationTypeId",
  as: "quotationType",
});

// Quotation -> Category
Quotation.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});
Category.hasMany(Quotation, {
  foreignKey: "categoryId",
  as: "quotations",
});

// Quotation -> QuotationType
Quotation.belongsTo(QuotationType, {
  foreignKey: "quotationTypeId",
  as: "quotationType",
});
QuotationType.hasMany(Quotation, {
  foreignKey: "quotationTypeId",
  as: "quotations",
});

// Quotation -> QuotationModel
Quotation.belongsTo(QuotationModel, {
  foreignKey: "quotationModelId",
  as: "quotationModel",
});
QuotationModel.hasMany(Quotation, {
  foreignKey: "quotationModelId",
  as: "quotations",
});

// Quotation -> Wood, Polish, Fabric
Quotation.belongsTo(Wood, { foreignKey: "woodId", as: "wood" });
Wood.hasMany(Quotation, { foreignKey: "woodId", as: "quotations" });

Quotation.belongsTo(Polish, { foreignKey: "polishId", as: "polish" });
Polish.hasMany(Quotation, { foreignKey: "polishId", as: "quotations" });

Quotation.belongsTo(Fabric, { foreignKey: "fabricId", as: "fabric" });
Fabric.hasMany(Quotation, { foreignKey: "fabricId", as: "quotations" });

// Quotation -> CategoryNo
Quotation.belongsTo(CategoryNo, {
  as: "categoryNo",
  foreignKey: "categoryNoId",
});
CategoryNo.hasMany(Quotation, {
  as: "quotations",
  foreignKey: "categoryNoId",
});

// Quotation -> Variant
Quotation.belongsTo(Variant, { as: "variant", foreignKey: "variantId" });
Variant.hasMany(Quotation, { as: "quotations", foreignKey: "variantId" });

// Selection -> Variant mappings
Selection.hasMany(SelectionVariantMapping, {
  foreignKey: "selectionId",
  as: "variantMappings",
  onDelete: "CASCADE",
});
SelectionVariantMapping.belongsTo(Selection, {
  foreignKey: "selectionId",
  as: "selection",
});
Variant.hasMany(SelectionVariantMapping, {
  foreignKey: "variantId",
  as: "selectionMappings",
});
SelectionVariantMapping.belongsTo(Variant, {
  foreignKey: "variantId",
  as: "variant",
});

Selection.hasMany(SelectionValue, {
  foreignKey: "selectionId",
  as: "values",
  onDelete: "CASCADE",
});
SelectionValue.belongsTo(Selection, {
  foreignKey: "selectionId",
  as: "selection",
});

// Project -> Customer
Project.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
Customer.hasMany(Project, { foreignKey: "customerId", as: "projects" });

// Project -> User (salesPerson)
Project.belongsTo(User, { foreignKey: "salesPersonId", as: "salesPerson" });
User.hasMany(Project, { foreignKey: "salesPersonId", as: "projects" });

// Project -> ProjectItem
Project.hasMany(ProjectItem, {
  foreignKey: "projectId",
  as: "items",
  onDelete: "CASCADE",
});
ProjectItem.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

// ProjectItem -> Quotation
ProjectItem.belongsTo(Quotation, {
  foreignKey: "quotationId",
  as: "quotation",
});
Quotation.hasMany(ProjectItem, {
  foreignKey: "quotationId",
  as: "projectItems",
});

// ProjectItem -> Wood, Polish, Fabric
ProjectItem.belongsTo(Wood, { foreignKey: "woodId", as: "wood" });
Wood.hasMany(ProjectItem, { foreignKey: "woodId", as: "projectItems" });

ProjectItem.belongsTo(Polish, { foreignKey: "polishId", as: "polish" });
Polish.hasMany(ProjectItem, { foreignKey: "polishId", as: "projectItems" });

ProjectItem.belongsTo(Fabric, { foreignKey: "fabricId", as: "fabric" });
Fabric.hasMany(ProjectItem, { foreignKey: "fabricId", as: "projectItems" });

ProjectItem.belongsTo(Variant, {
  foreignKey: "selectedVariantId",
  as: "selectedVariant",
});
Variant.hasMany(ProjectItem, {
  foreignKey: "selectedVariantId",
  as: "selectedProjectItems",
});

// OTPLog -> User
OTPLog.belongsTo(User, { foreignKey: "requestedBy", as: "requester" });
OTPLog.belongsTo(User, { foreignKey: "approvedBy", as: "approver" });

// EmailLog -> User
EmailLog.belongsTo(User, { foreignKey: "sentBy", as: "sender" });

// PdfPrintLog -> Project/User
PdfPrintLog.belongsTo(Project, { foreignKey: "projectId", as: "project" });
Project.hasMany(PdfPrintLog, { foreignKey: "projectId", as: "pdfPrintLogs" });
PdfPrintLog.belongsTo(User, { foreignKey: "generatedBy", as: "generator" });
User.hasMany(PdfPrintLog, {
  foreignKey: "generatedBy",
  as: "generatedPdfPrintLogs",
});

// Customer -> User (creator)
Customer.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});
User.hasMany(Customer, {
  foreignKey: "createdBy",
  as: "customers",
});

export {
  sequelize,
  Role,
  User,
  Category,
  QuotationType,
  QuotationModel,
  Wood,
  Polish,
  Fabric,
  Quotation,
  Customer,
  Project,
  ProjectItem,
  OTPLog,
  EmailLog,
  CategoryNo,
  Variant,
  Setting,
  Selection,
  SelectionVariantMapping,
  SelectionValue,
  PdfPrintLog,
};
