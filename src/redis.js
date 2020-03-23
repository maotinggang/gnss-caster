const ioredis = require('ioredis');
let config = {
  host: '47.92.151.105',
  // host: 'localhost',
  port: 6380,
  password: '12345678',
  db: 3
};
if (process.env.REDIS) config = JSON.parse(process.env.REDIS);

config.db = 0;
exports.redis0 = new ioredis(config);
config.db = 1;
exports.redis1 = new ioredis(config);
