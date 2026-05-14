import { prismaClient } from "../utils/prisma";
import { UserJWTPayload } from "../models/user-model";

import {
    FoodCreateUpdateRequest,
    FoodResponse,
    toFoodResponse,
    toFoodResponseList,
} from "../models/food-model";

export const foodService = {
    // ─── GET ALL ───────────────────────────────────────────
    async getAllFoods(user: UserJWTPayload): Promise<FoodResponse[]> {
        const foods = await prismaClient.food.findMany({
            where: {
                user_id: user.id,
            },
            orderBy: {
                bestBefore: 'asc' 
            }
        });

        return toFoodResponseList(foods);
    },

    // ─── GET BY ID ─────────────────────────────────────────
    async getById(id: number): Promise<FoodResponse | null> {
        const food = await prismaClient.food.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, username: true } },
            },
        });

        if (!food) return null;

        return toFoodResponse(food);
    },

    // ─── CREATE ────────────────────────────────────────────
    async create(
        data: FoodCreateUpdateRequest,
        userId: number
    ): Promise<FoodResponse> {
        const food = await prismaClient.food.create({
            data: {
                user_id: userId,
                foodName: data.foodName.trim(),
                descriptionFood: data.descriptionFood?.trim() || "",
                bestBefore: new Date(data.bestBefore),
                quantity: data.quantity,
                category: data.category,
                imageUrl: data.imageUrl || null,
            },
        });

        return toFoodResponse(food);
    },

    // ─── DELETE ────────────────────────────────────────────
    async remove(id: number): Promise<void> {
        await prismaClient.food.delete({
            where: { id },
        });
    },
};