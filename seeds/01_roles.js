/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('role').del();
  await knex('role').insert([
    {description: 'member'},
    {description: 'creator'},
    {description: 'admin'},
    {description: 'owner'},
  ]);
};
