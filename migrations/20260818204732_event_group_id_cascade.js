/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.alterTable('event', table => {
        table.dropForeign('group_id');
    });
    await knex.schema.alterTable('event', table => {
        table.foreign('group_id')
            .references('group.id')
            .onDelete('CASCADE');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.schema.alterTable('event', table => {
        table.dropForeign('group_id');
    });
    await knex.schema.alterTable('event', table => {
        table.foreign('group_id')
            .references('group.id');
    });
};
