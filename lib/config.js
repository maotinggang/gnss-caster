/**
 * @description all configure parameter
 */
module.exports = {
  debug: process.env.NODE_ENV == 'production' ? false : true,
  id: require('./tools').serverUUID(),
  name: process.env.NAME || 'debug'
};
