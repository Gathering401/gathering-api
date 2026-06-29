import {Request, Response} from 'express';
import {EventPost, mapDbEventsToPartialEvents, mapDbEventToEvent, Rsvp} from "./Event";
import {getEventValidator, getUpdateEventValidator, getUpdateSeriesValidator} from "./validation";
import {
    deleteSeriesEvent,
    deleteSingleEvent,
    postEvent,
    putEvent, putNotifications,
    putRsvp,
    putRsvpForSeries,
    selectEvent,
    selectEvents
} from "./repository";

export const getEvent = async (req: Request, res: Response) => {
    try {
        const { role, userId } = res.locals;
        const eventId = Number(req.query.eventId);

        if(isNaN(eventId)) {
            res.status(400).json({ success: false, message: `Invalid event ID: ${req.query.eventId}` });
        }

        const { events, host, myRsvp, myNotifications, seriesDates } = await selectEvent(eventId, Number(role), userId);

        res.status(200).json({
            success: true,
            response: mapDbEventToEvent(events, role, host, myRsvp, myNotifications, seriesDates)
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

export const getEvents = async (_: Request, res: Response) => {
    try {
        const { userId } = res.locals;

        const response = await selectEvents(userId);

        res.status(200).json({
            success: true,
            response: mapDbEventsToPartialEvents(response)
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

        const response = await postEvent(event);

        res.status(201).json({
            success: true,
            response
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const updateEvent = async (req: Request, res: Response) => {
    try {
        const seriesId = Number(req.query.seriesId);
        const event = req.body;

        try {
            const validator = seriesId ? getUpdateSeriesValidator() : getUpdateEventValidator();
            await validator.validate(event);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid input', details: error });
        }

        await putEvent(event, isNaN(seriesId) ? undefined : seriesId);

        res.status(201).json({
            success: true
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const cancelEvent = async (req: Request, res: Response) => {
    try {
        const seriesId = Number(req.query.seriesId);
        const eventId = Number(req.query.eventId);

        if(isNaN(seriesId)) {
            await deleteSingleEvent(eventId);
        } else {
            await deleteSeriesEvent(seriesId);
        }

        res.status(204).json({
            success: true
        });
    } catch (err: any) {
        res.status(500).json({success: false, error: err.message});
    }
}

export const changeRsvp = async (req: Request, res: Response) => {
    try {
        const eventId = Number(req.query.eventId);
        const rsvp = Number(req.query.rsvp) as any as Rsvp;
        const userId = Number(res.locals.userId);
        const applyToSeries = req.query.applyToSeries === 'true';

        if (applyToSeries) {
            await putRsvpForSeries(eventId, userId, rsvp);
        } else {
            await putRsvp(eventId, userId, rsvp);
        }

        res.status(200).json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

export const updateNotifications = async (req: Request, res: Response) => {
    try {
        const { eventId, notifications } = req.body;
        const userId = res.locals.userId;

        await putNotifications(eventId, userId, notifications);

        res.status(200).json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}
