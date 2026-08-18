import knex from 'knex';
import {DbGroupPost, Group, mapGroupToDbGroup} from "./types";
import {Role} from "../common/enums/role";
import {InviteStatus} from "../common/enums/inviteStatus";
import {DateTime} from "luxon";

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];

const database = knex(connection);

export const selectGroup = async (groupId: number, isAdmin: boolean, userId: number) => {
    const upcomingEvents = database('event')
        .select('*')
        .distinctOn('series_id')
        .where('group_id', groupId)
        .andWhere('date', '>=', DateTime.now().toISO())
        .andWhere('date', '<=', DateTime.now().plus({ month: 6 }).toISO())
        .orderBy('series_id', 'asc')
        .orderBy('date', 'asc')
        .limit(20)
        .as('event');

    const query = database
        .table('group')
        .select('group.*', 'event.name as event_name', 'event.description as event_description', 'event.date', 'event.id as event_id', 'event.repetition', 'event.series_id',
            'group_user.role', 'group_user.user_id', 'group_user.invite_status', 'group_user.invited_by_group', 'user.username', 'user.first_name', 'user.last_name',
            'event_invitation.rsvp_status as my_rsvp')
        .leftJoin(upcomingEvents, 'group.id', 'event.group_id')
        .leftJoin('event_invitation', function() {
            this.on('event.id', '=', 'event_invitation.event_id')
                .andOn('event_invitation.user_id', '=', database.raw('?', [userId]))
        })
        .where('group.id', groupId);

    if (!isAdmin) {
        query.leftJoin('group_user', function () {
            this.on('group.id', '=', 'group_user.group_id')
                .onIn('group_user.role', [4]);
        });
    } else {
        query.leftJoin('group_user', function () {
            this.on('group.id', '=', 'group_user.group_id')
                .onIn('group_user.invite_status', [1, 2]);
        });
    }

    return query
        .orderBy('event.date', 'asc')
        .leftJoin('user', 'group_user.user_id', 'user.id');
}

export const selectAllGroupEvents = async (groupId: number, userId: number) => {
    return database('event AS e')
        .select(
            'e.id as event_id',
            'e.name as event_name',
            'e.description as event_description',
            'e.date',
            'e.repetition',
            'e.series_id',
            'ei.rsvp_status as my_rsvp'
        )
        .distinctOn('e.series_id')
        .leftJoin('event_invitation AS ei', function () {
            this.on('e.id', '=', 'ei.event_id')
                .andOn('ei.user_id', '=', database.raw('?', [userId]));
        })
        .where('e.group_id', groupId)
        .andWhere('e.date', '>=', DateTime.now().toISO())
        .andWhere('e.date', '<=', DateTime.now().plus({ year: 1 }).toISO())
        .orderBy('e.series_id', 'asc')
        .orderBy('e.date', 'asc')
        .limit(500);
}

export const selectUserGroups = async (userId: number) => {
    return database
        .table('group')
        .select(
            'group.*',
            'group_user.invite_status as inviteStatus',
            'group_user.invited_by_group as invitedByGroup',
            'group_user.role',
            database.raw(`(
                SELECT COUNT(*)
                FROM event_invitation
                INNER JOIN event ON event_invitation.event_id = event.id
                WHERE event.group_id = "group".id
                AND event_invitation.user_id = ?
                AND event_invitation.rsvp_status = 1
                AND event.date >= ?
            ) as pendingRsvpCount`, [userId, DateTime.now().toISO()]),
            database.raw(`(
                SELECT COUNT(*)
                FROM group_user gu
                WHERE gu.group_id = "group".id
                AND gu.invite_status = 1
                AND gu.invited_by_group = false
            ) as pendingJoinRequestCount`),
            database.raw(`(
                SELECT MIN(event.date)
                FROM event
                INNER JOIN event_invitation ON event_invitation.event_id = event.id
                WHERE event.group_id = "group".id
                AND event_invitation.user_id = ?
                AND event.date >= ?
            ) as nextEventDate`, [userId, DateTime.now().toISO()])
        )
        .leftJoin('group_user', 'group.id', 'group_user.group_id')
        .whereNotIn('group_user.invite_status', ['3', '4'])
        .andWhere('group_user.user_id', userId)
        .orderByRaw(`
            CASE WHEN group_user.invite_status = 1 AND group_user.invited_by_group = true THEN 0 ELSE 1 END ASC,
            nextEventDate ASC NULLS LAST
        `);
}

