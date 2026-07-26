import {BusinessInvitationStatus} from "../common/enums/businessInvitationStatus";
import {BusinessInvitationResponse} from "../common/enums/businessInvitationResponse";

export interface Business {
    name: string;
    category: string;
    contactEmail: string;
    contactPhone: string | null;
    password: string;
}

export interface BusinessInvitation {
    id?: number;
    name: string;
    description: string;
    businessId: number;
    status?: BusinessInvitationStatus;
    groupSizeMin: number;
    groupSizeMax: number;
    locationRadiusMiles: number | null;
    locationLat: number;
    locationLng: number;
    dateStart: string | null;
    dateEnd: string | null;
    daysOfWeek: number[] | null;
    keywords: string[] | null;
    groupTypeSignal: string | null;
}

export interface DbBusinessInvitationPost {
    business_id: number;
    name: string;
    description: string;
    group_size_min: number;
    group_size_max: number;
    location_radius_miles: number | null;
    location_lat: number;
    location_lng: number;
    date_start: string | null;
    date_end: string | null;
    days_of_week: string | null;
    keywords: string | null;
    group_type_signal: string | null;
}

interface DbBusinessInvitation extends DbBusinessInvitationPost {
    id: number;
    status: BusinessInvitationStatus;
}

interface BusinessInvitationRecipient {
    businessInvitationId: number;
    response: BusinessInvitationResponse;
    respondedAt: Date;
    createdAt: Date;
}

interface DbBusinessInvitationRecipient {
    business_invitation_id: number;
    response: BusinessInvitationResponse;
    responded_at: string;
    created_at: string;
}

export interface Analytics {
    id: number;
    name: string;
    pushNotificationsCreated: InvitationDetails;
    calendarInvitationsCreated: InvitationDetails;
}

export interface InvitationDetails {
    usersReached: number;
    eventsCreated: number;
    usersRejected: number;
    rsvpsAccepted: number;
    totalCost?: number;
    totalProjectedCost?: number;
}

export interface DbAnalytics {
    business_invitation_id: number;
    name: string;
    as_push_notification: boolean;
    response: number;
    count: number;
    rsvpsAccepted: number;
}

export interface CampaignMatch {
    id: number;
    groupCount: number;
}

export interface ActiveInvitation {
    id: number;
    name: string;
    description: string;
    businessName: string;
    dateStart: string | null;
    dateEnd: string | null;
    slotPosition: number;
    asPushNotification: boolean;
    response: BusinessInvitationResponse;
}

export interface DbActiveInvitation {
    id: number;
    name: string;
    description: string;
    business_name: string;
    date_start: string | null;
    date_end: string | null;
    slot_position: number;
    as_push_notification: boolean;
    response: BusinessInvitationResponse;
}

export const mapDbActiveInvitationToActiveInvitation = (db: DbActiveInvitation): ActiveInvitation => ({
    id: db.id,
    name: db.name,
    description: db.description,
    businessName: db.business_name,
    dateStart: db.date_start,
    dateEnd: db.date_end,
    slotPosition: db.slot_position,
    asPushNotification: db.as_push_notification,
    response: db.response
});

export const mapBusinessInvitationToDbBusinessInvitation = (invitation: BusinessInvitation): DbBusinessInvitationPost => ({
    business_id: invitation.businessId,
    name: invitation.name,
    description: invitation.description,
    group_size_min: invitation.groupSizeMin,
    group_size_max: invitation.groupSizeMax,
    location_radius_miles: invitation.locationRadiusMiles,
    location_lat: invitation.locationLat,
    location_lng: invitation.locationLng,
    date_start: invitation.dateStart,
    date_end: invitation.dateEnd,
    days_of_week: invitation.daysOfWeek ? JSON.stringify(invitation.daysOfWeek) : null,
    keywords: invitation.keywords ? JSON.stringify(invitation.keywords) : null,
    group_type_signal: invitation.groupTypeSignal
});

export const mapDbBusinessInvitationToBusinessInvitation = (invitation: DbBusinessInvitation): BusinessInvitation => ({
    id: invitation.id,
    name: invitation.name,
    description: invitation.description,
    businessId: Number(invitation.business_id),
    status: invitation.status,
    groupSizeMin: invitation.group_size_min,
    groupSizeMax: invitation.group_size_max,
    locationRadiusMiles: invitation.location_radius_miles,
    locationLat: Number(invitation.location_lat),
    locationLng: Number(invitation.location_lng),
    dateStart: invitation.date_start,
    dateEnd: invitation.date_end,
    daysOfWeek: invitation.days_of_week ? JSON.parse(invitation.days_of_week) : null,
    keywords: invitation.keywords ? JSON.parse(invitation.keywords) : null,
    groupTypeSignal: invitation.group_type_signal
});

export const mapRequestBodyToBusinessInvitation = (businessId: number, body: any): BusinessInvitation => ({
    businessId,
    name: body.name,
    description: body.description,
    groupSizeMin: body.groupSizeMin,
    groupSizeMax: body.groupSizeMax,
    locationRadiusMiles: body.locationRadiusMiles ?? null,
    locationLat: body.locationLat,
    locationLng: body.locationLng,
    dateStart: body.dateStart ?? null,
    dateEnd: body.dateEnd ?? null,
    daysOfWeek: body.daysOfWeek ?? null,
    keywords: body.keywords ?? null,
    groupTypeSignal: body.groupTypeSignal ?? null
});

export const mapToAnalytics = (analytics: DbAnalytics[] | DbAnalytics): Analytics => {
    if(!Array.isArray(analytics)) {
        analytics = [analytics];
    }

    const pushNotificationsCreated: InvitationDetails = {
        usersReached: 0,
        eventsCreated: 0,
        usersRejected: 0,
        rsvpsAccepted: 0
    }
    const calendarInvitationsCreated: InvitationDetails = {
        usersReached: 0,
        eventsCreated: 0,
        usersRejected: 0,
        rsvpsAccepted: 0
    }

    for(const row of analytics) {
        const isPush = row.as_push_notification;

        if (isPush) {
            pushNotificationsCreated.usersReached += Number(row.count);

            if (row.response === BusinessInvitationResponse.Accepted) {
                pushNotificationsCreated.eventsCreated += Number(row.count);
                pushNotificationsCreated.rsvpsAccepted += Number(row.rsvpsAccepted);
            } else if(row.response === BusinessInvitationResponse.Declined) {
                pushNotificationsCreated.usersRejected += Number(row.count);
            }
        } else {
            calendarInvitationsCreated.usersReached += Number(row.count);

            if (row.response === BusinessInvitationResponse.Accepted) {
                calendarInvitationsCreated.eventsCreated += Number(row.count);
                calendarInvitationsCreated.rsvpsAccepted += Number(row.rsvpsAccepted);
            } else if(row.response === BusinessInvitationResponse.Declined) {
                calendarInvitationsCreated.usersRejected += Number(row.count);
            }
        }
    }

    return {
        id: analytics[0]!.business_invitation_id,
        name: analytics[0]!.name,
        pushNotificationsCreated,
        calendarInvitationsCreated
    }
}
