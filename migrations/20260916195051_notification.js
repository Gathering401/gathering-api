exports.up = function(knex) {
    return knex.schema
        .createTable('notification_type', (table) => {
            table.increments('id').primary();
            table.string('name').notNullable().unique();
        })
        .then(() => {
            return knex('notification_type').insert([
                { id: 1, name: 'new_event' },
                { id: 2, name: 'reminder' },
            ]);
        })
        .then(() => {
            return knex.schema.createTable('notification', (table) => {
                table.increments('id').primary();
                table.integer('user_id').unsigned().notNullable()
                    .references('id').inTable('user').onDelete('CASCADE');
                table.integer('type_id').unsigned().notNullable()
                    .references('id').inTable('notification_type');
                table.integer('event_id').unsigned().notNullable()
                    .references('id').inTable('event').onDelete('CASCADE');
                table.integer('group_id').unsigned().nullable()
                    .references('id').inTable('group').onDelete('CASCADE');
                table.timestamp('read_at').nullable();
                table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            });
        });
};

exports.down = function(knex) {
    return knex.schema
        .dropTableIfExists('notification')
        .then(() => knex.schema.dropTableIfExists('notification_type'));
};
