exports.up = function(knex) {
    return knex.schema.alterTable('business_invitation_recipient', function(table) {
        table.dropColumn('role_at_send');
    });
}

exports.down = function(knex) {
    return knex.schema.alterTable('business_invitation_recipient', function(table) {
        table.integer('role_at_send').references('id').inTable('role');
    });
}
