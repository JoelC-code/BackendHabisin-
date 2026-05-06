import { Request, Response, NextFunction } from "express";
import { UserRequest } from "../models/user-request-model";
import { DashboardService } from "../services/dashboard-service";

export class DashboardController {
    static async getDashboard(req: UserRequest, res: Response, next: NextFunction) {
        try {
            console.log("REQ.USER:", req.user);
            const result = await DashboardService.getDashboard(req.user!)
            res.json({
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}