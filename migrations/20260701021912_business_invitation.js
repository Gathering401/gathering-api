exports.up = function(knex) {
    return knex.schema.createTable('business_invitation', table => {
        table.increments();
        table.bigint('business_id')
            .references('business.id')
            .onDelete('CASCADE');
        table.string('name', 100).notNullable();
        table.text('description').notNullable();
        table.integer('status')
            .references('business_invitation_status.id')
            .defaultTo(1);
        table.integer('group_size_min').notNullable();
        table.integer('group_size_max').nullable();
        table.integer('location_radius_miles').nullable();
        table.decimal('location_lat', 9, 6).notNullable();
        table.decimal('location_lng', 9, 6).notNullable();
        table.string('location_address').notNullable();
        table.date('date_start').nullable();
        table.date('date_end').nullable();
        table.jsonb('days_of_week').nullable();
        table.jsonb('keywords').nullable();
        table.string('group_type_signal').nullable();
        table.timestamps(true, true);
    });
}

exports.down = function(knex) {
    return knex.schema.dropTable('business_invitation');
}
