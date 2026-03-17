import {NextFunction, Request, Response} from "express";
import {getGroupUserBy} from "../../group/repository";
import {InviteStatus} from "../enums/inviteStatus";

export const isNotPendingInvite = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { userId } = req.query;
        const groupId = res.locals.groupId;
        if(!userId) {
            userId = res.locals.userId;
        }

        const [user] = await getGroupUserBy(Number(groupId), Number(userId));
        if (user) {
            if(user.invite_status === InviteStatus.accepted) {
                return res.status(400).json({success: false, message: "User already in group"});
            } else if(user.invite_status === InviteStatus.pending) {
                return res.status(400).json({success: false, message: "User invite already in progress"});
            }
        }

        next();
    } catch(err: any) {
        console.log('Err', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}