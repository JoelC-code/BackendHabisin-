-- CreateEnum
CREATE TYPE "FoodCategory" AS ENUM ('PRODUCE', 'DIARY', 'MEAT', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "card_id" SERIAL NOT NULL,
    "foodName" VARCHAR(100) NOT NULL,
    "descriptionFood" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "bestBefore" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "category" "FoodCategory" NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("card_id")
);

-- CreateTable
CREATE TABLE "Resep" (
    "card_id" SERIAL NOT NULL,
    "resepName" VARCHAR(100) NOT NULL,
    "resepDescription" VARCHAR(255) NOT NULL,
    "resepIngredients" TEXT[],
    "resepDirections" TEXT[],

    CONSTRAINT "Resep_pkey" PRIMARY KEY ("card_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
