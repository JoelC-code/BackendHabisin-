import { prismaClient } from "../utils/prisma";
import { MidtransService } from "./midtrans-service";
import { PAYMENTS_ENABLED } from "../utils/env-util";
import { ResponseError } from "../errors/response-error";

export type PlanId = "monthly" | "yearly";

// Dua plan langganan. Harga & durasi env-configurable.
// Monthly Rp15.000/30 hari, Yearly Rp180.000/365 hari (tanpa diskon).
const PLANS: Record<PlanId, { amount: number; days: number; label: string }> = {
    monthly: {
        amount: Number(process.env.SUBSCRIPTION_PRICE_IDR) || 15000,
        days: Number(process.env.SUBSCRIPTION_DURATION_DAYS) || 30,
        label: "1 Bulan",
    },
    yearly: {
        amount: Number(process.env.YEARLY_PRICE_IDR) || 180000,
        days: Number(process.env.YEARLY_DURATION_DAYS) || 365,
        label: "1 Tahun",
    },
};

export const isPlan = (p: string): p is PlanId => p === "monthly" || p === "yearly";

export interface SubscribeResult {
    orderId: string;
    snapToken: string;
    redirectUrl: string;
    amount: number;
    plan: PlanId;
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
    async subscribe(userId: number, plan: PlanId = "monthly"): Promise<SubscribeResult> {
        if (!PAYMENTS_ENABLED) {
            throw new ResponseError(
                403,
                "Pembayaran sedang dinonaktifkan (mode demo). Semua fitur sudah terbuka tanpa berlangganan."
            );
        }

        const cfg = PLANS[plan];

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

        // Generate order ID unik (plan ikut biar gampang dibaca)
        const orderId = `SUB-${plan.toUpperCase()}-${userId}-${Date.now()}`;

        // Bikin record subscription dengan status "pending"
        await prismaClient.subscription.create({
            data: {
                userId,
                orderId,
                amount: cfg.amount,
                plan,
                status: "pending",
            },
        });

        // Request snap token dari Midtrans
        const { token, redirectUrl } = await MidtransService.createSnapTransaction({
            orderId,
            amount: cfg.amount,
            userEmail: user.email,
            userName: user.username || "Habisin User",
            itemName: `Habisin Subscription (${cfg.label})`,
        });

        return {
            orderId,
            snapToken: token,
            redirectUrl,
            amount: cfg.amount,
            plan,
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
            const durationDays = isPlan(sub.plan)
                ? PLANS[sub.plan].days
                : PLANS.monthly.days;
            startDate = new Date();
            endDate = new Date(
                baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000
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

    /**
     * Tentukan tier user untuk keperluan kuota/perks.
     * Kalau PAYMENTS_ENABLED=false (mode demo), semua user dianggap "pro"
     * supaya bisa dipakai penuh tanpa Midtrans.
     */
    async getUserTier(userId: number): Promise<"free" | "pro"> {
        if (!PAYMENTS_ENABLED) return "pro";
        const status = await this.getStatus(userId);
        return status.isActive ? "pro" : "free";
    },
};