import {NextFunction, Request, Response} from "express";
import {getGroupUserBy} from "../../group/repository";
import {InviteStatus} from "../enums/inviteStatus";

export const isPendingRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: groupId, userId } = req.query;

        const [user] = await getGroupUserBy(Number(groupId), Number(userId));
        if (!user || user.id !== Number(userId)) {
            return res.status(401).json({ success: false, message: "User has not been invited to this group" });
        } else if(user.invite_status !== InviteStatus.pending) {
            return res.status(403).json({ success: false, message: "Invite no longer pending" });
        } else if(user.invited_by_group) {
            return res.status(403).json({ success: false, message: "This user was invited, they did not request to join" });
        }

        next();
    } catch(err: any) {
        console.log('Err', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}