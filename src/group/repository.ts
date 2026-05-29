import knex from 'knex';
import {DbGroupPost, Group, mapGroupToDbGroup} from "./Group";
import {Role} from "../common/enums/role";
import {InviteStatus} from "../common/enums/inviteStatus";
import {GroupUser} from "../common/constants/GroupUser";
import {DateTime} from "luxon";

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];

const database = knex(connection);

export const selectGroup = async (groupId: number, isAdmin: boolean) => {
    const query = database
        .table('group')
        .select('group.*', 'event.name as event_name', 'event.description as event_description', 'event.date', 'event.id as event_id',
            'group_user.role', 'group_user.user_id', 'group_user.invite_status', 'group_user.invited_by_group', 'user.username', 'user.first_name', 'user.last_name')
        .leftJoin('event', function () {
            this.on('group.id', '=', 'event.group_id')
                .andOnBetween('event.date', [DateTime.now().toISO(), DateTime.now().plus({ week: 2 }).toISO()]);
        })
        .where('group.id', groupId);

    if (!isAdmin) {
        query
            .leftJoin('group_user', function () {
                this.on('group.id', '=', 'group_user.group_id')
                    .onIn('group_user.role', [4])
            });
    } else {
        query
            .leftJoin('group_user', function () {
                this.on('group.id', '=', 'group_user.group_id')
                    .onIn('group_user.invite_status', [1, 2])
            });
    }

    return query.leftJoin('user', 'group_user.user_id', 'user.id');
}

export const getUserGroups = async (userId: number) => {
    return database
        .table('group')
        .select('group.*')
        .leftJoin('group_user', 'group.id', 'group_user.group_id')
        .where('group_user.user_id', userId);
}

export const selectAvailableGroups = async (searchString?: string) => {
    const query = database
        .table('group')
        .select('group.*')
        .count('group_user.user_id as member_count')
        .leftJoin('group_user', function () {
            this.on('group.id', '=', 'group_user.group_id')
                .onIn('group_user.invite_status', [2]);
        })
        .groupBy('group.id')
        .orderBy('member_count', 'desc')
        .limit(25);

    if (searchString) {
        query.where('group.name', 'like', `%${searchString}%`);
    } else {
        query.where('group.public', true);
    }

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

export const updateOwner = async (groupId: number, newOwnerId: number, currentUserId: number) => {
    await database
        .table('group_user')
        .update({
            role: Role.owner,
            invite_status: InviteStatus.accepted
        })
        .where('user_id', newOwnerId)
        .andWhere('group_id', groupId);

    await database
        .table('group_user')
        .update({
            role: Role.admin,
            invite_status: InviteStatus.accepted
        })
        .where('user_id', currentUserId)
        .andWhere('group_id', groupId);
}

const isPublic = async (groupId: number) => {
    const [group] = await database
        .table('group')
        .select('public')
        .where('id', groupId);

    return group.public;
}

export const postUserInvite = async (userId: number, groupId: number, invitedByGroup: boolean) => {
    const publicGroup = await isPublic(groupId);

    const canJoinImmediately = Boolean(publicGroup && !invitedByGroup);

    await database
        .table('group_user')
        .insert({
            user_id: userId,
            group_id: groupId,
            invited_by_group: invitedByGroup,
            invite_status: canJoinImmediately ? InviteStatus.accepted : InviteStatus.pending
        });

    if(canJoinImmediately) {
        await postEventInvitesForNewGroupUser(groupId, userId);
    }
}

export const postEventInvitesForNewGroupUser = async (groupId: number, userId: number) => {
    const eventsFromGroup = await database
        .table('event')
        .select('id')
        .where('group_id', groupId)
        .andWhere('date', '>=', DateTime.now().toISO());

    await database
        .table('event_invitation')
        .insert(eventsFromGroup.map(e => ({
            event_id: e.id,
            user_id: userId
        })));
}

export const putUserInvite = async (groupId: number, userId: number, accepted: boolean, invitedByGroup: boolean) => {
    const inviteStatus = accepted
        ? InviteStatus.accepted
        : invitedByGroup
            ? InviteStatus.rejected_by_user
            : InviteStatus.rejected_by_group;

    await database
        .table('group_user')
        .update({ invite_status: inviteStatus })
        .where('group_id', groupId)
        .andWhere('user_id', userId);

    await postEventInvitesForNewGroupUser(groupId, userId);
}

export const deleteGroupUser = async (groupId: number, userId: number) => {
    await database
        .table('group_user')
        .delete()
        .where('group_id', groupId)
        .andWhere('user_id', userId);

    const eventIds = (await database
        .table('event')
        .select('id')
        .where('group_id', groupId))
        .map(e => e.id);

    await database
        .table('event_invitation')
        .delete()
        .whereIn('event_id', eventIds)
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
