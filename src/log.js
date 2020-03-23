const stringify = require('fast-json-stable-stringify');
const knex = require('./mysql');
const config = {
  debug: process.env.NODE_ENV == 'production' ? false : true,
  name: process.env.NAME || 'debug'
};
/**
 * @description debug时打印log到文件，保存log信息到数据库，时间由pm2和数据库自动生成
 * @param {String} name
 * @param {String} level error,warn,info,debug
 * @param {String} code
 * @param {String} call
 * @param {String,Object,Array} message
 * @param {Boolean} save 是否保存日志到数据库
 * @param {String} table
 *
 */
module.exports = ({
  name = config.name,
  level,
  code,
  call,
  message,
  table = 'logs',
  save = true
}) => {
  if (!code || !level || !call) return;
  if (message && Buffer.isBuffer(message)) message = message.toString('hex');
  const data = {
    name: name,
    level: level,
    code: code,
    call: call,
    ...(message ? { message: stringify(message) } : {})
  };
  if (config.debug) console.debug(stringify(data));
  if (save)
    knex(table)
      .insert(data)
      .catch(err => {
        console.error(`MySQL insert error: ${err.message}`);
      });
};
