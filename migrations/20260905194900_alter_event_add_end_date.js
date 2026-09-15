exports.up = function (knex) {
    return knex.schema.alterTable('event', (table) => {
        table.timestamp('end_date').nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('event', (table) => {
        table.dropColumn('end_date');
    });
};