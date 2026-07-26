import knex from 'knex';
import {
    BusinessInvitation,
    mapBusinessInvitationToDbBusinessInvitation,
    mapDbBusinessInvitationToBusinessInvitation
} from "./Business";
import {BusinessInvitationStatus} from "../common/enums/businessInvitationStatus";
import {getDateBy, Timeframe} from "../common/enums/timeframe";
import {DateTime} from "luxon";
import {RsvpStatus} from "../common/enums/rsvpStatus";
import {milesBetween} from "../common/utils/haversineCalculator";
import {BusinessInvitationResponse} from "../common/enums/businessInvitationResponse";

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];

const database = knex(connection);

export const getBusinessByEmail = async (contactEmail: string) => {
    const [business] = await database
        .table('business')
        .select('*')
        .where('contact_email', contactEmail);

    return business;
}

export const postBusiness = async (name: string, category: string, contactEmail: string, contactPhone: string | null, averageCost: number, passwordHash: string) => {
    const [response] = await database
        .table('business')
        .insert({
            name,
            category,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            average_cost: averageCost,
            password_hash: passwordHash
        })
        .returning(['id', 'name', 'category', 'contact_email', 'contact_phone', 'average_cost']);

    return response;
}

export const postBusinessInvitation = async (invitation: BusinessInvitation) => {
    return database
        .table('business_invitation')
        .insert(mapBusinessInvitationToDbBusinessInvitation(invitation))
        .returning('*');
}

export const getBusinessInvitationsByBusinessId = async (businessId: number, status?: number) => {
    const query = database
        .table('business_invitation')
        .select('*')
        .where('business_id', businessId)
        .orderBy('id', 'desc');

    if (status) {
        query.andWhere('status', status);
    }

    return query;
}

export const activateStartingInvitations = async () => {
    return database
        .table('business_invitation')
        .where('status', BusinessInvitationStatus.Draft)
        .andWhere('date_start', '<=', DateTime.now().toSQLDate())
        .update({ status: BusinessInvitationStatus.Active });
}

export const completeEndingInvitations = async () => {
    return database
        .table('business_invitation')
        .where('status', BusinessInvitationStatus.Active)
        .andWhere('date_end', '<', DateTime.now().toSQLDate())
        .update({ status: BusinessInvitationStatus.Completed });
}

export const selectCompareIds = async (invitationId: number, timeframe: Timeframe) => {
    const query = database('business_invitation as i')
        .select('id')
        .where('i.id', '<>', invitationId);

    if ([Timeframe.Last6Months, Timeframe.LastYear, Timeframe.AllTime].includes(timeframe)) {
        query
            .andWhere('i.date_end', '>', getDateBy(timeframe))
            .andWhere('i.date_start', '<=', DateTime.now().toSQLDate());
    } else if (Timeframe.JustPrevious === timeframe) {
        query.orderBy('i.date_end').limit(1);
    } else if (Timeframe.Last5Campaigns === timeframe) {
        query.orderBy('i.date_end').limit(5);
    }

    return query;
}

export const selectAnalytics = async (invitationIds: number[]) => {
    return database('business_invitation_recipient as r')
        .leftJoin('event as e', 'e.business_invitation_id', 'r.business_invitation_id')
        .leftJoin('event_invitation as i', function () {
            this.on('i.event_id', '=', 'e.id').andOn('i.rsvp_status', '=', database.raw(RsvpStatus.accepted));
        })
        .select('r.as_push_notification', 'r.response', 'r.business_invitation_id')
        .count('r.id as count')
        .count('i.user_id AS rsvpsAccepted')
        .whereIn('r.business_invitation_id', invitationIds)
        .groupBy('r.business_invitation_id', 'r.as_push_notification', 'r.response')
        .orderBy(['r.business_invitation_id', 'r.as_push_notification', 'r.response']);
}

export const zipCodeExists = async (zipCode: string) => {
    return database('zip_code')
        .where('zip_code', zipCode);
}

export const getZipCodeLatLng = async (zipCode: string) => {
    return database('zip_code')
        .where('zip_code', zipCode)
        .select('latitude', 'longitude')
        .first();
}

