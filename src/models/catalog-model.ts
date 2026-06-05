import { CatalogRecipe } from "../../generated/prisma/client";

export type Tier = "free" | "pro";

// Ringkasan untuk list/browse (tanpa bahan & langkah).
export interface CatalogRecipeSummary {
    id: number;
    name: string;
    description: string;
    category: string;
    imageUrl: string | null;
    isPremium: boolean;
    locked: boolean; // true kalau premium & user masih free
}

// Detail penuh (bahan & langkah) — hanya dikirim kalau tidak terkunci.
export interface CatalogRecipeDetail extends CatalogRecipeSummary {
    ingredients: string[];
    directions: string[];
}

export function toCatalogSummary(r: CatalogRecipe, tier: Tier): CatalogRecipeSummary {
    return {
        id: r.id,
        name: r.name,
        description: r.description,
        category: r.category,
        imageUrl: r.imageUrl,
        isPremium: r.isPremium,
        locked: r.isPremium && tier === "free",
    };
}

export function toCatalogDetail(r: CatalogRecipe, tier: Tier): CatalogRecipeDetail {
    return {
        ...toCatalogSummary(r, tier),
        ingredients: r.ingredients,
        directions: r.directions,
    };
}
