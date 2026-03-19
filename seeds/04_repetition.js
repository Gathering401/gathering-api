/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('rsvp_status').insert([
    {description: 'none'},
    {description: 'annually'},
    {description: 'monthly'},
    {description: 'weekly'},
  ]);
};
