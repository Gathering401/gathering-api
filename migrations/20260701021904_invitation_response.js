exports.up = function(knex) {
    return knex.schema.createTable('invitation_response', table => {
        table.increments();
        table.string('description').notNullable();
    }).then(() => {
        return knex('invitation_response').insert([
            { id: 1, description: 'pending' },
            { id: 2, description: 'accepted' },
            { id: 3, description: 'declined' },
        ]);
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('invitation_response');
};
