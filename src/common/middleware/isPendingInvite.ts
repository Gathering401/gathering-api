import {NextFunction, Request, Response} from "express";
import {getGroupUserBy} from "../../group/repository";
import {InviteStatus} from "../enums/inviteStatus";

export const isPendingInvite = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId: number = res.locals.userId;
        const groupId: number = Number(req.query.id);

        const [user] = await getGroupUserBy(groupId, userId);
        if (!user || user.id !== userId) {
            return res.status(401).json({ success: false, message: "You have not been invited to this group" });
        } else if(user.invite_status !== InviteStatus.pending) {
            return res.status(403).json({ success: false, message: "Invite no longer pending" });
        } else if(!user.invited_by_group) {
            return res.status(403).json({ success: false, message: "This user requested to join, they were not invited" });
        }

        next();
    } catch(err: any) {
        console.log('Err', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}