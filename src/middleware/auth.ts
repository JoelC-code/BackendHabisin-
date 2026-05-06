import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { unauthorized, forbidden } from "../utils/response";

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    unauthorized(res, "No token provided");
    return;
  }
  try {
    const payload = jwt.verify(
      header.split(" ")[1],
      process.env.JWT_SECRET as string
    ) as { id: string; email: string; role: string };
    req.user = payload;
    next();
  } catch {
    unauthorized(res, "Invalid or expired token");
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== "ADMIN") {
    forbidden(res, "Admin access required");
    return;
  }
  next();
};
