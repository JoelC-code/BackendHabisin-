import { NextFunction, Response } from "express"
import { UserRequest } from "../models/user-request-model"
import { ResponseError } from "../errors/response-error"
import { verifyToken } from "../utils/jwt-util"

export const authenticate = (
    req: UserRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers["authorization"]
        const token = authHeader && authHeader.split(" ")[1]

        if (!token) {
            return next(new ResponseError(401, "Unauthorized user!"))
        }

        const payload = verifyToken(token)

        if (!payload) {
            return next(new ResponseError(401, "Unauthorized user!"))
        }

        req.user = payload
        return next()
    } catch (error) {
        return next(new ResponseError(401, "Invalid or expired token!"))
    }
}
