/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  await knex('invite_status').insert([
    {description: 'pending'},
    {description: 'accepted'},
    {description: 'rejected_by_group'},
    {description: 'rejected_by_user'},
  ]);
};
