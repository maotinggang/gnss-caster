const knex = require('knex');
let config = {
  client: 'mysql2',
  connection: {
    host: '47.92.151.105',
    user: 'root',
    password: 'nurlink',
    database: 'wudong'
  },
  pool: { min: 1, max: 10 }
};
if (process.env.MYSQL) config = JSON.parse(process.env.MYSQL);

module.exports = knex(config);
