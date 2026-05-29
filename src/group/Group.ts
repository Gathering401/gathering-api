import {User} from "../auth/User";
import {PartialEvent} from "../event/Event";
import {InviteStatus} from "../common/enums/inviteStatus";
import {Role} from "../common/enums/role";
import _ from "lodash";

export interface Group {
    id?: number;
    name: string;
    description: string;
    public: boolean;
}

export interface DbGroupPost {
    name: string;
    description: string;
    public: boolean;
}

interface DbGroup extends Group {
    name: string;
    description: string;
    public: boolean;
    event_id: number;
    event_name: string;
    event_description: string;
    date: string;
    role: Role;
    invite_status: InviteStatus;
    invited_by_group: boolean;
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
}

interface GroupUser extends Omit<User, 'password' | 'email' | 'birthdate'> {
    role: Role;
    inviteStatus: InviteStatus;
    invitedByGroup: boolean;
}

interface GroupResponse extends Group {
    members: GroupUser[];
    events: PartialEvent[];
}

export const mapGroupToDbGroup = (group: Group): DbGroupPost => ({
    name: group.name,
    description: group.description,
    public: group.public
});

export const mapDbGroupToGroup = (group: DbGroup[]): GroupResponse => ({
    id: group[0]!.id!,
    name: group[0]!.name,
    description: group[0]!.description,
    public: group[0]!.public,
    members: _.uniqBy(group.map(r => ({
        id: Number(r.user_id),
        username: r.username,
        firstName: r.first_name,
        lastName: r.last_name,
        role: r.role,
        inviteStatus: r.invite_status,
        invitedByGroup: r.invited_by_group
    })), 'id'),
    events: _.uniqBy(group.map(r => ({
        id: r.event_id,
        name: r.event_name,
        description: r.event_description,
        date: new Date(r.date),
        groupId: r.id,
        groupName: r.name
    })), 'id').filter(r => r.name)
});
