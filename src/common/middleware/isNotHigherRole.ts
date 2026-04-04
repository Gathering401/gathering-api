import {NextFunction, Request, Response} from "express";
import {Role} from "../enums/role";
import {getGroupUserBy} from "../../group/repository";

export const isNotHigherRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.query.userId);
        const newRole = Number(req.query.role);
        const { groupId, role } = res.locals;

        const [user] = await getGroupUserBy(groupId, userId);
        if (!user || Number(user.user_id) !== userId) {
            return res.status(404).json({ success: false, message: "User is not part of this group" });
        } else if(user.role === Role.owner || (user.role === Role.admin && role !== Role.owner)) {
            return res.status(403).json({ success: false, message: "You do not have permission to modify this user" });
        } else if(newRole === Role.owner || (newRole === Role.admin && role === Role.admin)) {
            return res.status(403).json({ success: false, message: "Cannot make a user the same or higher rank than yourself" });
        }

        next();
    } catch(err: any) {
        console.log('Err', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}
