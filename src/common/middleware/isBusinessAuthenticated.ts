import {Request, Response, NextFunction} from 'express';
import {verifyBusinessAccessToken} from "../../business/controller";

export const isBusinessAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({success: false, message: 'No token provided'});
    }

    const token = authHeader.split(' ')[1]!;

    const decoded = verifyBusinessAccessToken(token);

    if (!decoded) {
        return res.status(401).json({success: false, message: 'Invalid or expired token'});
    }

    res.locals.businessId = decoded.businessId;

    next();
}
