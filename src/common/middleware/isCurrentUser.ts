import {NextFunction, Request, Response} from "express";
import {getUser} from "../../auth/repository";
import {User} from "../models/User";
import {decodeAccessToken} from "../../auth/controller";

export const isCurrentUser = async (res: Response, req: Request, next: NextFunction) => {
    const verified = decodeAccessToken(req.body.token);

    if(!verified) {
        return res.status(401).json({ success: false, message: "Failed authentication" });
    }

    const isUser = await getUser((verified as User).username);

    if (!isUser) {
        return res.status(401).json({ success: false, message: "You do not have access to this user" });
    }

    next();
}