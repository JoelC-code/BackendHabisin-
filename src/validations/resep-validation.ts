import { z } from "zod";

// ─── GENERATE RESEP VALIDATION ────────────────────────────
export const ResepGenerateSchema = z.object({
  saveToHistory: z.boolean().optional().default(false),
});

// ─── MANUAL CREATE RESEP VALIDATION ──────────────────────
export const ResepCreateSchema = z.object({
  resepName: z
    .string()
    .min(3, "Nama resep minimal 3 karakter")
    .max(100, "Nama resep maksimal 100 karakter"),

  resepDescription: z
    .string()
    .min(10, "Deskripsi resep minimal 10 karakter")
    .max(255, "Deskripsi resep maksimal 255 karakter"),

  resepIngredients: z
    .array(z.string().min(1, "Ingredient tidak boleh kosong"))
    .min(1, "Minimal 1 bahan"),

  resepDirections: z
    .array(z.string().min(1, "Langkah tidak boleh kosong"))
    .min(1, "Minimal 1 langkah"),
});

// ─── TYPES ────────────────────────────────────────────────
export type ResepGenerateInput = z.infer<typeof ResepGenerateSchema>;
export type ResepCreateInput = z.infer<typeof ResepCreateSchema>;