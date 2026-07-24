/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('rsvp_status').del();
  await knex('rsvp_status').insert([
    {description: 'pending'},
    {description: 'accepted'},
    {description: 'rejected'},
    {description: 'maybe'},
  ]);
};
