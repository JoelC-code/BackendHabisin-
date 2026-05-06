// utils/gemini-utils.ts
import { GoogleGenerativeAI, SchemaType, ResponseSchema } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite", // free tier: 15 RPM, 1000 req/day
});

export interface ParsedRecipe {
  resepName: string;
  resepDescription: string;
  resepIngredients: string[];
  resepDirections: string[];
}

// ─── 1. DEFINISIKAN SCHEMA JSON ────────────────────────────
// ✅ Tambahkan tipe ": ResponseSchema" di sini agar TypeScript tidak komplain
const recipeSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    resepName: {
      type: SchemaType.STRING,
      description: "Nama resep masakan",
    },
    resepDescription: {
      type: SchemaType.STRING,
      description: "Deskripsi singkat resep maksimal 255 karakter",
    },
    resepIngredients: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Daftar bahan-bahan yang dibutuhkan",
    },
    resepDirections: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Langkah-langkah memasak",
    },
  },
  required: ["resepName", "resepDescription", "resepIngredients", "resepDirections"],
};

// ─── 2. FUNGSI GENERATE CONTENT ─────────────────────────────
export const generateRecipeFromAI = async (
  foodList: string
): Promise<{ aiResponse: string; parsed: ParsedRecipe }> => {
  
  const prompt = `
Kamu adalah chef profesional Indonesia. Berikan 1-5 resep masakan yang lezat berdasarkan bahan berikut.
Gunakan HANYA bahan yang tersedia. Jika kurang, boleh tambahkan bumbu dasar (garam, air, minyak, bawang). Resep harus mudah dibuat di rumah, dengan bahan yang ada tersedia dan sedang tidak expired.
Gunakan format angka 1., 2., dst untuk langkah memasak. Jangan buat langkah yang terlalu panjang, cukup 1-2 kalimat saja per langkah tapi jelas.
Bahan yang tersedia:
${foodList}
  `.trim();

  let aiResponse: string;
  let parsed: ParsedRecipe;

  try {
    const result = await geminiModel.generateContent({
      // ✅ Kembalikan role: "user" karena ini wajib dari SDK-nya
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json", 
        responseSchema: recipeSchema,         
      },
    });

    aiResponse = result.response.text();
    parsed = JSON.parse(aiResponse);

  } catch (error: any) {
    if (error?.status === 429) {
      throw new Error("Server sedang sibuk (rate limit). Coba lagi dalam beberapa menit.");
    }
    throw new Error("Gagal menghubungi AI atau memproses JSON: " + error.message);
  }

  return { aiResponse, parsed };
};