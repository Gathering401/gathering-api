export interface User {
    id?: number;
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthdate: string;
    phone: string;
}

interface DbUser {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    birthdate: string;
    phone: string;
}

export interface TokenUser {
    payload: {
        username: string;
        userId: number;
    }
}

export const mapUserToDb = (user: User): DbUser => ({
    username: user.username,
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    password: user.password,
    birthdate: user.birthdate,
    phone: user.phone
});
