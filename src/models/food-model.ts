import { Food } from "../../generated/prisma/client";
import { FoodCategory } from "../../generated/prisma/client";

// ─── REQUEST DTO ──────────────────────────────────────────
export interface FoodCreateUpdateRequest {
    foodName: string;
    descriptionFood?: string;
    bestBefore: string;
    quantity: number;
    category: FoodCategory;
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
    }));
}