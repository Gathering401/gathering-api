import {sequelize} from '../common/database';
import {defineUser} from '../common/models/User';
import {Request, Response} from "express";
const User = defineUser(sequelize);

export const getUser = async (req: Request, res: Response) => {
    // @ts-ignore
    const user = await User.findByPk(req.user.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, data: user });
}

export const getAllUsers = async (_: Request, res: Response) => {
    const users = await User.findAll();

    res.json({ success: true, data: users });
}
