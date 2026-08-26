exports.up = function(knex) {
    return knex.schema.createTable('refresh_token', table => {
        table.increments();
        table.integer('user_id').notNullable().references('id').inTable('user').onDelete('CASCADE');
        table.string('token_hash', 64).notNullable().unique();
        table.timestamp('expires_at').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('refresh_token');
};