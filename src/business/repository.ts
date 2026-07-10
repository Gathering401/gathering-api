import knex from 'knex';
import {
    BusinessInvitation,
    mapBusinessInvitationToDbBusinessInvitation
} from "./Business";
import {BusinessInvitationStatus} from "../common/enums/businessInvitationStatus";
import {getDateBy, Timeframe} from "../common/enums/timeframe";
import {DateTime} from "luxon";

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];

const database = knex(connection);

export const getBusinessByEmail = async (contactEmail: string) => {
    const [business] = await database
        .table('business')
        .select('*')
        .where('contact_email', contactEmail);

    return business;
}

export const postBusiness = async (name: string, category: string, contactEmail: string, contactPhone: string | null, passwordHash: string) => {
    const [response] = await database
        .table('business')
        .insert({
            name,
            category,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            password_hash: passwordHash
        })
        .returning(['id', 'name', 'category', 'contact_email', 'contact_phone']);

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
            this.on('i.event_id', '=', 'e.id').andOn('i.rsvp_status', '=', database.raw('2'));
        })
        .select('r.as_push_notification', 'r.response', 'r.business_invitation_id')
        .count('r.id as count')
        .count('i.user_id AS rsvpsAccepted')
        .whereIn('r.business_invitation_id', invitationIds)
        .groupBy('r.business_invitation_id', 'r.as_push_notification', 'r.response')
        .orderBy(['r.business_invitation_id', 'r.as_push_notification', 'r.response']);
}
