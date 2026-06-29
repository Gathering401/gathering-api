import knex from 'knex';

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];
import {mapUserToDb, User} from "./User";
import {sendPasswordResetEmail} from "../email";
import crypto from 'crypto';
import {encryptPassword} from "./controller";

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

export const putPushToken = async (userId: number, pushToken: string): Promise<void> => {
    await database
        .table('user')
        .update({ expo_push_token: pushToken })
        .where('id', userId);
}

export const postPasswordResetToken = async (email: string) => {
    const user = await database('user')
        .where({ email })
        .first();
    if (!user) {
        return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await database('password_reset_token').insert({
        user_id: user.id,
        token,
        expires_at: expiresAt,
    });

    await sendPasswordResetEmail(email, token);
}

export const postResetPassword = async (token: string, newPassword: string) => {
    const record = await database('password_reset_token')
        .where({ token })
        .whereNull('used_at')
        .where('expires_at', '>', new Date())
        .first();

    if (!record) {
        throw new Error('Invalid or expired token');
    }

    const hash = encryptPassword(newPassword);

    await database('user')
        .where({ id: record.user_id })
        .update({ password: hash });
    await database('password_reset_token')
        .where({ id: record.id })
        .update({ used_at: new Date() });
}

export const putPassword = async (userId: number, currentPassword: string, newPassword: string) => {
    const user = await database('user')
        .where({ id: userId })
        .first();
    if (!user) {
        throw new Error('User not found');
    }

    const valid = encryptPassword(currentPassword) === user.password;
    if (!valid) {
        throw new Error('Incorrect password');
    }

    const hash = encryptPassword(newPassword);
    await database('user')
        .where({ id: userId })
        .update({ password: hash });
}
