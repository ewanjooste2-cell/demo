-- CreateTable
CREATE TABLE "Hunt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "suburb" TEXT,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT,
    "ownerEmail" TEXT,
    "sourceUrl" TEXT,
    "askingPrice" INTEGER,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "agentId" TEXT,
    CONSTRAINT "Hunt_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Hunt_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HuntUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "huntId" TEXT NOT NULL,
    "userId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HuntUpdate_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "Hunt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HuntUpdate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Hunt_status_idx" ON "Hunt"("status");
