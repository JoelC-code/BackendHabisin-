import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { unauthorized } from "../utils/response";
import { UserJWTPayload } from "../models/user-model";
import { UserRequest } from "../models/user-request-model";

export const authenticate = (
    req: UserRequest,
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
        ) as UserJWTPayload;
        req.user = payload;
        next();
    } catch {
        unauthorized(res, "Invalid or expired token");
    }
};