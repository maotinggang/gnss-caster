const knex = require('./mysql');
const base64js = require('base64-js');
const string = require('lodash/string');
const log = require('./log');
/**
 *@description NTRIP login, 
 TCP Server use register code 'SOURCE mount password' to simulate NTRIP Server
 *@param {Buffer} data
 */
module.exports = async data => {
  let temp = string.split(data.toString(), '\r\n');
  if (!temp[0]) {
    log({
      code: 'null.data',
      call: 'caster.login',
      level: 'info'
    });
    return { error: 'ERROR - Bad Password\r\n' };
  }
  temp = string.split(string.trim(temp[0]), ' ');
  let id, password, mount;
  let type;
  if (temp[0] == 'SOURCE' && temp[1] && temp[2]) {
    type = 'server';
    password = temp[1];
    id = string.trim(temp[2], '/');
  } else if (temp[0] == 'GET' && temp[1] && temp[2] && tepm[4]) {
    type = 'client';
    mount = string.trim(temp[1], '/');
    const pwdStrings = string.split(temp[4], ' ');
    if (pwdStrings[2]) {
      const userPwd = base64js.toByteArray(pwdStrings[2]).toString();
      const userPwds = string.split(userPwd, ':');
      id = userPwds[0];
      password = userPwds[1];
    }
  } else {
    log({
      code: 'lack.data',
      call: 'caster.login',
      level: 'info',
      message: data
    });
    return { error: 'ERROR - Bad Password\r\n' };
  }

  let ret;
  if (type == 'server') {
    //验证挂载点和密码
    try {
      ret = await knex('device_info')
        .select()
        .where({ id, password });
    } catch (error) {
      log({
        code: 'mysql',
        call: 'caster.login',
        message: error.message,
        level: 'error'
      });
    }
  } else {
    // 验证用户名,密码,挂载点
    try {
      ret = await knex('users')
        .select()
        .where({ id, password });
      if (ret[0]) {
        ret = await knex('device_info')
          .select()
          .where({ id: mount });
      }
    } catch (error) {
      log({
        code: 'mysql',
        call: 'caster.login',
        message: error.message,
        level: 'error'
      });
    }
  }

  if (ret[0]) {
    log({
      code: 'login.success',
      call: 'caster.login',
      message: { id, type, ...(mount ? { mount } : {}) },
      level: 'info'
    });
    return { id, type, mount };
  } else {
    log({
      code: 'login.failure',
      call: 'caster.login',
      message: data,
      level: 'warn'
    });
    return { error: 'ERROR - Bad Password\r\n' };
  }
};
