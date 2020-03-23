const ioredis = require('ioredis');
let config = {
  host: '47.92.151.105',
  // host: 'localhost',
  port: 6380,
  password: '12345678',
  db: 3
};
if (process.env.REDIS) config = JSON.parse(process.env.REDIS);

exports.redis0 = new ioredis(config);
config.db = 4;
exports.redis1 = new ioredis(config);
config.db = 5;
exports.redis2 = new ioredis(config);
