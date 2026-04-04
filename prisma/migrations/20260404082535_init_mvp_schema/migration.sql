-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('PLAN_TO_WATCH', 'WATCHING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'TV', 'ANIME');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "username" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Title" (
    "id" TEXT NOT NULL,
    "externalSource" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "description" TEXT,
    "posterUrl" TEXT,
    "backdropUrl" TEXT,
    "mediaType" "MediaType" NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "totalEpisodes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Title_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTitleEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "status" "EntryStatus" NOT NULL,
    "rating" INTEGER,
    "review" TEXT,
    "progressCurrent" INTEGER,
    "rewatchCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTitleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_authUserId_key" ON "UserProfile"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_username_key" ON "UserProfile"("username");

-- CreateIndex
CREATE INDEX "UserProfile_createdAt_idx" ON "UserProfile"("createdAt");

-- CreateIndex
CREATE INDEX "Title_mediaType_idx" ON "Title"("mediaType");

-- CreateIndex
CREATE INDEX "Title_releaseDate_idx" ON "Title"("releaseDate");

-- CreateIndex
CREATE INDEX "Title_createdAt_idx" ON "Title"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Title_externalSource_externalId_key" ON "Title"("externalSource", "externalId");

-- CreateIndex
CREATE INDEX "UserTitleEntry_userId_status_idx" ON "UserTitleEntry"("userId", "status");

-- CreateIndex
CREATE INDEX "UserTitleEntry_userId_updatedAt_idx" ON "UserTitleEntry"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "UserTitleEntry_titleId_idx" ON "UserTitleEntry"("titleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTitleEntry_userId_titleId_key" ON "UserTitleEntry"("userId", "titleId");

-- AddForeignKey
ALTER TABLE "UserTitleEntry" ADD CONSTRAINT "UserTitleEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTitleEntry" ADD CONSTRAINT "UserTitleEntry_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;
