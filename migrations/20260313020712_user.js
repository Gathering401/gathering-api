/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('user', table => {
        table.increments();
        table.string('first_name', 25);
        table.string('last_name', 25);
        table.string('email', 60);
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
