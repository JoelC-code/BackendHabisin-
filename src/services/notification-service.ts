import { prismaClient } from "../utils/prisma";
import { EXPIRY_THRESHOLD_DAYS } from "../utils/env-util";
import { toFoodResponse, FoodResponse } from "../models/food-model";

export interface NotificationItem extends FoodResponse {
    // < 0 = sudah lewat (expired) sekian hari, 0 = expired hari ini, > 0 = sisa hari.
    daysLeft: number;
}

export interface NotificationResult {
    threshold: number;
    expiredCount: number;
    expiringCount: number;
    expired: NotificationItem[];
    expiringSoon: NotificationItem[];
}

const startOfDay = (d: Date): Date => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
};

const daysBetween = (from: Date, to: Date): number =>
    Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000);

export const notificationService = {
    // Feed reminder: item yang sudah expired + yang akan expired dalam `days`
    // hari ke depan. FE yang menjadwalkan local notification dari feed ini.
    async getNotifications(userId: number, days?: number): Promise<NotificationResult> {
        const threshold = days && days > 0 ? days : EXPIRY_THRESHOLD_DAYS;

        const today = startOfDay(new Date());
        // Batas atas: sampai akhir hari ke-(threshold).
        const upperBound = startOfDay(new Date());
        upperBound.setDate(upperBound.getDate() + threshold + 1);

        const foods = await prismaClient.food.findMany({
            where: { user_id: userId, bestBefore: { lt: upperBound } },
            orderBy: { bestBefore: "asc" },
        });

        const expired: NotificationItem[] = [];
        const expiringSoon: NotificationItem[] = [];

        for (const f of foods) {
            const daysLeft = daysBetween(today, f.bestBefore);
            const item: NotificationItem = { ...toFoodResponse(f), daysLeft };
            if (daysLeft < 0) expired.push(item);
            else expiringSoon.push(item);
        }

        return {
            threshold,
            expiredCount: expired.length,
            expiringCount: expiringSoon.length,
            expired,
            expiringSoon,
        };
    },
};
