import { prismaClient } from "../utils/prisma";

const Expiry_Threshhold = 2

export class DashboardService {
    static async getDashboard(userId: number) {
        const now = new Date()

        const thresholdDate = new Date()
        thresholdDate.setDate(now.getDate() + Expiry_Threshhold)

        const expiringFoods = await prismaClient.food.findMany({
            where: {
                user_id: userId,
                bestBefore: {
                    gte: now,
                    lte: thresholdDate
                }
            },
            orderBy: {
                bestBefore: "asc"
            }
        });

        const totalItems = await prismaClient.food.count({
            where: {
                user_id: userId
            }
        });

        const expiringTotal = expiringFoods.length;

        return {
            expiringFoods,
            totalItems,
            expiringTotal
        }
    }
}