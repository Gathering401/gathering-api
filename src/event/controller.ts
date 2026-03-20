import {Request, Response} from 'express';
import {EventPost, mapDbEventToEvent} from "./Event";
import {getEventValidator} from "./validation";
import {postEvent, selectEvent} from "./repository";

export const getEvent = async (req: Request, res: Response) => {
    try {
        const { role, userId } = res.locals;
        const eventId = Number(req.query.eventId);

        if(isNaN(eventId)) {
            res.status(400).json({ success: false, message: `Invalid event ID: ${req.query.eventId}` });
        }

        const response = await selectEvent(eventId, role, userId);

        res.status(200).json({
            success: true,
            response: mapDbEventToEvent(response)
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

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