exports.up = function(knex) {
    return knex.schema.alterTable('business_invitation', table => {
        table.integer('group_size_max').nullable().alter();
    });
}

exports.down = function(knex) {
    return knex.schema.alterTable('business_invitation', table => {
        table.integer('group_size_max').notNullable().alter();
    });
}
