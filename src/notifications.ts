import schedule from 'node-schedule';
import { Repetition } from './common/enums/repetition';
import knex from "knex";
import {RsvpStatus} from "./common/enums/rsvpStatus";
import {DateTime} from "luxon";
import {InviteStatus} from "./common/enums/inviteStatus";

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];

const database = knex(connection);

export const sendPushNotification = async (token: string, title: string, body: string, data?: Record<string, unknown>) => {
    const result = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: token, title, body, ...(data ? {data} : {}) }),
    });
    return await result.json();
}

export const sendNewEventNotification = async (groupId: number, creatorId: number, eventName: string, eventId: number) => {
    const rows = await database('group_user as gu')
        .join('user as u', 'u.id', 'gu.user_id')
        .select('u.expo_push_token')
        .where('gu.group_id', groupId)
        .andWhere('gu.allow_notifications', true)
        .andWhere('gu.user_id', '<>', creatorId)
        .andWhere('gu.invite_status', InviteStatus.accepted)
        .whereNotNull('u.expo_push_token');

    for (const row of rows) {
        await sendPushNotification(row.expo_push_token, 'New Event', `A new event, ${eventName}, was just created`, { eventId, groupId });
    }
}

export const sendNightlyDigest = async () => {
    const startOfTomorrow = DateTime.now().setZone('America/Chicago').plus({ days: 1 }).startOf('day').toJSDate();
    const endOfTomorrow = DateTime.now().setZone('America/Chicago').plus({ days: 1 }).endOf('day').toJSDate();

    const rows = await database('event_invitation as ei')
        .join('event as e', 'e.id', 'ei.event_id')
        .join('user as u', 'u.id', 'ei.user_id')
        .select('u.id as user_id', 'u.first_name', 'u.expo_push_token', 'e.name', 'e.date')
        .where('ei.notifications', true)
        .whereIn('ei.rsvp_status', [RsvpStatus.accepted, RsvpStatus.maybe])
        .andWhere('e.date', '>=', startOfTomorrow)
        .andWhere('e.date', '<=', endOfTomorrow)
        .whereNotNull('u.expo_push_token')
        .orderBy('e.date', 'asc');

    const eventsByUser = rows.reduce<Record<number, typeof rows>>((acc, row) => {
        if (!acc[row.user_id]) {
            acc[row.user_id] = [];
        }
        acc[row.user_id]!.push(row);
        return acc;
    }, {});

    for (const userId of Object.keys(eventsByUser)) {
        const userRows = eventsByUser[Number(userId)]!;
        const names = userRows.map(r => r.name);
        const named = names.slice(0, 2);
        const remaining = names.length - named.length;

        let eventList = named.join(', ');

        if (remaining === 1) {
            eventList += ', and 1 other';
        } else if (remaining > 1) {
            eventList += `, and ${remaining} others`;
        }

        const body = `Hi ${userRows[0].first_name}, ${eventList} tomorrow, tap here to view your schedule`;

        await sendPushNotification(userRows[0].expo_push_token, 'Tomorrow\'s Events', body);
    }
}
