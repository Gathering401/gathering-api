import knex from 'knex';

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];
import {DbGroupPost, Group, mapGroupToDbGroup} from "./Group";
import _ from "lodash";
import {Role} from "../common/enums/role";
import {InviteStatus} from "../common/enums/inviteStatus";
import {GroupUser} from "../common/constants/GroupUser";

const database = knex(connection);

export const postGroup = async (group: DbGroupPost, userId: number) => {
    const [response] = await database
        .table('group')
        .insert(group)
        .returning(['id']);

    await database
        .table('group_user')
        .insert({
            group_id: response.id,
            user_id: userId,
            role: Role.owner,
            invite_status: InviteStatus.accepted,
            invited_by_group: true
        });

    return database
        .table('group')
        .select('*')
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

export const updateOwner = async (groupUser: GroupUser, currentUserId: number) => {
    await database
        .table('group_user')
        .update({
            role: Role.owner,
            invite_status: InviteStatus.accepted
        })
        .where('user_id', groupUser.userId)
        .andWhere('group_id', groupUser.groupId);

    await database
        .table('group_user')
        .update({
            role: Role.admin,
            invite_status: InviteStatus.accepted
        })
        .where('user_id', currentUserId)
        .andWhere('group_id', groupUser.groupId);
}

export const postUserInvite = async (userId: number, groupId: number, invitedByGroup: boolean) => {
    await database
        .table('group_user')
        .insert({
            user_id: userId,
            group_id: groupId,
            invited_by_group: invitedByGroup
        });
}

export const putUserInvite = async (groupId: number, userId: number, accepted: boolean) => {
    await database
        .table('group_user')
        .update({
            invite_status: accepted ? InviteStatus.accepted : InviteStatus.rejected_by_user
        })
        .where('group_id', groupId)
        .andWhere('user_id', userId);
}

export const putUserRequest = async (groupId: number, userId: number, accepted: boolean) => {
    await database
        .table('group_user')
        .update({
            invite_status: accepted ? InviteStatus.accepted : InviteStatus.rejected_by_group
        })
        .where('group_id', groupId)
        .andWhere('user_id', userId);
}

export const deleteGroupUser = async (groupId: number, userId: number) => {
    await database
        .table('group_user')
        .delete()
        .where('group_id', groupId)
        .andWhere('user_id', userId);
}
