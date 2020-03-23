const stringify = require('fast-json-stable-stringify');
const knex = require('./mysql');
const config = require('./config');

/**
 * @description debug时打印log到文件，保存log信息到数据库，时间由pm2和数据库自动生成
 * @param {String} id
 * @param {String} type error,warn,info,access,debug
 * @param {String} code
 * @param {String} call
 * @param {String,Object,Array} message
 * @param {Boolean} save 是否保存日志到数据库
 * @param {String} table
 *
 */
module.exports = ({
  id = config.name,
  type,
  code,
  call,
  message,
  table = 'log_gnss',
  save = true
}) => {
  if (!code || !type || !call) return;
  if (message && Buffer.isBuffer(message)) message = message.toString('hex');
  const data = {
    id: id,
    type: type,
    code: code,
    call: call,
    ...(message ? { message: stringify(message) } : {})
  };
  if (config.debug) {
    if (type == 'error' || type == 'warn') console.error(stringify(data));
    else console.log(stringify(data));
  }
  if (!save) return;
  knex(table)
    .insert(data)
    .catch(err => {
      console.error(`MySQL insert error: ${err.message}`);
    });
};
