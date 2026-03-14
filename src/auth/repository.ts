import knex from 'knex';

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];
import {mapUserToDb, User} from "../common/models/User";

const database = knex(connection);

export const postUser = async (user: User): Promise<User> => {
    return database.table('user').insert(mapUserToDb(user)).returning(['id', 'first_name', 'last_name', 'email', 'birthdate', 'username']);
}

export const getUser = async (username: string): Promise<User[]> => {
    return database.table('user').where('username', username).returning(['id', 'first_name', 'last_name', 'email', 'birthdate', 'username', 'password']);
}

export const putUser = async (user: User): Promise<User> => {
    return database.table('user').update(mapUserToDb(user)).returning(['id', 'first_name', 'last_name', 'email', 'username', 'birthdate']);
}