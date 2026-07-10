exports.up = function(knex) {
    return knex.schema.alterTable('business_invitation_recipient', table => {
        table.boolean('as_push_notification');
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('business_invitation_recipient', table => {
        table.dropColumn('as_push_notification');
    });
};
