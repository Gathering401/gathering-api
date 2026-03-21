import {RsvpStatus} from "../common/enums/rsvpStatus";
import {Repetition} from "../common/enums/repetition";
import _ from "lodash";

export interface EventPost {
    name: string;
    description: string;
    location: string;
    groupId: number;
    hostId: number;
    cost?: number;
    dates: string[];
    repetition: Repetition;
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
}

export interface Event extends PartialEvent {
    location: string;
    host: Rsvp;
    rsvps: Rsvp[];
    cost: number;
    seriesId?: number;
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
}

export interface DbEventGet extends PartialDbEventGet {
    series_id: string;
    repetition: Repetition.annually;
    rsvp_status: RsvpStatus;
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
}));

export const mapDbEventsToPartialEvents = (events: PartialDbEventGet[]): PartialEvent[] => events.map(e => ({
    id: e.id,
    name: e.name,
    description: e.description,
    date: new Date(e.date),
    groupId: Number(e.group_id)
}));

export const mapDbEventToEvent = (events: DbEventGet[]): Event => {
    const rsvps = _.uniqBy(events.map((invitation: DbEventGet): Rsvp => ({
        userId: Number(invitation.user_id),
        rsvp: invitation.rsvp_status,
        username: invitation.username,
        fullName: `${invitation.first_name} ${invitation.last_name}`
    })), 'id');

    const event = events[0]!;

    return {
        id: event.id,
        groupId: event.group_id,
        name: event.name,
        description: event.description,
        location: event.location,
        host: rsvps.find(u => u.userId === Number(event.host_id))!,
        rsvps,
        cost: event.cost ?? 0,
        date: new Date(event.date)
    }
}
