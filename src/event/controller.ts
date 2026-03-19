import {Request, Response} from 'express';
import {EventPost, mapEventPostToDbEvent} from "./Event";
import {getEventValidator} from "./validation";
import {postEvent} from "./repository";

export const createEvent = async (req: Request, res: Response) => {
    try {
        const event = req.body as EventPost;

        try {
            const validator = getEventValidator();

            await validator.validate(event);
        } catch (error) {
            return res.status(400).json({error: 'Invalid input', details: error});
        }

        await postEvent(event);

        res.status(201).json({
            success: true
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}