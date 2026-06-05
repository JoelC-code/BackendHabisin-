// services/resep-service.ts
import { prismaClient } from "../utils/prisma";
import { toFoodResponseList } from "../models/food-model";
import {
	ResepCreateInput,
	ResepGenerateResponse,
	ResepResponse,
	toResepResponse,
	toResepResponseList,
} from "../models/resep-model";
import { generateRecipeFromAI } from "../utils/gemini-utils";
import { DAILY_GENERATE_LIMIT } from "../utils/env-util";

// Error khusus kuota habis biar controller bisa map ke HTTP 429.
export class QuotaExceededError extends Error {
	constructor(public limit: number) {
		super(
			`Kuota generate resep hari ini sudah habis (${limit}x/hari). Coba lagi besok.`
		);
		this.name = "QuotaExceededError";
	}
}

// Hitung berapa kali user sudah generate hari ini (mulai 00:00 lokal server).
const countGenerationsToday = async (userId: number): Promise<number> => {
	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);

	return prismaClient.generationLog.count({
		where: { userId, createdAt: { gte: startOfToday } },
	});
};

// ─── GENERATE RESEP (preview, tidak otomatis tersimpan) ───
export const generateResep = async (
	userId: number,
	saveToHistory: boolean,
	categoryPreference?: string
): Promise<ResepGenerateResponse> => {
	// Cost-control: cek kuota harian sebelum manggil AI.
	const usedToday = await countGenerationsToday(userId);
	if (usedToday >= DAILY_GENERATE_LIMIT) {
		throw new QuotaExceededError(DAILY_GENERATE_LIMIT);
	}

	const rawFoods = await prismaClient.food.findMany({
		where: {
			user_id: userId,
			quantity: { gt: 0 },
			bestBefore: { gte: new Date() },
		},
	});

	if (rawFoods.length === 0) {
		throw new Error("Tidak ada bahan makanan yang tersedia atau sudah expired");
	}

	const foods = toFoodResponseList(rawFoods);
	const foodList = foods
		.map(f => `- ${f.foodName} | qty: ${f.quantity} | kategori: ${f.category} | best before: ${f.bestBefore}`)
		.join("\n");

	const { parsed } = await generateRecipeFromAI(foodList, categoryPreference);

	// Catat pemakaian (1 panggilan AI berhasil = 1 kuota terpakai).
	await prismaClient.generationLog.create({ data: { userId } });

	// Default: preview saja. Hanya simpan kalau user minta (saveToHistory=true).
	let saved: ResepResponse | undefined;
	if (saveToHistory) {
		const created = await prismaClient.resep.create({
			data: {
				resepName: parsed.resepName,
				resepDescription: parsed.resepDescription,
				resepCategory: parsed.resepCategory,
				resepIngredients: parsed.resepIngredients,
				resepDirections: parsed.resepDirections,
				user_id: userId,
			},
		});
		saved = toResepResponse(created);
	}

	return {
		success: true,
		aiResponse: parsed,
		saved,
		quota: { used: usedToday + 1, limit: DAILY_GENERATE_LIMIT },
	};
};

// ─── SAVE / CREATE RESEP MANUAL ───────────────────────────
// Dipakai untuk: simpan resep hasil generate (user tap "Save"), atau tulis
// resep manual sendiri.
export const createResep = async (
	userId: number,
	data: ResepCreateInput
): Promise<ResepResponse> => {
	const created = await prismaClient.resep.create({
		data: {
			resepName: data.resepName.trim(),
			resepDescription: data.resepDescription.trim(),
			resepCategory: data.resepCategory.trim(),
			resepIngredients: data.resepIngredients,
			resepDirections: data.resepDirections,
			user_id: userId,
		},
	});
	return toResepResponse(created);
};

// ─── GET ALL RESEP (Hanya milik user) ─────────────────────
export const getAllResep = async (userId: number): Promise<ResepResponse[]> => {
	const reseps = await prismaClient.resep.findMany({
		where: { user_id: userId }, // ✅ Filter by user_id
		orderBy: { id: "desc" },
	});
	return toResepResponseList(reseps);
};

// ─── GET RESEP BY ID (Hanya milik user) ───────────────────
export const getResepById = async (userId: number, id: number): Promise<ResepResponse> => {
	const resep = await prismaClient.resep.findFirst({
		where: { id, user_id: userId } // ✅ Pastikan id & user_id cocok
	});

	if (!resep) throw new Error("Resep tidak ditemukan atau bukan milik Anda");
	return toResepResponse(resep);
};

// ─── DELETE RESEP (Hanya milik user) ──────────────────────
export const deleteResep = async (userId: number, id: number): Promise<void> => {
	// Cek dulu apakah resep ini benar milik dia
	const resep = await prismaClient.resep.findFirst({
		where: { id, user_id: userId }
	});

	if (!resep) throw new Error("Resep tidak ditemukan atau Anda tidak memiliki akses untuk menghapusnya");

	await prismaClient.resep.delete({ where: { id } });
};