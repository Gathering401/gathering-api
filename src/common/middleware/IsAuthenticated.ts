import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';

export const check = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({error: 'No authorization header provided'});
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer') {
        return res.status(401).json({error: 'Invalid authorization format'});
    }

    try {
        // @ts-ignore
        req.user = jwt.verify(token as string, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};