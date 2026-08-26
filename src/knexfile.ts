// Update with your config settings.
require('dotenv').config();
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export const development = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    database: process.env.DB_NAME || 'gathering',
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD)
  }
}

export const production = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  }
}
