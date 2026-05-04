-- CreateTable
CREATE TABLE "CustomList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomListEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomListEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomList_userId_updatedAt_idx" ON "CustomList"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "CustomList_createdAt_idx" ON "CustomList"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomList_userId_normalizedName_key" ON "CustomList"("userId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "CustomList_userId_id_key" ON "CustomList"("userId", "id");

-- CreateIndex
CREATE INDEX "CustomListEntry_userId_entryId_idx" ON "CustomListEntry"("userId", "entryId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomListEntry_listId_entryId_key" ON "CustomListEntry"("listId", "entryId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomListEntry_userId_listId_entryId_key" ON "CustomListEntry"("userId", "listId", "entryId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTitleEntry_userId_id_key" ON "UserTitleEntry"("userId", "id");

-- AddForeignKey
ALTER TABLE "CustomList" ADD CONSTRAINT "CustomList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomListEntry" ADD CONSTRAINT "CustomListEntry_userId_listId_fkey" FOREIGN KEY ("userId", "listId") REFERENCES "CustomList"("userId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomListEntry" ADD CONSTRAINT "CustomListEntry_userId_entryId_fkey" FOREIGN KEY ("userId", "entryId") REFERENCES "UserTitleEntry"("userId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
