import { prismaClient } from "../utils/prisma";
import { MidtransService } from "./midtrans-service";
import { checkSubscription } from "../middleware/subscription-middleware";

const PRICE = Number(process.env.SUBSCRIPTION_PRICE_IDR) || 15000;
const DURATION_DAYS = Number(process.env.SUBSCRIPTION_DURATION_DAYS) || 30;

export interface SubscribeResult {
    orderId: string;
    snapToken: string;
    redirectUrl: string;
    amount: number;
    currentExpiresAt: Date | null;
}

export interface StatusResult {
    isActive: boolean;
    expiresAt: Date | null;
    daysRemaining: number;
}

export const PaymentService = {
    /**
     * Bikin transaksi Midtrans + simpan subscription "pending" ke DB.
     * Return snapToken untuk dipake Android SDK.
     */
    async subscribe(userId: number): Promise<SubscribeResult> {
        const user = await prismaClient.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error("User not found");
        }

        // Cek apakah user udah aktif (boleh bayar lagi untuk extend)
        const activeSub = await prismaClient.subscription.findFirst({
            where: {
                userId,
                status: "active",
                endDate: { gt: new Date() },
            },
            orderBy: { endDate: "desc" },
        });

        // Generate order ID unik
        const orderId = `SUB-${userId}-${Date.now()}`;

        // Bikin record subscription dengan status "pending"
        await prismaClient.subscription.create({
            data: {
                userId,
                orderId,
                amount: PRICE,
                status: "pending",
            },
        });

        // Request snap token dari Midtrans
        const { token, redirectUrl } = await MidtransService.createSnapTransaction({
            orderId,
            amount: PRICE,
            userEmail: user.email,
            userName: user.username || "Habisin User",
        });

        return {
            orderId,
            snapToken: token,
            redirectUrl,
            amount: PRICE,
            currentExpiresAt: activeSub?.endDate ?? null,
        };
    },

    /**
     * Handle webhook notification dari Midtrans.
     * Verify signature, update status subscription di DB.
     */
    async handleNotification(payload: any): Promise<void> {
        // Verify signature dulu — wajib!
        const isValid = MidtransService.verifySignature({
            order_id: payload.order_id,
            status_code: payload.status_code,
            gross_amount: payload.gross_amount,
            signature_key: payload.signature_key,
        });

        if (!isValid) {
            throw new Error("Invalid signature");
        }

        const orderId = payload.order_id as string;
        const transactionStatus = payload.transaction_status as string;
        const fraudStatus = payload.fraud_status as string;
        const paymentType = payload.payment_type as string;

        const sub = await prismaClient.subscription.findUnique({
            where: { orderId },
        });
        if (!sub) {
            throw new Error("Subscription not found");
        }

        // Mapping status Midtrans → status internal
        // Referensi: https://docs.midtrans.com/reference/transaction-status
        let newStatus = sub.status;
        let startDate = sub.startDate;
        let endDate = sub.endDate;

        if (
            (transactionStatus === "capture" && fraudStatus === "accept") ||
            transactionStatus === "settlement"
        ) {
            // Pembayaran sukses — set status active & hitung tanggal
            newStatus = "active";

            // Kalau user udah punya sub aktif, extend dari endDate-nya
            const existingActive = await prismaClient.subscription.findFirst({
                where: {
                    userId: sub.userId,
                    status: "active",
                    endDate: { gt: new Date() },
                    id: { not: sub.id },
                },
                orderBy: { endDate: "desc" },
            });

            const baseDate = existingActive?.endDate ?? new Date();
            startDate = new Date();
            endDate = new Date(
                baseDate.getTime() + DURATION_DAYS * 24 * 60 * 60 * 1000
            );
        } else if (
            transactionStatus === "cancel" ||
            transactionStatus === "deny" ||
            transactionStatus === "expire"
        ) {
            newStatus = "failed";
        } else if (transactionStatus === "pending") {
            newStatus = "pending";
        }

        await prismaClient.subscription.update({
            where: { id: sub.id },
            data: {
                status: newStatus,
                paymentType,
                startDate,
                endDate,
            },
        });
    },

    /**
     * Cek status subscription user — apakah masih aktif?
     */
    async getStatus(userId: number): Promise<StatusResult> {
        try {
            // PENTING: Pastikan userId diubah menjadi tipe Number agar sinkron dengan database Int
            const parsedUserId = Number(userId);

            const activeSub = await prismaClient.subscription.findFirst({
                where: {
                    userId: parsedUserId,
                    status: "active",
                    endDate: { gt: new Date() },
                },
                orderBy: { endDate: "desc" },
            });

            return {
                isActive: !!activeSub,
                expiresAt: activeSub?.endDate ?? null,
                daysRemaining: activeSub?.endDate
                    ? Math.ceil(
                        (activeSub.endDate.getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    )
                    : 0,
            };
        } catch (error) {
            console.error("Error inside PaymentService.getStatus:", error);
            return {
                isActive: false,
                expiresAt: null,
                daysRemaining: 0
            };
        }
    },
};