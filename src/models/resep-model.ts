import { Resep } from "../../generated/prisma/client";

// ─── REQUEST DTO ──────────────────────────────────────────
export interface ResepGenerateRequest {
  saveToHistory?: boolean;
}

export interface ResepCreateRequest {
  resepName: string;
  resepDescription: string;
  resepCategory: string;
  resepIngredients: string[];
  resepDirections: string[];
}

// ─── RESPONSE TYPE ────────────────────────────────────────
export interface ResepResponse {
  id: number;
  resepName: string;
  resepDescription: string;
  resepCategory: string;
  resepIngredients: string[];
  resepDirections: string[];
}

export type ResepGenerateResponse = {
  success: boolean;
  aiResponse: any;
  saved?: ResepResponse;
}

// ─── MAPPER ───────────────────────────────────────────────
export function toResepResponse(prismaResep: Resep): ResepResponse {
  return {
    id: prismaResep.id,
    resepName: prismaResep.resepName,
    resepDescription: prismaResep.resepDescription,
    resepCategory: prismaResep.resepCategory,
    resepIngredients: prismaResep.resepIngredients,
    resepDirections: prismaResep.resepDirections,
  };
}

export function toResepResponseList(prismaReseps: Resep[]): ResepResponse[] {
  return prismaReseps.map(toResepResponse);
}