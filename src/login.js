const knexGeneral = require('../lib/knexGeneral');
const string = require('lodash/string');
const log = require('../lib/log');
/**
 *@description NTRIP login, 
 TCP Server use register code 'SOURCE mount password' to simulate NTRIP Server
 *@param {Buffer} data
 */
module.exports = async data => {
  let temp = string.split(data.toString(), '\n', 1);
  temp = string.split(string.trim(temp[0]), ' ');
  if (temp[0] != 'SOURCE' || !temp[1] || !temp[2]) {
    log({
      code: 'lack.data',
      call: 'caster.login',
      message: {
        mount: temp[2],
        password: temp[1]
      },
      type: 'access'
    });
    return { error: 'ERROR - Bad Password\r\n' };
  }
  const ret = await knexGeneral.select({
    table: 'reference_station',
    field: ['protocol'],
    condition: { mount: temp[2], password: temp[1] }
  });
  if (ret && ret[0]) {
    log({
      code: 'login.success',
      call: 'caster.login',
      message: temp[2],
      type: 'access'
    });
    return { error: null, protocol: ret[0].protocol, mount: temp[2] };
  } else {
    log({
      code: 'login.failure',
      call: 'caster.login',
      message: { mount: temp[2], password: temp[1] },
      type: 'access'
    });
    return { error: 'ERROR - Bad Password\r\n' };
  }
};
