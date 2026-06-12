import knex from 'knex';
import {EventPost, EventPutMulti, EventPutSingle, mapEventPostToDbEvent, Rsvp} from "./Event";
import {Role} from "../common/enums/role";
import _ from "lodash";

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];

const database = knex(connection);

export const selectEvent = async (id: number, role: Role, userId: number) => {
    const query = database
        .table('event')
        .select('event.*', 'group.name as group_name')
        .leftJoin('group', 'event.group_id', 'group.id')
        .where('event.id', id);

    const [host] = await selectEventHost(id);

    if([Role.admin, Role.owner].includes(Number(role)) || Number(host.host_id) === Number(userId)) {
        query
            .leftJoin('event_invitation', 'event.id', 'event_invitation.event_id')
            .leftJoin('user', 'event_invitation.user_id', 'user.id')
            .select('event_invitation.rsvp_status', 'user.username', 'user.first_name', 'user.last_name', 'user.id as user_id')
    }

    const events = await query;
    const myRsvp = await selectMyRsvp(id, userId);
    return { events, host, myRsvp };
}

export const selectEventHost = async (eventId: number) => {
    return database
        .table('event')
        .select('event.host_id', 'user.first_name', 'user.last_name', 'user.username', 'user.id as user_id')
        .leftJoin('user', 'event.host_id', 'user.id')
        .where('event.id', eventId);
}

export const selectMyRsvp = async (eventId: number, userId: number) => {
    const [result] = await database
        .table('event_invitation')
        .select('rsvp_status')
        .where('event_id', eventId)
        .andWhere('user_id', userId);
    return result?.rsvp_status ?? null;
}

export const selectEvents = async (userId: number) => {
    return database
        .table('event')
        .select('event.id', 'event.name', 'event.description', 'event.date', 'event.group_id', 'group.name as group_name')
        .leftJoin('event_invitation', 'event.id', 'event_invitation.event_id')
        .leftJoin('group', 'event.group_id', 'group.id')
        .where('event_invitation.user_id', userId)
        .andWhere('event_invitation.rsvp_status', '<>', 3)
        .andWhere('event.date', '>=', new Date());
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

    return response;
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

export const putRsvp = async (eventId: number, userId: number, rsvp: Rsvp) => {
    await database
        .table('event_invitation')
        .update('rsvp_status', rsvp)
        .where('event_id', eventId)
        .andWhere('user_id', userId);
}
