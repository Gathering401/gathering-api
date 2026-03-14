import knex from 'knex';

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];
import { DbGroupPost } from "./Group";

const database = knex(connection);

export const postGroup = async (group: DbGroupPost) => {
    const [response] = await database
        .table('group')
        .insert(group)
        .returning(['id']);

    return database
        .table('group')
        .select('*')
        .leftJoin('user', 'group.owner_id', 'user.id')
        .where('group.id', response.id);
}