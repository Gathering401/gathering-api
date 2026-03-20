import knex from 'knex';
import {EventPost, mapEventPostToDbEvent} from "./Event";
import {Role} from "../common/enums/role";

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];

const database = knex(connection);

export const selectEvent = async (id: number, role: Role, userId: number) => {
    const query = database
        .table('event')
        .select('event.*')
        .where('event.id', id);

    const [event] = await database
        .table('event')
        .select('host_id')
        .where('id', id);

    if([Role.admin, Role.owner].includes(role) || Number(event.host_id) === Number(userId)) {
        query
            .leftJoin('event_invitation', 'event.id', 'event_invitation.event_id')
            .leftJoin('user', 'event_invitation.user_id', 'user.id')
            .select('event_invitation.rsvp_status', 'user.username', 'user.first_name', 'user.last_name', 'user.id as user_id')
    }

    return query;
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