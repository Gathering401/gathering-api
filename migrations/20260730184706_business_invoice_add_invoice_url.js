exports.up = (knex) => {
    return knex.schema.alterTable('business_invoice', (table) => {
        table.string('hosted_invoice_url').nullable();
    });
};

exports.down = (knex) => {
    return knex.schema.alterTable('business_invoice', (table) => {
        table.dropColumn('hosted_invoice_url');
    });
};
