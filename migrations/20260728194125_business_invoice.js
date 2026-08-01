/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('business_invoice', table => {
        table.increments();
        table.bigint('business_id')
            .references('business.id')
            .onDelete('CASCADE');
        table.string('stripe_invoice_id').notNullable();
        table.decimal('amount', 10, 2).notNullable();
        table.integer('status')
            .references('business_invoice_status.id')
            .defaultTo(1);
        table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('business_invoice');
};
