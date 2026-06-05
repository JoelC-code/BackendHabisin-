// utils/gemini-utils.ts
import { GoogleGenerativeAI, SchemaType, ResponseSchema } from "@google/generative-ai";
import { GEMINI_MODEL } from "./env-util";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const geminiModel = genAI.getGenerativeModel({
	model: GEMINI_MODEL, // default gemini-2.5-flash-lite (free tier: 15 RPM, 1000 req/day)
});

export type ResepCategory =
	| "Makanan Utama"
	| "Sayur & Nabati"
	| "Camilan & Jajanan Pasar"
	| "Minuman"
	| "Sambal & Bumbu Dasar"
	| "Lainnya";


export interface ParsedRecipe {
	resepName: string;
	resepDescription: string;
	resepCategory: ResepCategory;
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
		resepCategory: {
			type: SchemaType.STRING,
			format: "enum",
			description: "Kategori resep. Pilih SATU dari: Makanan Utama, Sayur & Nabati, Camilan & Jajanan Pasar, Minuman, Sambal & Bumbu Dasar, Lainnya",
			enum: ["Makanan Utama", "Sayur & Nabati", "Camilan & Jajanan Pasar", "Minuman", "Sambal & Bumbu Dasar", "Lainnya"],
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
	required: ["resepName", "resepDescription", "resepCategory", "resepIngredients", "resepDirections"],
};

// ─── 2. FUNGSI GENERATE CONTENT ─────────────────────────────
export const generateRecipeFromAI = async (
	foodList: string,
	categoryPreference?: string
): Promise<{ aiResponse: string; parsed: ParsedRecipe }> => {

const categoryLine = categoryPreference
	? `Utamakan resep dengan kategori/jenis: ${categoryPreference}. Kalau bahan tidak memungkinkan, pilih yang paling masuk akal.`
	: "";

const prompt = `
Kamu adalah chef rumahan Indonesia. Buat SATU resep masakan Indonesia yang AUTENTIK dan masuk akal berdasarkan bahan yang dimiliki user.

ATURAN PENTING:
- Prioritaskan bahan yang TERSEDIA. Boleh menambah bumbu dapur dasar yang lazim (garam, gula, air, minyak, bawang merah/putih, kecap, cabai) seminimal mungkin.
- JANGAN memaksakan resep yang aneh atau kombinasi bahan yang tidak wajar. Kalau bahannya sedikit/tidak nyambung, pilih masakan sederhana yang realistis (mis. tumis, telur dadar, sup sederhana).
- Untuk bahan di daftar bahan resep yang TIDAK ada di stok user (harus dibeli dulu), beri akhiran " (perlu beli)".
- Langkah memasak: 1-2 kalimat per langkah, jelas dan praktis untuk dimasak di rumah.
- Deskripsi singkat maksimal 255 karakter.
${categoryLine}
Tentukan kategori resep dari pilihan: Makanan Utama, Sayur & Nabati, Camilan & Jajanan Pasar, Minuman, Sambal & Bumbu Dasar, Lainnya.

Bahan yang dimiliki user saat ini:
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