/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('event', table => {
        table.increments();
        table.string('name', 50);
        table.string('description', 500);
        table.string('location', 100);
        table.timestamp('date');
        table.decimal('cost', 2);
        table.bigint('group_id').references('group.id');
        table.bigint('host_id').references('user.id');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('event');
};
