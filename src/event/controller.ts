import {Request, Response} from 'express';
import {EventPost, mapDbEventsToPartialEvents, mapDbEventToEvent, mapDbInvitationsToInvitations, Rsvp} from "./types";
import {getEventValidator, getUpdateEventValidator, getUpdateSeriesValidator} from "./validation";
import {
    deleteSeriesEvent,
    deleteSingleEvent, getInvitationDetailForUser,
    postEvent,
    putEvent, putNotifications,
    putRsvp,
    putRsvpForSeries,
    selectEvent,
    selectEvents, selectPendingInvitations
} from "./repository";
import {getUserActiveInvitations, setInvitationDeclined} from "./repository";
import {mapDbActiveInvitationToActiveInvitation} from "../business/types";
import {RsvpStatus} from "../common/enums/rsvpStatus";

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

export const getEvents = async (req: Request, res: Response) => {
    try {
        const { userId } = res.locals;
        const { year, month } = req.query;

        const events = await selectEvents(userId, Number(year), Number(month));

        res.status(200).json({
            success: true,
            response: mapDbEventsToPartialEvents(events)
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

export const getPendingInvitations = async (_: Request, res: Response) => {
    try {
        const { userId } = res.locals;
        const invitations = await selectPendingInvitations(userId);

        res.status(200).json({
            success: true,
            response: mapDbInvitationsToInvitations(invitations)
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
        const rsvp = Number(req.query.rsvp);
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

export const declineInvitation = async (req: Request, res: Response) => {
    try {
        const { businessInvitationId } = req.body;

        await setInvitationDeclined(res.locals.userId, businessInvitationId);

        res.status(200).json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

export const getActiveInvitations = async (_: Request, res: Response) => {
    try {
        const invitations = await getUserActiveInvitations(res.locals.userId);
        const mapped = invitations.map(mapDbActiveInvitationToActiveInvitation);

        res.status(200).json({ success: true, response: mapped });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

export const getInvitationDetails = async (req: Request, res: Response) => {
    try {
        const invitationId = Number(req.params.id);
        const invitation = await getInvitationDetailForUser(res.locals.userId, invitationId);

        if (!invitation) {
            res.status(404).json({ success: false, error: 'Invitation not found' });
            return;
        }

        res.status(200).json({ success: true, response: mapDbActiveInvitationToActiveInvitation(invitation) });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}
