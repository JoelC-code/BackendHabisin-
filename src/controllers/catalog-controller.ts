import { Response } from "express";
import { UserRequest } from "../models/user-request-model";
import { catalogService } from "../services/catalog-service";
import { ok, paginated, notFound, badRequest, serverError } from "../utils/response";

export class CatalogController {
    // GET /api/catalog?page=1&limit=10&category=...&search=...
    static async list(req: UserRequest, res: Response): Promise<Response> {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
            const category = req.query.category ? String(req.query.category) : undefined;
            const search = req.query.search ? String(req.query.search) : undefined;

            const result = await catalogService.list(req.user!.id, {
                page,
                limit,
                category,
                search,
            });

            return paginated(res, result.items, result.total, result.page, result.limit);
        } catch (e) {
            console.error(e);
            return serverError(res);
        }
    }

    // GET /api/catalog/categories
    static async categories(_req: UserRequest, res: Response): Promise<Response> {
        try {
            const categories = await catalogService.categories();
            return ok(res, categories);
        } catch (e) {
            console.error(e);
            return serverError(res);
        }
    }

    // GET /api/catalog/:id
    static async getById(req: UserRequest, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) return badRequest(res, "ID tidak valid");

            const result = await catalogService.getById(req.user!.id, id);

            if (result.status === "not_found") {
                return notFound(res, "Resep tidak ditemukan");
            }
            if (result.status === "locked") {
                return res.status(403).json({
                    success: false,
                    message: "Resep ini khusus subscriber (PRO). Upgrade untuk membukanya.",
                    subscriptionRequired: true,
                });
            }

            return ok(res, result.detail);
        } catch (e) {
            console.error(e);
            return serverError(res);
        }
    }
}
