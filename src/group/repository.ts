import knex from 'knex';

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];
import { DbGroupPost } from "./Group";

const database = knex(connection);

export const postGroup = async (group: DbGroupPost) => {
    const [response] = await database
        .table('group')
        .insert(group)
        .returning(['id']);

    await database
        .table('group_user')
        .insert({
            group_id: response.id,
            user_id: response.id,
            role: 4,
            invite_status: 2
        });

    return database
        .table('group')
        .select('*')
        .leftJoin('user', 'group.owner_id', 'user.id')
        .where('group.id', response.id);
}