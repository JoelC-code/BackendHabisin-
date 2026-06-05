import { Food, FoodCategory } from "../../generated/prisma/client";

// ─── REQUEST DTO ──────────────────────────────────────────
export interface FoodCreateUpdateRequest {
    foodName: string;
    descriptionFood?: string;
    bestBefore: string;
    quantity: number;
    category: FoodCategory;
    imageUrl?: string | null;
}

// Input untuk service create — tanggal bisa Date (hasil z.coerce.date) atau
// string, kategori sebagai string biasa (sudah di-uppercase di controller).
export interface FoodCreateInput {
    foodName: string;
    descriptionFood?: string;
    bestBefore: Date | string;
    quantity: number;
    category: string;
    imageUrl?: string | null;
}

// ─── RESPONSE TYPE ────────────────────────────────────────
export interface FoodResponse extends FoodCreateUpdateRequest {
    id: number;
}

// ─── SINGLE MAPPER ────────────────────────────────────────
export function toFoodResponse(prismaFood: Food): FoodResponse {
    return {
        id: prismaFood.id,
        foodName: prismaFood.foodName,
        descriptionFood: prismaFood.descriptionFood,
        bestBefore: prismaFood.bestBefore.toISOString(),
        quantity: prismaFood.quantity,
        category: prismaFood.category,
        imageUrl: prismaFood.imageUrl,
    };
}

// ─── LIST MAPPER ──────────────────────────────────────────
export function toFoodResponseList(prismaFoods: Food[]): FoodResponse[] {
    return prismaFoods.map((food) => ({
        id: food.id,
        foodName: food.foodName,
        descriptionFood: food.descriptionFood,
        bestBefore: food.bestBefore.toISOString(),
        quantity: food.quantity,
        category: food.category,
        imageUrl: food.imageUrl,
    }));
}