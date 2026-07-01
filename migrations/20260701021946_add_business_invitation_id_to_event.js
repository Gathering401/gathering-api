exports.up = function(knex) {
    return knex.schema.alterTable('event', table => {
        table.bigint('business_invitation_id')
            .references('business_invitation.id')
            .onDelete('SET NULL')
            .nullable()
            .index();
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('event', table => {
        table.dropColumn('business_invitation_id');
    });
};
