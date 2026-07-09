-- CreateTable
CREATE TABLE "Presentation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "heldAt" DATETIME NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Presentation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentCost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "month" DATETIME NOT NULL,
    "amount" INTEGER NOT NULL,
    CONSTRAINT "AgentCost_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketingSpend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" DATETIME NOT NULL,
    "channel" TEXT NOT NULL,
    "amount" INTEGER NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "webRef" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "propertyType" TEXT NOT NULL DEFAULT 'House',
    "bedrooms" INTEGER,
    "url" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "soldDate" DATETIME,
    "listedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commissionPct" REAL NOT NULL DEFAULT 5.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agentId" TEXT,
    CONSTRAINT "Listing_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("address", "agentId", "bedrooms", "createdAt", "id", "latitude", "listedDate", "longitude", "price", "propertyType", "soldDate", "status", "suburb", "title", "url", "webRef") SELECT "address", "agentId", "bedrooms", "createdAt", "id", "latitude", "listedDate", "longitude", "price", "propertyType", "soldDate", "status", "suburb", "title", "url", "webRef" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
CREATE UNIQUE INDEX "Listing_webRef_key" ON "Listing"("webRef");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Presentation_heldAt_idx" ON "Presentation"("heldAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentCost_agentId_month_key" ON "AgentCost"("agentId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingSpend_month_channel_key" ON "MarketingSpend"("month", "channel");
