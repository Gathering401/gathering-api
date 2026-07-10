/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('repetition').insert([
    {description: 'none'},
    {description: 'annually'},
    {description: 'monthly'},
    {description: 'weekly'},
  ]);
};
