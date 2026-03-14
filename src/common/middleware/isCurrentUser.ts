import {NextFunction, Request, Response} from "express";
import {getUser} from "../../auth/repository";
import {User} from "../models/User";
import {decodeAccessToken} from "../../auth/controller";

export const isCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    const token = (req.get('Authorization') as string).split('Bearer ')[1];
    if(!token) {
        return res.status(401).send({ error: "Unauthenticated" });
    }

    const verified = decodeAccessToken(token);

    if(!verified) {
        return res.status(401).json({ success: false, message: "Failed authentication" });
    }

    const isUser = await getUser((verified as User).username);

    if (!isUser) {
        return res.status(401).json({ success: false, message: "You do not have access to this user" });
    }

    next();
}