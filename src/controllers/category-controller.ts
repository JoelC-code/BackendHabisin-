import { Request, Response } from "express";
import { ok, serverError } from "../utils/response";
import { categoryService } from "../services/category-service";

export const getAll = async (_req: Request, res: Response): Promise<Response> => {
	try {
		const categories = categoryService.getAllCategories();
		return ok(res, categories);
	} catch (e) {
		console.error(e);
		return serverError(res);
	}
};