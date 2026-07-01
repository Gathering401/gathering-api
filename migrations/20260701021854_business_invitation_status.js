exports.up = function(knex) {
    return knex.schema.createTable('business_invitation_status', table => {
        table.increments();
        table.string('description').notNullable();
    }).then(() => {
        return knex('business_invitation_status').insert([
            { id: 1, description: 'draft' },
            { id: 2, description: 'active' },
            { id: 3, description: 'completed' },
            { id: 4, description: 'cancelled' },
        ]);
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('business_invitation_status');
};
