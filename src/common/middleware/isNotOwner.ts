import {NextFunction, Request, Response} from "express";
import {Role} from "../enums/role";

export const isNotOwner = async (_: Request, res: Response, next: NextFunction) => {
    try {
        const role: number = Number(res.locals.role);

        if (Role.owner === role) {
            return res.status(401).json({ success: false, message: "As group owner, you cannot perform this action" });
        }

        next();
    } catch(err: any) {
        console.log('Err', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}