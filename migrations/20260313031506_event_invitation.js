/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('event_invitation', table => {
        table.increments();
        table.integer('event_id').references('event.id');
        table.integer('user_id').references('user.id');
        table.unique(['event_id', 'user_id'], {
            indexName: 'event_invitation_composite_index',
            useConstraint: true,
        });
        table.integer('rsvp_status').references('rsvp_status.id').defaultTo(1);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('event_invitation');
};
