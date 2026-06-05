import { prismaClient } from "../utils/prisma";
import { PaymentService } from "./payment-service";
import {
    CatalogRecipeDetail,
    CatalogRecipeSummary,
    toCatalogDetail,
    toCatalogSummary,
} from "../models/catalog-model";

interface ListParams {
    page: number;
    limit: number;
    category?: string;
    search?: string;
}

interface ListResult {
    items: CatalogRecipeSummary[];
    total: number;
    page: number;
    limit: number;
}

export const catalogService = {
    // Browse katalog (paginated, filter kategori, search nama).
    async list(userId: number, params: ListParams): Promise<ListResult> {
        const tier = await PaymentService.getUserTier(userId);
        const { page, limit, category, search } = params;

        const where: any = {};
        if (category && category.toLowerCase() !== "all") {
            where.category = category;
        }
        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        const [rows, total] = await Promise.all([
            prismaClient.catalogRecipe.findMany({
                where,
                orderBy: { id: "asc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prismaClient.catalogRecipe.count({ where }),
        ]);

        return {
            items: rows.map((r) => toCatalogSummary(r, tier)),
            total,
            page,
            limit,
        };
    },

    // Detail satu resep. Premium + user free → terkunci.
    async getById(
        userId: number,
        id: number
    ): Promise<
        | { status: "ok"; detail: CatalogRecipeDetail }
        | { status: "not_found" }
        | { status: "locked" }
    > {
        const tier = await PaymentService.getUserTier(userId);
        const r = await prismaClient.catalogRecipe.findUnique({ where: { id } });

        if (!r) return { status: "not_found" };
        if (r.isPremium && tier === "free") return { status: "locked" };

        return { status: "ok", detail: toCatalogDetail(r, tier) };
    },

    // Daftar kategori unik yang ada di katalog (buat chip filter di FE).
    async categories(): Promise<string[]> {
        const rows = await prismaClient.catalogRecipe.findMany({
            select: { category: true },
            distinct: ["category"],
            orderBy: { category: "asc" },
        });
        return rows.map((r) => r.category);
    },
};
