import {NextFunction, Request, Response} from "express";
import {getGroupUserBy} from "../../group/repository";
import {InviteStatus} from "../enums/inviteStatus";

export const isInGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId: number = res.locals.userId;
        const groupId: number = Number(req.query.id);

        const [user] = await getGroupUserBy(groupId, userId);
        if (!user || user.id !== userId || user.invite_status !== InviteStatus.accepted) {
            return res.status(401).json({ success: false, message: "You do not have access to this group" });
        }

        res.locals.role = user.role;

        next();
    } catch(err: any) {
        console.log('Err', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}