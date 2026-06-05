import { Response } from "express";
import { UserRequest } from "../models/user-request-model";
import { notificationService } from "../services/notification-service";
import { ok, serverError } from "../utils/response";

export class NotificationController {
    // GET /api/notifications?days=N
    // N opsional — default dari EXPIRY_THRESHOLD_DAYS (.env).
    static async getAll(req: UserRequest, res: Response): Promise<Response> {
        try {
            const daysRaw = req.query.days ? Number(req.query.days) : undefined;
            const days = daysRaw && daysRaw > 0 ? Math.min(daysRaw, 30) : undefined;

            const result = await notificationService.getNotifications(req.user!.id, days);
            return ok(res, result);
        } catch (e) {
            console.error(e);
            return serverError(res);
        }
    }
}
