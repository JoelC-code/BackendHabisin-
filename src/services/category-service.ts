import { FoodCategory } from "../../generated/prisma/enums";

export const categoryService = {
    getAllCategories(): string[] {
        return Object.values(FoodCategory);
    },
};