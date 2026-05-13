import { Request, Response, NextFunction } from "express";
import { PaymentService } from "../services/payment-service";

export const checkSubscription = async (
    req: Request & { user?: { id: number } },
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: user tidak ditemukan",
            });
            return;
        }

        const status = await PaymentService.getStatus(userId);

        if (!status.isActive) {
            res.status(403).json({
                success: false,
                message:
                    "Fitur ini hanya untuk subscriber aktif. Silakan berlangganan terlebih dahulu.",
                subscriptionRequired: true,
            });
            return;
        }

        next();
    } catch (error) {
        console.error("Subscription check error:", error);
        res.status(500).json({
            success: false,
            message: "Gagal memverifikasi subscription",
        });
    }
};