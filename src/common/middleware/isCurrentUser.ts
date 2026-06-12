import {NextFunction, Request, Response} from "express";
import {getUserById} from "../../auth/repository";

export const isCurrentUser = async (_: Request, res: Response, next: NextFunction) => {
    try {
        const userId = res.locals.userId;

        const [user] = await getUserById(userId);
        if (!user || Number(user.id) !== userId) {
            return res.status(401).json({ success: false, message: "You do not have access to this user" });
        }

        next();
    } catch(err: any) {
        console.log('Err', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}