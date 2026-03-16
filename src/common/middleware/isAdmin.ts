import {NextFunction, Request, Response} from "express";
import {Role} from "../enums/role";

export const isAdmin = async (_: Request, res: Response, next: NextFunction) => {
    try {
        const role: number = res.locals.role;

        if (![Role.admin, Role.owner].includes(role)) {
            return res.status(401).json({ success: false, message: "You do not have permission for that action in this group" });
        }

        next();
    } catch(err: any) {
        console.log('Err', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}