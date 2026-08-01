/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('business_payment_status', table => {
        table.increments();
        table.string('description').notNullable();
    }).then(() => {
        return knex('business_payment_status').insert([
            { id: 1, description: 'good_standing' },
            { id: 2, description: 'blocked' },
        ]);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('business_payment_status');
};
