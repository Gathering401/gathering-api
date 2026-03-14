// Update with your config settings.
require('dotenv').config();
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export const development = {
  client: 'pg',
  connection: {
    database: 'gathering',
    user: 'postgres',
    password: process.env.DB_PASSWORD!.toString(),
  }
}

export const production = {
  client: 'postgresql',
  connection: {
    database: 'my_db',
    user:     'username',
    password: 'password'
  }
}
