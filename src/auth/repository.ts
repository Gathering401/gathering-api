import knex from 'knex';

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];
import {mapUserToDb, User} from "../common/models/User";
import _ from "lodash";

const database = knex(connection);

export const postUser = async (user: User): Promise<User> => {
    return database
        .table('user')
        .insert(mapUserToDb(user))
        .returning(['id', 'first_name', 'last_name', 'email', 'birthdate', 'username']);
}

export const getUser = async (username: string): Promise<User[]> => {
    return database
        .table('user')
        .where('username', username)
        .returning(['id', 'first_name', 'last_name', 'email', 'birthdate', 'username']);
}

export const putUser = async (user: User): Promise<User> => {
    return database
        .table('user')
        .update(_.omit(mapUserToDb(user), 'password'))
        .where('id', user.id)
        .returning(['id', 'first_name', 'last_name', 'email', 'username', 'birthdate']);
}