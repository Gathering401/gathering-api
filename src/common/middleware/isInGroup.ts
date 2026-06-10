import {NextFunction, Request, Response} from "express";
import {getGroupUserBy} from "../../group/repository";
import {InviteStatus} from "../enums/inviteStatus";

export const isInGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId: number = Number(res.locals.userId);
        const groupId: number = Number(req.query.id ?? req.body.id);

        const [user] = await getGroupUserBy(groupId, userId);
        if (!user || Number(user.user_id) !== userId || user.invite_status !== InviteStatus.accepted) {
            return res.status(401).json({ success: false, message: "You do not have access to this group" });
        }

        res.locals.role = Number(user.role);
        res.locals.groupId = groupId;

        next();
    } catch(err: any) {
        console.log('Err', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}