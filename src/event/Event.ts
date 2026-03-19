import {RsvpStatus} from "../common/enums/rsvpStatus";
import {User} from "../auth/User";
import {Repetition} from "../common/enums/repetition";

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

export interface PartialEvent {
    id: number;
    name: string;
    description: string;
    date: string;
}

export interface Event extends PartialEvent {
    groupId: number;
    location: string;
    host: Omit<User, 'password' | 'birthdate'>;
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

export interface DbEventPost {
    name: string;
    description: string;
    location: string;
    date: string;
    cost: number | undefined;
    repetition: Repetition;
    group_id: number;
    host_id: number;
    series_id: number;
}

export const mapEventPostToDbEvent = (event: EventPost, seriesId: number): DbEventPost[] => event.dates.map((date: string) => ({
    name: event.name,
    description: event.description,
    location: event.location,
    date,
    cost: event.cost,
    repetition: event.repetition,
    group_id: event.groupId,
    host_id: event.hostId,
    series_id: seriesId,
}));
