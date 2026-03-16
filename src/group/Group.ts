import {User} from "../auth/User";

export interface Group {
    id?: number;
    name: string;
    description: string;
    public: boolean;
    owner: Omit<User, 'password' | 'birthdate'>;
}

export interface DbGroupPost {
    name: string;
    description: string;
    public: boolean;
}

export interface DbGroupGet extends DbGroupPost {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    birthdate: string;
}

export const mapGroupToDbGroup = (group: Group): DbGroupPost => ({
    name: group.name,
    description: group.description,
    public: group.public
});

export const mapDbGroupToGroup = (group: DbGroupGet): Group => ({
    name: group.name,
    description: group.description,
    public: group.public,
    owner: {
        firstName: group.first_name,
        lastName: group.last_name,
        email: group.email,
        username: group.username
    }
});
