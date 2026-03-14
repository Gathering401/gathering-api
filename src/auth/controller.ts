import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {User} from '../common/models/User';
import {Request, Response} from 'express';
import {getUser, postUser, putUser} from "./repository";
import {getUserValidator} from "./validation";

const encryptPassword = (password: string) =>
    crypto.createHash('sha256').update(password).digest('hex');

const generateAccessToken = (username: string, userId: number) =>
    jwt.sign({ username, userId }, process.env.HASH_SECRET as string, { expiresIn: '24h' });

export const decodeAccessToken = (accessToken: string) => {
    return jwt.verify(accessToken, process.env.HASH_SECRET as string);
}

export const register = async (req: Request, res: Response) => {
    try {
        const user = req.body as any as User;

        try {
            const validator = getUserValidator();

            await validator.validate(user);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid input', details: error });
        }

        user.password = encryptPassword(user.password);

        const response = await postUser(user);

        const accessToken = generateAccessToken(user.username, response.id!);

        res.status(201).json({
            success: true,
            user,
            token: accessToken
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const encrypted = encryptPassword(password);
    const [user] = await getUser(username);

    if (!user || user.password !== encrypted) {
        return res.status(401).json({error: 'Invalid credentials'});
    }

    const token = generateAccessToken(username, user.id!);
    res.json({ success: true, user, token });
}

export const update = async (req: Request, res: Response) => {
    const user = req.body as User;

    const validator = getUserValidator();

    const validationResponse = await validator.validate(user);

    if (Object.values(validationResponse).length) {
        return res.status(400).json({ error: 'Invalid input', details: validationResponse });
    }

    user.password = encryptPassword(user.password);

    const response = await putUser(user);
}
