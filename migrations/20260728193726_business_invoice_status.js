/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('business_invoice_status', table => {
        table.increments();
        table.string('description').notNullable();
    }).then(() => {
        return knex('business_invoice_status').insert([
            { id: 1, description: 'open' },
            { id: 2, description: 'paid' },
            { id: 3, description: 'uncollectible' },
            { id: 4, description: 'void' },
        ]);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('business_invoice_status');
};
