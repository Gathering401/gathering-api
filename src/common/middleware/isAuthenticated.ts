import { Request, Response, NextFunction } from "express";
import { TokenUser } from "../../auth/User";
import { decodeAccessToken } from "../../auth/controller";

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = (req.get('Authorization') as string).split('Bearer ')[1];
        if(!token) {
            return res.status(401).send({ error: "Unauthenticated" });
        }

        const verified: null | TokenUser = decodeAccessToken(token);
        if(!verified || !verified.payload.userId) {
            return res.status(401).json({ success: false, message: "Failed authentication" });
        }

        res.locals.userId = verified.payload.userId;

        next();
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}