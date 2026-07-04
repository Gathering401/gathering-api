import {BusinessInvitationStatus} from "../common/enums/businessInvitationStatus";

export interface Business {
    name: string;
    category: string;
    contactEmail: string;
    contactPhone: string | null;
    password: string;
}

export interface BusinessInvitation {
    id?: number;
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

export const mapBusinessInvitationToDbBusinessInvitation = (invitation: BusinessInvitation): DbBusinessInvitationPost => ({
    business_id: invitation.businessId,
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
