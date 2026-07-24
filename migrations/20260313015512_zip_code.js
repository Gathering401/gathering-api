/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('zip_code', table => {
        table.string('zip_code', 10).primary();
        table.decimal('latitude', 9, 6).notNullable();
        table.decimal('longitude', 9, 6).notNullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('zip_code');
};
