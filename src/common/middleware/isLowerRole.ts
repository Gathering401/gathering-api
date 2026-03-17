import {NextFunction, Request, Response} from "express";
import {Role} from "../enums/role";
import {getGroupUserBy} from "../../group/repository";

export const isLowerRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = Number(req.query.userId);
        const { groupId, role } = res.locals;

        const [user] = await getGroupUserBy(groupId, userId);
        if (!user || user.id !== userId) {
            return res.status(404).json({ success: false, message: "User is not part of this group" });
        } else if(user.role === Role.owner || (user.role === Role.admin && role !== Role.owner)) {
            return res.status(403).json({ success: false, message: "You do not have permission to modify this user" });
        }

        next();
    } catch(err: any) {
        console.log('Err', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}
