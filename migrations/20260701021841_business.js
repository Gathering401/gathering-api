exports.up = function(knex) {
    return knex.schema.createTable('business', table => {
        table.increments();
        table.string('name').notNullable();
        table.string('category', 20).notNullable();
        table.string('contact_email').notNullable();
        table.string('contact_phone').nullable();
        table.decimal('average_cost', 10, 2).notNullable();
        table.timestamps(true, true);
    });
}

exports.down = function(knex) {
    return knex.schema.dropTable('business');
}
