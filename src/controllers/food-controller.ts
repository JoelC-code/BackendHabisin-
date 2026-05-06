import { z } from "zod";
import { NextFunction, Response } from "express";
import { foodService } from "../services/food-service";
import { ok, created, notFound, serverError } from "../utils/response";
import { UserRequest } from "../models/user-request-model";

const foodSchema = z.object({
	foodName: z.string().min(1),
	descriptionFood: z.string().optional(),
	bestBefore: z.string().datetime(),
	quantity: z.number().int().positive(),
	category: z.enum(["PRODUCE", "DIARY", "MEAT", "OTHER"]),
});

export class FoodController {

	// ─── GET ALL ───────────────────────────────────────────
	static async getAll(req: UserRequest, res: Response, next: NextFunction) {
		try {
			const response = await foodService.getAllFoods(req.user!);

			return ok(res, response);
		} catch (error) {
			return next(error);
		}
	}

	// ─── GET BY ID ─────────────────────────────────────────
	static async getById(req: UserRequest, res: Response, next: NextFunction) {
		try {
			const id = Number(req.params.id);

			const food = await foodService.getById(id);

			if (!food) return notFound(res, "Food not found");

			return ok(res, food);
		} catch (error) {
			return next(error);
		}
	}

	// ─── CREATE ────────────────────────────────────────────
	static async create(req: UserRequest, res: Response, next: NextFunction) {
		const parsed = foodSchema.safeParse(req.body);

		if (!parsed.success) {
			return serverError(res, "Validation error");
		}

		try {
			const food = await foodService.create(parsed.data, req.user!.id);

			return created(res, food, "Food created");
		} catch (error) {
			return next(error);
		}
	}

	// ─── DELETE ────────────────────────────────────────────
	static async remove(req: UserRequest, res: Response, next: NextFunction) {
		try {
			const id = Number(req.params.id);

			await foodService.remove(id);

			return ok(res, null, "Food deleted");
		} catch (error: any) {
			if (error.code === "P2025") {
				return notFound(res, "Food not found");
			}

			return next(error);
		}
	}
}