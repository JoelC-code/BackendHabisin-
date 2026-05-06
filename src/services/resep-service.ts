// services/resep-service.ts
import { PrismaClient } from "../../generated/prisma/client";
import { toFoodResponseList } from "../models/food-model";
import {
  ResepGenerateResponse,
  ResepResponse,
  toResepResponse,
  toResepResponseList,
} from "../models/resep-model";
import { generateRecipeFromAI } from "../utils/gemini-utils";

const prisma = new PrismaClient();

// ─── GENERATE RESEP ───────────────────────────────────────
export const generateResep = async (
  userId: number,
  saveToHistory: boolean
): Promise<ResepGenerateResponse> => {
  const rawFoods = await prisma.food.findMany({
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

  const { aiResponse, parsed } = await generateRecipeFromAI(foodList);

  let saved: ResepResponse | undefined;
  if (saveToHistory) {
    const created = await prisma.resep.create({
      data: {
        resepName: parsed.resepName,
        resepDescription: parsed.resepDescription,
        resepIngredients: parsed.resepIngredients,
        resepDirections: parsed.resepDirections,
        user_id: userId,
      },
    });
    saved = toResepResponse(created);
  }
  
 return { success: true, aiResponse: parsed, saved };
};

// ─── GET ALL RESEP (Hanya milik user) ─────────────────────
export const getAllResep = async (userId: number): Promise<ResepResponse[]> => {
  const reseps = await prisma.resep.findMany({
    where: { user_id: userId }, // ✅ Filter by user_id
    orderBy: { id: "desc" },
  });
  return toResepResponseList(reseps);
};

// ─── GET RESEP BY ID (Hanya milik user) ───────────────────
export const getResepById = async (userId: number, id: number): Promise<ResepResponse> => {
  const resep = await prisma.resep.findFirst({ 
    where: { id, user_id: userId } // ✅ Pastikan id & user_id cocok
  });
  
  if (!resep) throw new Error("Resep tidak ditemukan atau bukan milik Anda");
  return toResepResponse(resep);
};

// ─── DELETE RESEP (Hanya milik user) ──────────────────────
export const deleteResep = async (userId: number, id: number): Promise<void> => {
  // Cek dulu apakah resep ini benar milik dia
  const resep = await prisma.resep.findFirst({ 
    where: { id, user_id: userId } 
  });
  
  if (!resep) throw new Error("Resep tidak ditemukan atau Anda tidak memiliki akses untuk menghapusnya");
  
  await prisma.resep.delete({ where: { id } });
};