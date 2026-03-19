import knex from 'knex';
import {EventPost, mapEventPostToDbEvent} from "./Event";

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];

const database = knex(connection);

export const postEvent = async (event: EventPost) => {
    const { rows } = await database.raw('SELECT max(series_id) FROM event LIMIT 1');

    const seriesId = rows.length ? Number(rows[0].max) + 1 : 1;

    await database
        .table('event')
        .insert(mapEventPostToDbEvent(event, seriesId));
}