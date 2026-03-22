import knex from 'knex';
import {EventPost, EventPutMulti, EventPutSingle, mapEventPostToDbEvent} from "./Event";
import {Role} from "../common/enums/role";
import _ from "lodash";

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];

const database = knex(connection);

export const selectEvent = async (id: number, role: Role, userId: number) => {
    const query = database
        .table('event')
        .select('event.*')
        .where('event.id', id);

    const [event] = await selectEventHost(id);

    if([Role.admin, Role.owner].includes(role) || Number(event.host_id) === Number(userId)) {
        query
            .leftJoin('event_invitation', 'event.id', 'event_invitation.event_id')
            .leftJoin('user', 'event_invitation.user_id', 'user.id')
            .select('event_invitation.rsvp_status', 'user.username', 'user.first_name', 'user.last_name', 'user.id as user_id')
    }

    return query;
}

export const selectEventHost = async (eventId: number) => {
    return database
        .table('event')
        .select('host_id')
        .where('id', eventId);
}

export const selectEvents = async (userId: number) => {
    return database
        .table('event')
        .select('event.id', 'event.name', 'event.description', 'event.date', 'event.group_id')
        .leftJoin('event_invitation', 'event.id', 'event_invitation.event_id')
        .where('event_invitation.user_id', userId);
}

export const postEvent = async (event: EventPost) => {
    const { rows } = await database.raw('SELECT max(series_id) FROM event LIMIT 1');

    const seriesId = rows.length ? Number(rows[0].max) + 1 : 1;

    const response = await database
        .table('event')
        .insert(mapEventPostToDbEvent(event, seriesId))
        .returning('id');

    const usersToInvite = await database
        .table('group_user')
        .select('user_id')
        .where('group_id', event.groupId);

    await database
        .table('event_invitation')
        .insert(response.map(e => usersToInvite.map(u => ({
            user_id: u.user_id,
            event_id: e.id,
            rsvp_status: u.user_id == event.hostId ? 2 : 1,
        }))).flat());
}

export const putEvent = async (event: EventPutMulti | EventPutSingle, seriesId?: number) => {
    const query = database
        .table('event');

    if(seriesId) {
        query
            .update(_.omit(event, 'id'))
            .where('series_id', seriesId);
    } else {
        query
            .update(event)
            .where('id', event.id);
    }

    await query;
}

export const deleteSingleEvent = async (eventId: number) => {
    await database
        .table('event')
        .delete()
        .where('id', eventId);

    await deleteEventInvitations([eventId]);
}

export const deleteSeriesEvent = async (seriesId: number) => {
    const eventIds = (await database
        .table('event')
        .select('id')
        .where('series_id', seriesId))
        .map(e => e.id);

    await database
        .table('event')
        .delete()
        .where('series_id', seriesId);

    await deleteEventInvitations(eventIds);
}

const deleteEventInvitations = async (eventIds: number[]) => {
    await database
        .table('event_invitation')
        .delete()
        .whereIn('event_id', eventIds);
}
