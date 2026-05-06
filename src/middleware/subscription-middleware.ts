import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma/client";

const prisma = new PrismaClient();

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

    const subscription = await prisma.subscription.findUnique({
      where: { userId: userId },
    });

    // Cek apakah subscription ada dan belum expired
    const isActive =
      subscription !== null && subscription.endDate > new Date();

    if (!isActive) {
      res.status(403).json({
        success: false,
        message: "Fitur ini hanya untuk subscriber aktif. Silakan berlangganan terlebih dahulu.",
        subscriptionRequired: true,
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal memverifikasi subscription",
    });
  }
};