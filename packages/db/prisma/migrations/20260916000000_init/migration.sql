-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EXECUTIVE', 'CS', 'GR', 'DC', 'VD', 'S2');

-- CreateEnum
CREATE TYPE "SiteType" AS ENUM ('BRANCH', 'DC');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('CUSTOMER', 'STOCK');

-- CreateEnum
CREATE TYPE "ShippingMethod" AS ENUM ('STANDARD', 'EXPRESS');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('DSD', 'DC', 'TPL');

-- CreateEnum
CREATE TYPE "VendorCenterMethod" AS ENUM ('DSD', 'DC', 'DC_DSD');

-- CreateEnum
CREATE TYPE "OwnerDept" AS ENUM ('CS', 'GR', 'DC', 'VD', 'TPL', 'CUSTOMER', 'CARRIER');

-- CreateEnum
CREATE TYPE "JobStage" AS ENUM ('PENDING_VENDOR_ASSIGNMENT', 'CS_OPENED', 'GR_RECEIVED', 'GR_PACKED', 'OUTBOUND_TO_DC', 'AT_DC_OUTBOUND', 'OUTBOUND_TO_VD', 'VD_INSPECTING', 'WAITING_APPROVAL', 'REPAIRING', 'RETURN_PACKING', 'INBOUND_TO_DC', 'AT_DC_INBOUND', 'INBOUND_TO_BRANCH', 'GR_RETURN_RECEIVED', 'READY_FOR_PICKUP', 'CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomerDecision" AS ENUM ('APPROVED', 'REJECTED', 'AUTO_APPROVED');

-- CreateEnum
CREATE TYPE "ShipmentDirection" AS ENUM ('OUTBOUND', 'INBOUND');

-- CreateEnum
CREATE TYPE "ShipmentLeg" AS ENUM ('BRANCH_TO_DC', 'DC_TO_VD', 'BRANCH_TO_VD', 'VD_TO_DC', 'DC_TO_BRANCH', 'VD_TO_BRANCH');

-- CreateEnum
CREATE TYPE "Carrier" AS ENUM ('DC_FLEET', 'VD_FLEET', 'TPL');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING_DISPATCH', 'DISPATCHED', 'PICKED_UP', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DispatchMethod" AS ENUM ('PRINT', 'LINK', 'API');

-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('INTAKE_PRODUCT', 'GR_RECEIVE', 'GR_PACK', 'GR_HANDOFF', 'CARRIER_PICKUP', 'DC_HANDOFF_VD', 'VD_RETURN_PACK', 'DC_RETURN_RECEIVE', 'GR_RETURN_RECEIVE', 'GR_DELIVER_CS', 'TRADEIN_PRODUCT', 'DOCUMENT_PDF', 'OTHER');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "QuoteLineType" AS ENUM ('INSPECTION_FEE', 'PART', 'LABOR', 'OTHER');

-- CreateEnum
CREATE TYPE "ChargeType" AS ENUM ('OPERATION_FEE', 'SHIPPING_FEE', 'REPAIR', 'OPERATION_FEE_CREDIT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('INTAKE', 'REPAIR');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PROMPTPAY_QR', 'CARD_LINK', 'POS_RECEIPT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SlaClockStatus" AS ENUM ('RUNNING', 'PAUSED', 'STOPPED');

-- CreateEnum
CREATE TYPE "TradeInType" AS ENUM ('TYPE1_WALK_IN', 'TYPE2_BACKOFFICE');

-- CreateEnum
CREATE TYPE "TradeInStatus" AS ENUM ('ISSUED', 'USED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PayoutCycleType" AS ENUM ('DAYS_OF_MONTH', 'EVERY_15_DAYS', 'WEEKLY');

-- CreateEnum
CREATE TYPE "PayoutBatchStatus" AS ENUM ('DRAFT', 'SENT', 'PAID');

-- CreateEnum
CREATE TYPE "TokenPurpose" AS ENUM ('TRACKING', 'QUOTE', 'PAYMENT', 'DRIVER', 'CSAT');

-- CreateTable
CREATE TABLE "DistrictManager" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "areaLabel" TEXT NOT NULL,

    CONSTRAINT "DistrictManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SiteType" NOT NULL,
    "address" TEXT,
    "districtManagerId" TEXT,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SizeCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SizeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeRate" (
    "id" TEXT NOT NULL,
    "sizeCategoryId" TEXT NOT NULL,
    "operationFeeSatang" INTEGER NOT NULL,
    "shippingFee3plSatang" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultGpPct" DECIMAL(5,2) NOT NULL,
    "defaultRepairSlaDays" INTEGER NOT NULL,
    "inspectionFeeCoveredSatang" INTEGER NOT NULL DEFAULT 0,
    "inspectionFeeNotCoveredSatang" INTEGER NOT NULL DEFAULT 0,
    "repairWarrantyDays" INTEGER NOT NULL DEFAULT 30,
    "isBrandAuthorized" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorCenter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "zoneSiteId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "method" "VendorCenterMethod" NOT NULL,
    "gpPctOverride" DECIMAL(5,2),
    "repairSlaDaysOverride" INTEGER,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "VendorCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchVendorRoute" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "primaryCenterId" TEXT NOT NULL,
    "backupCenterId" TEXT,
    "standardChannel" "Channel" NOT NULL,

    CONSTRAINT "BranchVendorRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaStep" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startEvent" TEXT NOT NULL,
    "stopEvent" TEXT NOT NULL,
    "condition" TEXT,
    "hours" INTEGER NOT NULL,
    "ownerDept" "OwnerDept" NOT NULL,
    "pausable" BOOLEAN NOT NULL DEFAULT false,
    "appliesTo" "JobType"[] DEFAULT ARRAY['CUSTOMER', 'STOCK']::"JobType"[],
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SlaStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairSku" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "chargeType" "ChargeType" NOT NULL,

    CONSTRAINT "RepairSku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutCycleConfig" (
    "id" TEXT NOT NULL,
    "cycleType" "PayoutCycleType" NOT NULL,
    "daysOfMonth" INTEGER[],
    "nextCycleDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutCycleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeInType" "TradeInType" NOT NULL,
    "sizeCategoryId" TEXT NOT NULL,
    "subDept" TEXT,
    "percent" DECIMAL(5,2) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleMenuPermission" (
    "role" "Role" NOT NULL,
    "menuKey" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,

    CONSTRAINT "RoleMenuPermission_pkey" PRIMARY KEY ("role","menuKey")
);

-- CreateTable
CREATE TABLE "RoleDataPermission" (
    "role" "Role" NOT NULL,
    "canViewCost" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RoleDataPermission_pkey" PRIMARY KEY ("role")
);

-- CreateTable
CREATE TABLE "DashboardWidgetConfig" (
    "widgetKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "DashboardWidgetConfig_pkey" PRIMARY KEY ("widgetKey")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ThaiAddress" (
    "id" SERIAL NOT NULL,
    "zipcode" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "subdistrict" TEXT NOT NULL,

    CONSTRAINT "ThaiAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "siteId" TEXT,
    "vendorCenterId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "zipcode" TEXT,
    "province" TEXT,
    "district" TEXT,
    "subdistrict" TEXT,
    "street" TEXT,
    "lineUserId" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInvoiceProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "zipcode" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "subdistrict" TEXT NOT NULL,
    "street" TEXT NOT NULL,

    CONSTRAINT "TaxInvoiceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "jobNo" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "stage" "JobStage" NOT NULL,
    "stageEnteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 0,
    "branchId" TEXT NOT NULL,
    "customerId" TEXT,
    "taxInvoiceProfileId" TEXT,
    "useCustomerAddressForTax" BOOLEAN NOT NULL DEFAULT true,
    "hasWarranty" BOOLEAN,
    "allowNonAuthorizedVendor" BOOLEAN NOT NULL DEFAULT false,
    "sizeCategoryId" TEXT,
    "shippingMethod" "ShippingMethod",
    "defectNotes" TEXT,
    "vendorCenterId" TEXT,
    "channel" "Channel",
    "vdContactName" TEXT,
    "customerDecision" "CustomerDecision",
    "decidedAt" TIMESTAMP(3),
    "repairFinishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "cancelledReason" TEXT,
    "openedById" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobItem" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "sku" TEXT,
    "productName" TEXT NOT NULL,
    "brandId" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "holdStockNo" TEXT,
    "defect" TEXT NOT NULL,

    CONSTRAINT "JobItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStage" "JobStage",
    "toStage" "JobStage",
    "actorUserId" TEXT,
    "actorRole" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "eventId" TEXT,
    "tradeInId" TEXT,
    "kind" "AttachmentKind" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationAssignment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "locationCode" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearedAt" TIMESTAMP(3),

    CONSTRAINT "LocationAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "direction" "ShipmentDirection" NOT NULL,
    "leg" "ShipmentLeg" NOT NULL,
    "carrier" "Carrier" NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING_DISPATCH',
    "dispatchMethod" "DispatchMethod",
    "dispatchedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "trackingNo" TEXT,
    "labelStorageKey" TEXT,
    "costSatang" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "quoteNo" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotalSatang" INTEGER NOT NULL,
    "vatSatang" INTEGER NOT NULL,
    "totalSatang" INTEGER NOT NULL,
    "vatRate" DECIMAL(5,4) NOT NULL,
    "repairDays" INTEGER,
    "repairWarrantyDays" INTEGER NOT NULL,
    "vendorNote" TEXT,
    "createdById" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "type" "QuoteLineType" NOT NULL,
    "description" TEXT NOT NULL,
    "priceSatang" INTEGER NOT NULL,
    "partWaitDays" INTEGER,
    "partWarrantyDays" INTEGER,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCharge" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" "ChargeType" NOT NULL,
    "amountSatang" INTEGER NOT NULL,
    "repairSkuId" TEXT,
    "quoteId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amountSatang" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "providerRef" TEXT,
    "posReceiptNo" TEXT,
    "qrPayload" TEXT,
    "paymentUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaClock" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "slaStepId" TEXT NOT NULL,
    "ownerDept" "OwnerDept" NOT NULL,
    "status" "SlaClockStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "pausedAt" TIMESTAMP(3),
    "pausedMinutes" INTEGER NOT NULL DEFAULT 0,
    "stoppedAt" TIMESTAMP(3),
    "breached" BOOLEAN NOT NULL DEFAULT false,
    "breachedAt" TIMESTAMP(3),

    CONSTRAINT "SlaClock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeIn" (
    "id" TEXT NOT NULL,
    "tradeInNo" TEXT NOT NULL,
    "type" "TradeInType" NOT NULL,
    "jobId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "sku" TEXT,
    "productName" TEXT NOT NULL,
    "brandName" TEXT,
    "defect" TEXT,
    "sizeCategoryId" TEXT NOT NULL,
    "promotionId" TEXT,
    "percent" DECIMAL(5,2) NOT NULL,
    "status" "TradeInStatus" NOT NULL DEFAULT 'ISSUED',
    "walletRef" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorDeduction" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "jobId" TEXT,
    "amountSatang" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "payoutLineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorDeduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPayoutBatch" (
    "id" TEXT NOT NULL,
    "cycleDate" DATE NOT NULL,
    "status" "PayoutBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "sentById" TEXT,
    "externalRef" TEXT,

    CONSTRAINT "VendorPayoutBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPayoutLine" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "vendorCenterId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "repairAmountSatang" INTEGER NOT NULL,
    "gpPct" DECIMAL(5,2) NOT NULL,
    "gpAmountSatang" INTEGER NOT NULL,
    "deductionSatang" INTEGER NOT NULL DEFAULT 0,
    "netAmountSatang" INTEGER NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VendorPayoutLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CsatSurvey" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CsatSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicToken" (
    "token" TEXT NOT NULL,
    "purpose" "TokenPurpose" NOT NULL,
    "jobId" TEXT NOT NULL,
    "refId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "PublicToken_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "RunningNumber" (
    "prefix" TEXT NOT NULL,
    "yymm" TEXT NOT NULL,
    "lastSeq" INTEGER NOT NULL,

    CONSTRAINT "RunningNumber_pkey" PRIMARY KEY ("prefix","yymm")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "channel" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxMessage" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BrandToVendor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BrandToVendor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SizeCategoryToVendor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SizeCategoryToVendor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_code_key" ON "Site"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SizeCategory_code_key" ON "SizeCategory"("code");

-- CreateIndex
CREATE INDEX "FeeRate_sizeCategoryId_effectiveFrom_idx" ON "FeeRate"("sizeCategoryId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_code_key" ON "Vendor"("code");

-- CreateIndex
CREATE UNIQUE INDEX "VendorCenter_code_key" ON "VendorCenter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BranchVendorRoute_branchId_primaryCenterId_key" ON "BranchVendorRoute"("branchId", "primaryCenterId");

-- CreateIndex
CREATE UNIQUE INDEX "SlaStep_code_key" ON "SlaStep"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RepairSku_code_key" ON "RepairSku"("code");

-- CreateIndex
CREATE INDEX "ThaiAddress_zipcode_idx" ON "ThaiAddress"("zipcode");

-- CreateIndex
CREATE INDEX "ThaiAddress_province_district_idx" ON "ThaiAddress"("province", "district");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Job_jobNo_key" ON "Job"("jobNo");

-- CreateIndex
CREATE UNIQUE INDEX "Job_taxInvoiceProfileId_key" ON "Job"("taxInvoiceProfileId");

-- CreateIndex
CREATE INDEX "Job_stage_idx" ON "Job"("stage");

-- CreateIndex
CREATE INDEX "Job_branchId_stage_idx" ON "Job"("branchId", "stage");

-- CreateIndex
CREATE INDEX "Job_vendorCenterId_stage_idx" ON "Job"("vendorCenterId", "stage");

-- CreateIndex
CREATE INDEX "Job_openedAt_idx" ON "Job"("openedAt");

-- CreateIndex
CREATE INDEX "JobEvent_jobId_createdAt_idx" ON "JobEvent"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "JobEvent_type_createdAt_idx" ON "JobEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "LocationAssignment_siteId_clearedAt_idx" ON "LocationAssignment"("siteId", "clearedAt");

-- CreateIndex
CREATE INDEX "Shipment_status_leg_idx" ON "Shipment"("status", "leg");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNo_key" ON "Quote"("quoteNo");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");

-- CreateIndex
CREATE INDEX "SlaClock_status_dueAt_idx" ON "SlaClock"("status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "SlaClock_jobId_slaStepId_key" ON "SlaClock"("jobId", "slaStepId");

-- CreateIndex
CREATE UNIQUE INDEX "TradeIn_tradeInNo_key" ON "TradeIn"("tradeInNo");

-- CreateIndex
CREATE UNIQUE INDEX "TradeIn_jobId_key" ON "TradeIn"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPayoutLine_jobId_key" ON "VendorPayoutLine"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "CsatSurvey_jobId_key" ON "CsatSurvey"("jobId");

-- CreateIndex
CREATE INDEX "_BrandToVendor_B_index" ON "_BrandToVendor"("B");

-- CreateIndex
CREATE INDEX "_SizeCategoryToVendor_B_index" ON "_SizeCategoryToVendor"("B");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_districtManagerId_fkey" FOREIGN KEY ("districtManagerId") REFERENCES "DistrictManager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeRate" ADD CONSTRAINT "FeeRate_sizeCategoryId_fkey" FOREIGN KEY ("sizeCategoryId") REFERENCES "SizeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorCenter" ADD CONSTRAINT "VendorCenter_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorCenter" ADD CONSTRAINT "VendorCenter_zoneSiteId_fkey" FOREIGN KEY ("zoneSiteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchVendorRoute" ADD CONSTRAINT "BranchVendorRoute_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchVendorRoute" ADD CONSTRAINT "BranchVendorRoute_primaryCenterId_fkey" FOREIGN KEY ("primaryCenterId") REFERENCES "VendorCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchVendorRoute" ADD CONSTRAINT "BranchVendorRoute_backupCenterId_fkey" FOREIGN KEY ("backupCenterId") REFERENCES "VendorCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_sizeCategoryId_fkey" FOREIGN KEY ("sizeCategoryId") REFERENCES "SizeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_vendorCenterId_fkey" FOREIGN KEY ("vendorCenterId") REFERENCES "VendorCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_taxInvoiceProfileId_fkey" FOREIGN KEY ("taxInvoiceProfileId") REFERENCES "TaxInvoiceProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_vendorCenterId_fkey" FOREIGN KEY ("vendorCenterId") REFERENCES "VendorCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEvent" ADD CONSTRAINT "JobEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "JobEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_tradeInId_fkey" FOREIGN KEY ("tradeInId") REFERENCES "TradeIn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationAssignment" ADD CONSTRAINT "LocationAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCharge" ADD CONSTRAINT "JobCharge_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaClock" ADD CONSTRAINT "SlaClock_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaClock" ADD CONSTRAINT "SlaClock_slaStepId_fkey" FOREIGN KEY ("slaStepId") REFERENCES "SlaStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeIn" ADD CONSTRAINT "TradeIn_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeIn" ADD CONSTRAINT "TradeIn_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDeduction" ADD CONSTRAINT "VendorDeduction_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayoutLine" ADD CONSTRAINT "VendorPayoutLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "VendorPayoutBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayoutLine" ADD CONSTRAINT "VendorPayoutLine_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CsatSurvey" ADD CONSTRAINT "CsatSurvey_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicToken" ADD CONSTRAINT "PublicToken_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BrandToVendor" ADD CONSTRAINT "_BrandToVendor_A_fkey" FOREIGN KEY ("A") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BrandToVendor" ADD CONSTRAINT "_BrandToVendor_B_fkey" FOREIGN KEY ("B") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SizeCategoryToVendor" ADD CONSTRAINT "_SizeCategoryToVendor_A_fkey" FOREIGN KEY ("A") REFERENCES "SizeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SizeCategoryToVendor" ADD CONSTRAINT "_SizeCategoryToVendor_B_fkey" FOREIGN KEY ("B") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

