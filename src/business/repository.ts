import knex from 'knex';

const connection = require('../knexfile')[process.env.NODE_ENV || 'development'];

const database = knex(connection);

export const getBusinessByEmail = async (contactEmail: string) => {
    const [business] = await database
        .table('business')
        .select('*')
        .where('contact_email', contactEmail);

    return business;
}

export const postBusiness = async (name: string, category: string, contactEmail: string, contactPhone: string | null, passwordHash: string) => {
    const [response] = await database
        .table('business')
        .insert({
            name,
            category,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            password_hash: passwordHash
        })
        .returning(['id', 'name', 'category', 'contact_email', 'contact_phone']);

    return response;
}