export const selectEventCreatableGroups = async (userId: number) => {
    return database
        .table('group')
        .select('group.id', 'group.name')
        .innerJoin('group_user', 'group.id', 'group_user.group_id')
        .where('group_user.user_id', userId)
        .andWhere('group_user.invite_status', InviteStatus.accepted)
        .whereIn('group_user.role', [Role.creator, Role.admin, Role.owner])
        .orderBy('group.name', 'asc');
}

export const selectAvailableGroups = async (searchString?: string, userId?: number) => {
    const query = database
        .table('group')
        .select('group.*')
        .count('gu_count.user_id as member_count')
        .select('gu_user.invite_status as inviteStatus')
        .leftJoin('group_user as gu_count', function () {
            this.on('group.id', '=', 'gu_count.group_id')
                .onIn('gu_count.invite_status', [2]);
        })
        .leftJoin('group_user as gu_user', function () {
            this.on('group.id', '=', 'gu_user.group_id')
                .on('gu_user.user_id', '=', database.raw('?', [String(userId)]));
        })
        .where(function () {
            this.whereNull('gu_user.user_id')
                .orWhereNotIn('gu_user.invite_status', [
                    InviteStatus.accepted,
                    InviteStatus.pending
                ]);
        })
        .groupBy('group.id', 'gu_user.invite_status')
        .orderBy('member_count', 'desc')
        .limit(25);

    if (searchString) {
        query.whereRaw('LOWER("group".name) LIKE ?', [`%${searchString.toLowerCase()}%`]);
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
        .delete()
        .where('id', id);
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

    if(eventsFromGroup.length) {
        await database
            .table('event_invitation')
            .insert(eventsFromGroup.map(e => ({
                event_id: e.id,
                user_id: userId
            })));
    }
}

export const putUserInvite = async (groupId: number, userId: number, accepted: boolean, invitedByGroup: boolean) => {
    if (accepted) {
        await database
            .table('group_user')
            .update({ invite_status: InviteStatus.accepted })
            .where('group_id', groupId)
            .andWhere('user_id', userId);

        await postEventInvitesForNewGroupUser(groupId, userId);
    } else if (invitedByGroup) {
        await database
            .table('group_user')
            .delete()
            .where('group_id', groupId)
            .andWhere('user_id', userId);
    } else {
        await database
            .table('group_user')
            .update({ invite_status: InviteStatus.rejected_by_group })
            .where('group_id', groupId)
            .andWhere('user_id', userId);
    }
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

export const getUsersBy = async (username: string, groupId: number, userId: number) => {
    return database
        .table('user')
        .select('user.username', 'user.id', 'group_user.invite_status')
        .leftJoin('group_user', function () {
            this.on('group_user.user_id', '=', 'user.id')
                .andOn('group_user.group_id', '=', database.raw('?', [groupId]));
        })
        .whereRaw('LOWER("user".username) LIKE ?', [`%${username.toLowerCase()}%`])
        .andWhereNot('user.id', userId)
        .where(function () {
            this.whereNull('group_user.user_id')
                .orWhere('group_user.invite_status', '=', 1)
        });
}

export const updateGroupNotificationPreference = async (groupId: number, userId: number, enabled: boolean) => {
    return database('group_user')
        .where({group_id: groupId, user_id: userId})
        .update({allow_notifications: enabled});
}
