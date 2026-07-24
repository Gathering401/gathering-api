/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('user', table => {
        table.increments();
        table.string('first_name', 64);
        table.string('last_name', 64);
        table.string('email', 254);
        table.string('username', 50);
        table.string('password');
        table.string('phone', 15);
        table.date('birthdate');
        table.string('expo_push_token').nullable();
        table.string('zip_code').references('zip_code.zip_code');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('user');
};
