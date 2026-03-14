import { Request, Response } from 'express';
import { getGroupValidator } from "./validation";
import {Group, mapDbGroupToGroup, mapGroupToDbGroup} from "./Group";
import {postGroup} from "./repository";

export const createGroup = async (req: Request, res: Response) => {
    try {
        const group = req.body as Group;

        try {
            const validator = getGroupValidator();

            await validator.validate(group);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid input', details: error });
        }

        const [response] = await postGroup(mapGroupToDbGroup(group, res.locals.userId));

        res.status(201).json({
            success: true,
            response: mapDbGroupToGroup(response)
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}