import { FoodCategory } from "../../generated/prisma/client";

export const categoryService = {
    getAllCategories(): string[] {
        return Object.values(FoodCategory);
    },
};