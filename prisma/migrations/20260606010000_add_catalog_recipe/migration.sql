-- CreateTable
CREATE TABLE "CatalogRecipe" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "ingredients" TEXT[],
    "directions" TEXT[],
    "imageUrl" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogRecipe_category_idx" ON "CatalogRecipe"("category");
