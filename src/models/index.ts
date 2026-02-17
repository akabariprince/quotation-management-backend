// src/models/index.ts
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

// Role -> User
Role.hasMany(User, { foreignKey: "roleId", as: "users" });
User.belongsTo(Role, { foreignKey: "roleId", as: "role" });

// Category -> QuotationType (was ProductType)
Category.hasMany(QuotationType, {
  foreignKey: "categoryId",
  as: "quotationTypes",
});
QuotationType.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});

// QuotationType -> QuotationModel (was ProductType -> ProductModel)
QuotationType.hasMany(QuotationModel, {
  foreignKey: "quotationTypeId",
  as: "quotationModels",
});
QuotationModel.belongsTo(QuotationType, {
  foreignKey: "quotationTypeId",
  as: "quotationType",
});

// Quotation associations (was Product)
Quotation.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});
Quotation.belongsTo(QuotationType, {
  foreignKey: "quotationTypeId",
  as: "quotationType",
});
Quotation.belongsTo(QuotationModel, {
  foreignKey: "quotationModelId",
  as: "quotationModel",
});
Category.hasMany(Quotation, {
  foreignKey: "categoryId",
  as: "quotations",
});
QuotationType.hasMany(Quotation, {
  foreignKey: "quotationTypeId",
  as: "quotations",
});
QuotationModel.hasMany(Quotation, {
  foreignKey: "quotationModelId",
  as: "quotations",
});

// Quotation -> Wood, Polish, Fabric (was Product -> Wood, Polish, Fabric)
Quotation.belongsTo(Wood, { foreignKey: "woodId", as: "wood" });
Wood.hasMany(Quotation, { foreignKey: "woodId", as: "quotations" });

Quotation.belongsTo(Polish, { foreignKey: "polishId", as: "polish" });
Polish.hasMany(Quotation, { foreignKey: "polishId", as: "quotations" });

Quotation.belongsTo(Fabric, { foreignKey: "fabricId", as: "fabric" });
Fabric.hasMany(Quotation, { foreignKey: "fabricId", as: "quotations" });

// Project -> Customer (was Quotation -> Customer)
Project.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
Customer.hasMany(Project, { foreignKey: "customerId", as: "projects" });

// Project -> User (salesPerson) (was Quotation -> User)
Project.belongsTo(User, { foreignKey: "salesPersonId", as: "salesPerson" });
User.hasMany(Project, { foreignKey: "salesPersonId", as: "projects" });

// Project -> ProjectItem (was Quotation -> QuotationItem)
Project.hasMany(ProjectItem, {
  foreignKey: "projectId",
  as: "items",
  onDelete: "CASCADE",
});
ProjectItem.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

// ProjectItem associations (was QuotationItem)
// ProjectItem -> Quotation (was QuotationItem -> Product)
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

// OTPLog -> User
OTPLog.belongsTo(User, { foreignKey: "requestedBy", as: "requester" });
OTPLog.belongsTo(User, { foreignKey: "approvedBy", as: "approver" });

// EmailLog -> User
EmailLog.belongsTo(User, { foreignKey: "sentBy", as: "sender" });

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
};