/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable('business', table => {
        table.string('stripe_customer_id').nullable();
        table.integer('payment_status')
            .references('business_payment_status.id')
            .defaultTo(1);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.alterTable('business', table => {
        table.dropColumn('stripe_customer_id');
        table.dropColumn('payment_status');
    });
};
