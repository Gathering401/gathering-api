import knex from 'knex';

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];
import {mapUserToDb, User} from "./User";
import _ from "lodash";

const database = knex(connection);

export const postUser = async (user: User): Promise<User[]> => {
    return database
        .table('user')
        .insert(mapUserToDb(user))
        .returning(['id', 'first_name', 'last_name', 'email', 'birthdate', 'username', 'phone']);
}

export const getUser = async (username: string) => {
    return database
        .table('user')
        .select('*')
        .where('username', username);
}

export const getUserById = async (id: number): Promise<User[]> => {
    return database
        .table('user')
        .select('*')
        .where('id', id);
}

export const putUser = async (user: Partial<User>): Promise<User> => {
    return database
        .table('user')
        .update({
            first_name: user.firstName,
            last_name: user.lastName,
            phone: user.phone
        })
        .where('id', user.id)
        .returning(['id', 'first_name', 'last_name', 'email', 'username', 'birthdate', 'phone']);
}

export const deleteUser = async (id: number): Promise<void> => {
    await database
        .table('user')
        .delete().where('id', id);
}
