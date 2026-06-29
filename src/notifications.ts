import schedule from 'node-schedule';
import { Repetition } from './common/enums/repetition';
import knex from "knex";

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];

const database = knex(connection);

const sendPushNotification = async (token: string, title: string, body: string) => {
    await fetch('https://exp.host/--/exponent-push-notification-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: token, title, body }),
    });
};

const scheduleNotification = (token: string, title: string, body: string, sendAt: Date) => {
    if (sendAt <= new Date()) return;
    schedule.scheduleJob(sendAt, () => sendPushNotification(token, title, body));
};

export const scheduleEventNotifications = async (eventId: number) => {
    const rows = await database('event_invitation as ei')
        .join('event as e', 'e.id', 'ei.event_id')
        .join('user as u', 'u.id', 'ei.user_id')
        .select(
            'u.expo_push_token',
            'e.name',
            'e.date',
            'e.repetition'
        )
        .where('ei.event_id', eventId)
        .where('ei.notifications', true)
        .whereNotNull('u.expo_push_token');

    for (const row of rows) {
        const eventDate = new Date(row.date);
        const oneDayBefore = new Date(eventDate);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);

        const oneWeekBefore = new Date(eventDate);
        oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);

        const isWeeklyOrMonthly =
            row.repetition === Repetition.weekly || row.repetition === Repetition.monthly;

        scheduleNotification(row.expo_push_token, row.name, 'Your event is tomorrow!', oneDayBefore);

        if (!isWeeklyOrMonthly) {
            scheduleNotification(row.expo_push_token, row.name, 'Your event is coming up next week!', oneWeekBefore);
        }
    }
}
