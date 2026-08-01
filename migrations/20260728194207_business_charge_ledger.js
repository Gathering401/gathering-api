/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('business_charge_ledger', table => {
        table.increments();
        table.bigint('business_id')
            .references('business.id')
            .onDelete('CASCADE');
        table.bigint('business_invitation_id')
            .references('business_invitation.id')
            .onDelete('CASCADE');
        table.bigint('event_id')
            .references('event.id')
            .onDelete('CASCADE');
        table.integer('rsvp_count').notNullable();
        table.decimal('unit_price', 10, 2).notNullable();
        table.decimal('amount', 10, 2).notNullable();
        table.bigint('invoice_id')
            .references('business_invoice.id')
            .onDelete('SET NULL')
            .nullable();
        table.unique(['event_id'], {
            indexName: 'business_charge_ledger_event_id_unique',
            useConstraint: true,
        });
        table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('business_charge_ledger');
};
