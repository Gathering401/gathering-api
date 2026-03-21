import {NextFunction, Request, Response} from "express";
import {Role} from "../enums/role";
import {selectEventHost} from "../../event/repository";

export const isAdminOrHost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const role = res.locals.role;
        const eventId = req.body.id;

        const [response] = await selectEventHost(Number(eventId));

        if (![Role.admin, Role.owner].includes(role) && Number(response.host_id) !== Number(res.locals.userId)) {
            return res.status(401).json({ success: false, message: "You do not have permission to modify this event" });
        }

        next();
    } catch(err: any) {
        console.log('Err', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}