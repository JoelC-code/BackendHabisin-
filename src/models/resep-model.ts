import { Resep } from "../../generated/prisma/client";

// ─── REQUEST DTO ──────────────────────────────────────────
export interface ResepGenerateRequest {
  saveToHistory?: boolean; // optional: simpan hasil ke tabel Resep
}

export interface ResepCreateRequest {
  resepName: string;
  resepDescription: string;
  resepIngredients: string[];
  resepDirections: string[];
}

// ─── RESPONSE TYPE ────────────────────────────────────────
export interface ResepResponse {
  id: number;
  resepName: string;
  resepDescription: string;
  resepIngredients: string[];
  resepDirections: string[];
}

export type ResepGenerateResponse = {
  success: boolean;
  aiResponse: any; // ✅ Ubah dari string menjadi any atau objek
  saved?: ResepResponse;
}

// ─── MAPPER ───────────────────────────────────────────────
export function toResepResponse(prismaResep: Resep): ResepResponse {
  return {
    id: prismaResep.id,
    resepName: prismaResep.resepName,
    resepDescription: prismaResep.resepDescription,
    resepIngredients: prismaResep.resepIngredients,
    resepDirections: prismaResep.resepDirections,
  };
}

export function toResepResponseList(prismaReseps: Resep[]): ResepResponse[] {
  return prismaReseps.map(toResepResponse);
}