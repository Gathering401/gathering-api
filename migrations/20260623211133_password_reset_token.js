/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('password_reset_token', table => {
        table.increments();
        table.integer('user_id').notNullable().references('id').inTable('user').onDelete('CASCADE');
        table.text('token').notNullable().unique();
        table.timestamp('expires_at', { useTz: true }).notNullable();
        table.timestamp('used_at', { useTz: true }).nullable();
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('password_reset_token');
};