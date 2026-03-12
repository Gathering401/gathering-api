import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {sequelize} from '../common/database';
import {defineUser, UserType} from '../common/models/User';
import {Request, Response} from 'express';
import Ajv from 'ajv';

const ajv = new Ajv();
const User = defineUser(sequelize);

const encryptPassword = (password: string) =>
    crypto.createHash('sha256').update(password).digest('hex');

const generateAccessToken = (username: string, userId: number) =>
    jwt.sign({ username, userId }, process.env.HASH_SECRET as string, { expiresIn: '24h' });

export const register = async (req: Request, res: Response) => {
    try {
        const schema = {
            type: 'object',
            required: ['username', 'email', 'password', 'firstName', 'lastName', 'age'],
            properties: {
                username: { type: 'string', minLength: 3 },
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 6 },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                age: { type: 'number' },
            }
        };
        const validate = ajv.compile(schema);

        const { username, email, password, firstName, lastName, age } = req.body as any as UserType;
        const encryptedPassword = encryptPassword(password);

        const user = await User.create({
            username,
            email,
            password: encryptedPassword,
            firstName,
            lastName,
            age
        }) as any as UserType;

        const accessToken = generateAccessToken(username, user.id);

        if (!validate(req.body)) {
            return res.status(400).json({ error: 'Invalid input', details: validate.errors });
        }

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
    const user = await User.findOne({ where: { username } });

    // @ts-ignore
    if (!user || user.password !== encrypted)
        return res.status(401).json({ error: 'Invalid credentials' });

    // @ts-ignore
    const token = generateAccessToken(username, user.id);
    res.json({ success: true, user, token });
}
