-- CreateEnum
CREATE TYPE "PageVisibilityState" AS ENUM ('HIDDEN', 'COMING_SOON', 'LIVE');

-- CreateTable
CREATE TABLE "PageVisibility" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "state" "PageVisibilityState" NOT NULL DEFAULT 'HIDDEN',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageVisibility_key_key" ON "PageVisibility"("key");
