import knex from 'knex';

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];
import {DbGroupPost, Group, mapGroupToDbGroup} from "./Group";
import {Role} from "../common/enums/role";
import {InviteStatus} from "../common/enums/inviteStatus";
import {GroupUser} from "../common/constants/GroupUser";

const database = knex(connection);

export const selectGroup = async (groupId: number, isInGroup: boolean, isAdmin: boolean) => {
    const query = database
        .table('group')
        .select('group.*', 'event.name as event_name', 'event.description as event_description', 'event.date', 'event.id as event_id',
            'group_user.role', 'group_user.user_id', 'group_user.invite_status', 'user.username', 'user.first_name', 'user.last_name')
        .leftJoin('event', 'group.id', 'event.group_id')
        .where('group.id', groupId);

    if (!isInGroup) {
        query
            .leftJoin('group_user', function () {
                this.on('group.id', '=', 'group_user.group_id')
                    .onIn('group_user.role', [4])
            });
    } else if (!isAdmin) {
        query
            .leftJoin('group_user', function () {
                this.on('group.id', '=', 'group_user.group_id')
                    .onIn('group_user.invite_status', [2])
            });
    } else {
        query
            .leftJoin('group_user', function () {
                this.on('group.id', '=', 'group_user.group_id')
                    .onIn('group_user.invite_status', [1, 2])
            });
    }

    query
        .leftJoin('user', 'group_user.user_id', 'user.id');

    console.log('query', query.toQuery());

    return query;
}

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
        .update(mapGroupToDbGroup(group))
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
    const [group] = await database
        .table('group')
        .select('public')
        .where('group_id', groupId);

    await database
        .table('group_user')
        .insert({
            user_id: userId,
            group_id: groupId,
            invited_by_group: invitedByGroup,
            invite_status: (group.public && !invitedByGroup) ? InviteStatus.accepted : InviteStatus.pending
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

export const putUserRole = async (groupId: number, userId: number, role: Role) => {
    await database
        .table('group_user')
        .update({
            role: role
        })
        .where('group_id', groupId)
        .andWhere('user_id', userId);
}
