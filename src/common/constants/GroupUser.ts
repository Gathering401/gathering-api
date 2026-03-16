import {Role} from "../enums/role";
import {InviteStatus} from "../enums/inviteStatus";

export interface GroupUser {
    groupId: number;
    userId: number;
    role: Role;
    inviteStatus: InviteStatus;
}
