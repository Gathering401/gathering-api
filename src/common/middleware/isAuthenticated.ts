import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../auth/controller";

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = (req.get('Authorization') as string)?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: "Unauthenticated" });
        }

        const verified = verifyAccessToken(token);
        if (!verified || !verified.userId) {
            return res.status(401).json({ success: false, message: "Failed authentication" });
        }

        res.locals.userId = Number(verified.userId);
        next();
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}