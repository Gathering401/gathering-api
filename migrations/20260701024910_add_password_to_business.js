exports.up = function(knex) {
    return knex.schema.alterTable('business', table => {
        table.string('password_hash').notNullable();
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('business', table => {
        table.dropColumn('password_hash');
    });
};