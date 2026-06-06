import { Request, Response, NextFunction } from "express";
import { UserRequest } from "../models/user-request-model";
import { PaymentService, isPlan } from "../services/payment-service";

export class PaymentController {
    /**
     * POST /api/payment/subscribe
     * Generate Snap token. App pake token ini buat buka UI Midtrans.
     */
    static async subscribe(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const userId = Number(req.user!.id);
            // plan opsional di body: "monthly" (default) atau "yearly"
            const planRaw = String(req.body?.plan ?? "monthly").toLowerCase();
            const plan = isPlan(planRaw) ? planRaw : "monthly";
            const result = await PaymentService.subscribe(userId, plan);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/payment/notification
     * Webhook dari Midtrans. INI YANG UPDATE STATUS SUBSCRIPTION DI DB.
     * Endpoint ini TIDAK butuh auth (Midtrans yang panggil).
     */
    static async notification(req: Request, res: Response, next: NextFunction) {
        try {
            await PaymentService.handleNotification(req.body);

            // Midtrans cuma butuh response 200, body terserah
            res.status(200).json({ success: true });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/payment/status
     * App panggil ini buat tau user sekarang subscriber aktif atau bukan.
     */
    static async getStatus(req: UserRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const result = await PaymentService.getStatus(userId);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}