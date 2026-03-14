/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('group_user', table => {
        table.increments();
        table.integer('group_id').references('group.id');
        table.integer('user_id').references('user.id');
        table.unique(['group_id', 'user_id'], {
            indexName: 'group_user_composite_index',
            useConstraint: true,
        });
        table.integer('invite_status').references('invite_status.id').defaultTo(1);
        table.integer('role').references('role.id').defaultTo(1);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('group_user');
};
