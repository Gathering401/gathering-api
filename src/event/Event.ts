import {RsvpStatus} from "../common/enums/rsvpStatus";
import {Repetition} from "../common/enums/repetition";
import _ from "lodash";
import {Role} from "../common/enums/role";

export interface EventPost {
    name: string;
    description: string;
    location: string;
    groupId: number;
    hostId: number;
    cost?: number;
    dates: string[];
    repetition: Repetition;
    businessInvitationId?: number;
}

export interface EventPutMulti {
    id: number;
    name: string;
    description: string;
    location: string;
    cost?: number;
}

export interface EventPutSingle extends EventPutMulti {
    date: string;
}

export interface PartialEvent {
    id: number;
    name: string;
    description: string;
    date: Date;
    groupId: number | undefined;
    groupName: string | undefined;
    myRsvp: RsvpStatus;
    seriesId: number;
    repetition: Repetition;
}

export interface Event extends PartialEvent {
    location: string;
    host: Rsvp;
    rsvps: Rsvp[];
    cost: number;
    currentRole: Role;
    seriesDates: string[];
    myNotifications: boolean;
}

export interface Rsvp {
    rsvp: RsvpStatus;
    userId: number;
    username: string;
    fullName: string;
}

interface PartialDbEventGet {
    id: number;
    name: string;
    description: string;
    date: string;
    group_id: number;
    group_name: string;
    rsvp_status: RsvpStatus;
    series_id: number;
    repetition: Repetition;
}

export interface DbEventGet extends PartialDbEventGet {
    username: string;
    first_name: string;
    last_name: string;
    user_id: string;
    location: string;
    date: string;
    cost: number | undefined;
    host_id: number;
}

export interface DbEventPost {
    name: string;
    description: string;
    location: string;
    date: string;
    cost: number | undefined;
    repetition: Repetition;
    group_id: number;
    host_id: number;
    series_id?: number;
    business_invitation_id?: number;
}

interface DbInvitation {
    event_id: number;
    group_id: number;
    rsvp_status: RsvpStatus;
    event_name: string;
    date: string;
    group_name: string;
    repetition: Repetition;
    description: string;
    series_id: number;
}

interface Invitation {
    eventId: number;
    groupId: number;
    rsvpStatus: RsvpStatus;
    eventName: string;
    date: string;
    groupName: string;
    repetition: Repetition;
    description: string;
    seriesId: number;
}

export const mapEventPostToDbEvent = (event: EventPost, seriesId?: number): DbEventPost[] => event.dates.map((date: string) => ({
    name: event.name,
    description: event.description,
    location: event.location,
    date,
    cost: event.cost,
    repetition: event.repetition,
    group_id: event.groupId,
    host_id: event.hostId,
    ...(seriesId ? {series_id: seriesId} : {}),
    ...(event.businessInvitationId ? {business_invitation_id: event.businessInvitationId} : {}),
}));

export const mapDbEventsToPartialEvents = (events: PartialDbEventGet[]): PartialEvent[] => events.map(e => ({
    id: e.id,
    name: e.name,
    description: e.description,
    date: new Date(e.date),
    groupId: Number(e.group_id),
    groupName: e.group_name,
    myRsvp: e.rsvp_status,
    seriesId: Number(e.series_id),
    repetition: e.repetition
}));

export const mapDbInvitationsToInvitations = (invitations: DbInvitation[]): Invitation[] => invitations.map(i => ({
    eventId: i.event_id,
    groupId: i.group_id,
    eventName: i.event_name,
    rsvpStatus: i.rsvp_status,
    date: i.date,
    groupName: i.group_name,
    repetition: i.repetition,
    description: i.description,
    seriesId: i.series_id
}));

export const mapDbEventToEvent = (events: DbEventGet[], currentRole: Role, host: any, myRsvp: RsvpStatus, myNotifications: boolean, seriesDates: string[] = []): Event => {
    const rsvps = _.uniqBy(events.map((invitation: DbEventGet): Rsvp => ({
        userId: Number(invitation.user_id),
        rsvp: invitation.rsvp_status,
        username: invitation.username,
        fullName: `${invitation.first_name} ${invitation.last_name}`
    })), 'userId');

    const event = events[0]!;

    return {
        id: event.id,
        groupId: event.group_id,
        name: event.name,
        description: event.description,
        location: event.location,
        host: {
            userId: Number(host.host_id),
            fullName: `${host.first_name} ${host.last_name}`,
            username: host.username,
            rsvp: RsvpStatus.accepted
        },
        rsvps,
        cost: event.cost ?? 0,
        date: new Date(event.date),
        groupName: event.group_name,
        seriesId: Number(event.series_id),
        repetition: event.repetition,
        currentRole,
        myRsvp,
        myNotifications,
        seriesDates
    }
}
