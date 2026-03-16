import knex from 'knex';

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];
import {DbGroupPost, Group, mapGroupToDbGroup} from "./Group";
import _ from "lodash";
import {Role} from "../common/enums/role";
import {InviteStatus} from "../common/enums/inviteStatus";

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
            role: Role.owner,
            invite_status: InviteStatus.accepted
        });

    return database
        .table('group')
        .select('*')
        .leftJoin('user', 'group.owner_id', 'user.id')
        .where('group.id', response.id);
}

export const getGroupUserBy = async (groupId: number, userId: number) => {
    return database
        .table('group_user')
        .where('user_id', userId)
        .andWhere('group_id', groupId);
}

export const putGroup = async (group: Group) => {
    return database
        .table('group')
        .update(_.omit(mapGroupToDbGroup(group), 'owner_id'))
        .where('id', group.id)
        .returning(['id', 'name', 'description']);
}

export const deleteGroup = async (id: number) => {
    await database
        .table('group')
        .delete().where('id', id);
}
