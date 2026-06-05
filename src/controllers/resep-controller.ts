// controllers/resep-controller.ts
import { Response } from "express";
import { UserRequest } from "../models/user-request-model";
import { ResepCreateSchema, ResepGenerateSchema } from "../validations/resep-validation";
import {
  generateResep,
  createResep,
  getAllResep,
  getResepById,
  deleteResep,
  QuotaExceededError,
} from "../services/resep-service";

export class ResepController {
  // POST /api/resep/generate — preview resep dari bahan di kulkas (AI)
  static async generate(req: UserRequest, res: Response): Promise<void> {
    try {
      const parsed = ResepGenerateSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const userId = req.user!.id;
      const { saveToHistory, category } = parsed.data;

      const result = await generateResep(userId, saveToHistory, category);
      res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof QuotaExceededError) {
        res.status(429).json({ success: false, message: error.message });
        return;
      }
      const isClientError = error.message?.includes("Tidak ada bahan");
      res.status(isClientError ? 400 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /api/resep — simpan resep (hasil generate yang di-"Save" / resep manual)
  static async create(req: UserRequest, res: Response): Promise<void> {
    try {
      const parsed = ResepCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const userId = req.user!.id;
      const resep = await createResep(userId, parsed.data);
      res.status(201).json({ success: true, data: resep });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/resep/all — daftar resep milik user
  static async getAll(req: UserRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const reseps = await getAllResep(userId);
      res.status(200).json({ success: true, data: reseps });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/resep/:id — detail resep milik user
  static async getById(req: UserRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = Number(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "ID tidak valid" });
        return;
      }

      const resep = await getResepById(userId, id);
      res.status(200).json({ success: true, data: resep });
    } catch (error: any) {
      res.status(error.message.includes("tidak ditemukan") ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // DELETE /api/resep/remove/:id
  static async remove(req: UserRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = Number(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "ID tidak valid" });
        return;
      }

      await deleteResep(userId, id);
      res.status(200).json({ success: true, message: "Resep berhasil dihapus" });
    } catch (error: any) {
      res.status(error.message.includes("tidak ditemukan") ? 404 : 500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
