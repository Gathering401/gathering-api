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
        table.date('birthdate');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('user');
};
