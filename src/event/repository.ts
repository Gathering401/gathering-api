import knex from 'knex';
import {EventPost, EventPutMulti, EventPutSingle, mapEventPostToDbEvent} from "./types";
import {Role} from "../common/enums/role";
import _ from "lodash";
import {onEventCreatedFromInvitation} from "../business/repository";
import {BusinessInvitationResponse} from "../common/enums/businessInvitationResponse";
import {RsvpStatus} from "../common/enums/rsvpStatus";
import { DateTime } from 'luxon';
import {sendNewEventNotification} from "../notifications";
import {InviteStatus} from "../common/enums/inviteStatus";

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
    const myNotifications = await selectMyNotifications(id, userId);

    let seriesDates: string[] = [];
    if (events[0]?.series_id) {
        const today = new Date().toISOString().split('T')[0]!;
        const series = await database
            .table('event')
            .select('date')
            .where('series_id', events[0].series_id)
            .andWhere('date', '>=', today)
            .orderBy('date', 'asc');
        seriesDates = series.map(e => e.date);
    }

    return { events, host, myRsvp, myNotifications, seriesDates };
}

const selectMyNotifications = async (eventId: number, userId: number) => {
    const [row] = await database('event_invitation')
        .select('notifications')
        .where('event_id', eventId)
        .where('user_id', userId);
    return row?.notifications ?? true;
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

export const selectEvents = async (userId: number, year: number, month: number) => {
    const startOfMonth = DateTime.fromObject({ year, month, day: 1 }).startOf('month').toJSDate();
    const endOfMonth = DateTime.fromObject({ year, month, day: 1 }).endOf('month').toJSDate();

    return database
        .table('event as e')
        .select('e.id', 'e.name', 'e.description', 'e.date', 'e.group_id', 'g.name as group_name', 'ei.rsvp_status', 'e.series_id', 'e.repetition')
        .leftJoin('event_invitation as ei', function () {
            this.on('e.id', '=', 'ei.event_id')
                .andOn('ei.user_id', '=', database.raw('?', [userId]));
        })
        .leftJoin('group as g', 'e.group_id', 'g.id')
        .whereNotNull('ei.id')
        .andWhere('e.date', '>=', startOfMonth)
        .andWhere('e.date', '<=', endOfMonth);
}

export const selectPendingInvitations = async (userId: number) => {
    return database
        .select('*')
        .from(
            database
                .table('event_invitation as ei')
                .select(
                    'e.id as event_id',
                    'g.id as group_id',
                    'ei.rsvp_status',
                    'e.name as event_name',
                    'e.date',
                    'g.name as group_name',
                    'e.repetition',
                    'e.description',
                    'e.series_id'
                )
                .leftJoin('event as e', 'e.id', 'ei.event_id')
                .leftJoin('group as g', 'e.group_id', 'g.id')
                .where('ei.rsvp_status', 1)
                .andWhere('ei.user_id', userId)
                .distinctOn('e.series_id')
                .orderBy('e.series_id')
                .orderBy('e.date', 'asc')
                .as('deduped')
        )
        .orderBy('date', 'asc')
        .limit(20);
}

export const postEvent = async (event: EventPost) => {
    const { rows } = await database.raw("SELECT nextval('event_series_id_seq') as series_id");
    const seriesId = Number(rows[0].series_id);

    const response = await database
        .table('event')
        .insert(mapEventPostToDbEvent(event, seriesId))
        .returning('id');

    const usersToInvite = await database
        .table('group_user')
        .select('user_id')
        .where('group_id', event.groupId)
        .andWhere('invite_status', InviteStatus.accepted);

    await database
        .table('event_invitation')
        .insert(response.map(e => usersToInvite.map(u => ({
            user_id: u.user_id,
            event_id: e.id,
            rsvp_status: u.user_id == event.hostId ? 2 : 1,
        }))).flat());

    await sendNewEventNotification(event.groupId, event.hostId, event.name, response[0].id);

    if (event.businessInvitationId) {
        await onEventCreatedFromInvitation(event.hostId, event.businessInvitationId);
    }

    return response;
}

export const putEvent = async (event: EventPutMulti | EventPutSingle, seriesId?: number) => {
    const query = database.table('event');

    if (seriesId) {
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

export const putRsvp = async (eventId: number, userId: number, rsvp: RsvpStatus) => {
    const current = await database
        .table('event_invitation')
        .select('rsvp_status')
        .where('event_id', eventId)
        .andWhere('user_id', userId)
        .first();

    const shouldEnableNotifications = current?.rsvp_status === RsvpStatus.pending
        && (rsvp === RsvpStatus.accepted || rsvp === RsvpStatus.maybe);

    const update: Record<string, unknown> = { rsvp_status: rsvp };

    if (shouldEnableNotifications) {
        update.notifications = true;
    }

    await database
        .table('event_invitation')
        .update(update)
        .where('event_id', eventId)
        .andWhere('user_id', userId);
}

export const putRsvpForSeries = async (eventId: number, userId: number, rsvp: RsvpStatus) => {
    const seriesId = (await database
        .table('event')
        .select('series_id')
        .where('id', eventId)
        .first())?.series_id;

    const seriesEventIds = () => database
        .table('event')
        .select('id')
        .where('series_id', seriesId)
        .andWhere('date', '>=', new Date());

    const rowsToFlip = await database
        .table('event_invitation')
        .select('event_id')
        .whereIn('event_id', seriesEventIds())
        .andWhere('user_id', userId)
        .andWhere('rsvp_status', RsvpStatus.pending);

    await database
        .table('event_invitation')
        .update('rsvp_status', rsvp)
        .whereIn('event_id', seriesEventIds())
        .andWhere('user_id', userId);

    if ((rsvp === RsvpStatus.accepted || rsvp === RsvpStatus.maybe) && rowsToFlip.length) {
        await database
            .table('event_invitation')
            .update('notifications', true)
            .whereIn('event_id', rowsToFlip.map(r => r.event_id))
            .andWhere('user_id', userId);
    }
}

export const putNotifications = async (eventId: number, userId: number, notifications: boolean) => {
    await database('event_invitation')
        .update({ notifications })
        .where('event_id', eventId)
        .where('user_id', userId);
}

export const setInvitationDeclined = async (userId: number, businessInvitationId: number) => {
    await database('business_invitation_recipient')
        .where({ user_id: userId, business_invitation_id: businessInvitationId })
        .update({ response: BusinessInvitationResponse.Declined });
}

export const getUserActiveInvitations = async (userId: number) => {
    return database('business_invitation_recipient as r')
        .join('business_invitation as bi', 'bi.id', 'r.business_invitation_id')
        .join('business as b', 'b.id', 'bi.business_id')
        .where('r.user_id', userId)
        .where('r.response', BusinessInvitationResponse.Pending)
        .whereIn('r.slot_position', [1, 2, 3, 4, 5])
        .orderBy('r.slot_position', 'asc')
        .select(
            'bi.id',
            'bi.name',
            'bi.description',
            'bi.date_start',
            'bi.date_end',
            'bi.location_address',
            'b.name as business_name',
            'b.average_cost',
            'r.slot_position',
            'r.as_push_notification'
        );
}

export const getInvitationDetailForUser = async (userId: number, invitationId: number) => {
    return database('business_invitation_recipient as r')
        .join('business_invitation as b', 'b.id', 'r.business_invitation_id')
        .join('business as biz', 'biz.id', 'b.business_id')
        .where('r.user_id', userId)
        .where('r.business_invitation_id', invitationId)
        .select(
            'b.id',
            'b.name',
            'b.description',
            'b.date_start',
            'b.date_end',
            'b.location_address',
            'biz.name as business_name',
            'biz.average_cost',
            'r.slot_position',
            'r.as_push_notification',
            'r.response'
        )
        .first();
}
