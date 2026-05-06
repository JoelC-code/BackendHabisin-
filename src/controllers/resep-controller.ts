// controllers/resep-controller.ts
import { Request, Response } from "express";
import { ResepGenerateSchema } from "../validations/resep-validation";
import { generateResep, getAllResep, getResepById, deleteResep } from "../services/resep-service";

export class ResepController {
 static async generate(req: Request, res: Response): Promise<void> {
    try {
      const parsed = ResepGenerateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      // ✅ AMBIL DARI req.user (hasil dari middleware authenticate)
      // Gunakan (req as any).user.id atau sesuaikan dengan tipe Express Request kamu
      const userId = Number((req as any).user.id); 
      
      const { saveToHistory } = parsed.data;

      const result = await generateResep(userId, saveToHistory);
      res.status(200).json(result);
    } catch (error: any) {
      const isClientError =
        error.message.includes("Tidak ada bahan") ||
        error.message.includes("rate limit");

      res.status(isClientError ? 400 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/resep/all
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number((req as any).user.id); // ✅ Ambil userId dari token
      const reseps = await getAllResep(userId);    // ✅ Kirim ke service
      res.status(200).json({ success: true, data: reseps });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/resep/:id
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number((req as any).user.id); // ✅ Ambil userId
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "ID tidak valid" });
        return;
      }

      const resep = await getResepById(userId, id); // ✅ Kirim userId & id
      res.status(200).json({ success: true, data: resep });
    } catch (error: any) {
      res.status(error.message.includes("tidak ditemukan") ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // DELETE /api/resep/remove/:id
  static async remove(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number((req as any).user.id); // ✅ Ambil userId
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "ID tidak valid" });
        return;
      }

      await deleteResep(userId, id); // ✅ Kirim userId & id
      res.status(200).json({ success: true, message: "Resep berhasil dihapus" });
    } catch (error: any) {
      res.status(error.message.includes("tidak ditemukan") ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }
}