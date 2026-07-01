exports.up = function(knex) {
    return knex.schema.createTable('business_invitation_recipient', table => {
        table.increments();
        table.bigint('business_invitation_id')
            .references('business_invitation.id')
            .onDelete('CASCADE');
        table.bigint('user_id')
            .references('user.id')
            .onDelete('CASCADE');
        table.bigint('group_id')
            .references('group.id')
            .onDelete('CASCADE');
        table.integer('role_at_send')
            .references('role.id');
        table.integer('response')
            .references('invitation_response.id')
            .defaultTo(1);
        table.timestamp('responded_at').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.unique(['business_invitation_id', 'user_id'], {
            indexName: 'business_invitation_recipient_composite_index',
            useConstraint: true,
        });
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('business_invitation_recipient');
};