export const isUserWithinInvitationRadius = async (
    userId: number,
    invitationId: number
) => {
    const user = await database('user')
        .join('zip_code', 'zip_code.zip_code', 'user.zip_code')
        .select('zip_code.latitude', 'zip_code.longitude')
        .where('user.id', userId)
        .first();

    if (!user) {
        return false;
    }

    const invitation = await database('business_invitation')
        .select('location_lat', 'location_lng', 'location_radius_miles')
        .where('id', invitationId)
        .first();

    const distance = milesBetween(
        user.latitude,
        user.longitude,
        invitation.location_lat,
        invitation.location_lng
    );

    return distance <= invitation.location_radius_miles;
}

export const demoteActiveInvitations = async () => {
    await database('business_invitation_recipient')
        .where('response', BusinessInvitationResponse.Pending)
        .whereIn('slot_position', [3, 4, 5])
        .update({ response: BusinessInvitationResponse.Declined, slot_position: 0 });

    await database('business_invitation_recipient')
        .where('slot_position', 2)
        .update({ slot_position: 5 });

    await database('business_invitation_recipient')
        .where('slot_position', 1)
        .update({ slot_position: 4 });
}

export const gatherUsers = async (): Promise<{ id: number }[]> => {
    return database('user').select('id');
}

export const gatherCampaigns = async (): Promise<BusinessInvitation[]> => {
    const today = new Date();
    const rows = await database('business_invitation')
        .where('date_start', '<=', today)
        .andWhere('date_end', '>=', today);
    return rows.map(mapDbBusinessInvitationToBusinessInvitation);
}

export const getUserBeenInvited = async (campaignId: number, userId: number): Promise<boolean> => {
    const result = await database.raw(
        `select exists (
            select id from business_invitation_recipient
            where business_invitation_id = ? and user_id = ?
        ) as "alreadyBeenInvited"`,
        [campaignId, userId]
    );
    return result.rows[0].alreadyBeenInvited;
}

export const getEligibleGroupsForUser = async (userId: number, campaign: BusinessInvitation): Promise<number> => {
    const query = database('group as g')
        .leftJoin('group_user as gu', 'g.id', 'gu.group_id')
        .where('gu.user_id', userId)
        .whereIn('gu.role', [2, 3, 4])
        .whereRaw(
            '(select count(inner_gu.id) from group_user as inner_gu where inner_gu.group_id = g.id) >= ?',
            [campaign.groupSizeMin]
        );

    if (campaign.groupSizeMax !== null) {
        query.whereRaw(
            '(select count(inner_gu.id) from group_user as inner_gu where inner_gu.group_id = g.id) <= ?',
            [campaign.groupSizeMax]
        );
    }

    const result = await query.count('g.id as count').first();
    return Number(result?.count ?? 0);
}

export const createBusinessInvitationRecipient = async (
    businessInvitationId: number,
    userId: number,
    slotPosition: number
): Promise<void> => {
    await database('business_invitation_recipient').insert({
        business_invitation_id: businessInvitationId,
        user_id: userId,
        slot_position: slotPosition
    });
}

export const onEventCreatedFromInvitation = async (userId: number, businessInvitationId: number) => {
    const recipient = await database('business_invitation_recipient')
        .where({ user_id: userId, business_invitation_id: businessInvitationId })
        .select('slot_position')
        .first();

    await database('business_invitation_recipient')
        .where({ user_id: userId, business_invitation_id: businessInvitationId })
        .update({
            as_push_notification: recipient.slot_position === 1,
            response: BusinessInvitationResponse.Accepted
        });
}

export const getPushSlotRecipients = async () => {
    return database('business_invitation_recipient as r')
        .join('user as u', 'u.id', 'r.user_id')
        .join('business_invitation as b', 'b.id', 'r.business_invitation_id')
        .where('r.slot_position', 1)
        .whereNotNull('u.expo_push_token')
        .select(
            'u.expo_push_token',
            'b.id as invitation_id',
            'b.name',
            'b.description'
        );
}
