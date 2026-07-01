exports.up = function(knex) {
    return knex.schema.alterTable('business', table => {
        table.unique('contact_email', {
            indexName: 'business_contact_email_unique_index',
            useConstraint: true,
        });
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('business', table => {
        table.dropUnique('contact_email', 'business_contact_email_unique_index');
    });
};
