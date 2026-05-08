import { UserJWTPayload } from "../models/user-model";
import { prismaClient } from "../utils/prisma";

const Expiry_Threshhold = 2

export class DashboardService {
    static async getDashboard(user: UserJWTPayload) {
        const now = new Date()

        const thresholdDate = new Date()
        thresholdDate.setDate(now.getDate() + Expiry_Threshhold)

        const expiringFoods = await prismaClient.food.findMany({
            where: {
                user_id: user.id,
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
                user_id: user.id
            }
        });

        const expiringTotal = expiringFoods.length;

        if (totalItems === 0) {
            return {
                expiringFoods: [],
                totalItems: 0,
                expiringTotal: 0
            }
        } 

        return {
            expiringFoods,
            totalItems,
            expiringTotal
        }
    }
}