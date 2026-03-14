import {NextFunction, Request, Response} from "express";
import {getUserById} from "../../auth/repository";
import {TokenUser, User} from "../models/User";
import {decodeAccessToken} from "../../auth/controller";

export const isCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = (req.get('Authorization') as string).split('Bearer ')[1];
        if(!token) {
            return res.status(401).send({ error: "Unauthenticated" });
        }

        const verified: null | TokenUser = decodeAccessToken(token);
        if(!verified || !verified.payload.userId) {
            return res.status(401).json({ success: false, message: "Failed authentication" });
        }

        const [user] = await getUserById(verified.payload.userId);
        if (!user || user.id !== verified.payload.userId) {
            return res.status(401).json({ success: false, message: "You do not have access to this user" });
        }

        next();
    } catch(err: any) {
        console.log('Err', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}