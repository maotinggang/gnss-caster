const stringify = require('fast-json-stable-stringify');
const redis1 = require('../../lib/redis').redis1.duplicate();
const log = require('../../lib/log');
/**
 * @description 解析全部ublox数据
 * @param {Buffer} data
 * @param {String} mount
 * @returns {Number} offset
 */
module.exports = ({ data, offset, mount }) => {
  if (data[offset] != 0xb5 || data[offset + 1] != 0x62) return offset + 2;
  offset += 2;
  try {
    let classAndID = data.readUInt16BE(offset);
    offset += 2;
    let length = data.readUInt16LE(offset);
    offset += 2;
    if (
      checkSum(
        data[offset + length],
        data[offset + length + 1],
        data,
        offset - 4,
        offset + length
      )
    ) {
      let payload = Buffer.alloc(length);
      data.copy(payload, 0, offset, offset + length);
      payloadParse({
        type: classAndID,
        data: payload,
        length: length,
        mount: mount
      });
      return offset + length + 2;
    } else {
      log({
        type: 'warn',
        code: 'check.sum',
        call: 'caster.data.ublox',
        message: mount
      });
      return offset;
    }
  } catch (error) {
    log({
      type: 'warn',
      code: error.code || 'overflow',
      call: 'caster.data.ublox',
      message: { mount: mount, error: error.message }
    });
    return data.length;
  }
};

/**
 * @description 解析消息的payload
 * @param {Number} type class and ID
 * @param {Buffer} data payload
 * @param {Number} length data length
 */
const payloadParse = ({ type, data, length, mount }) => {
  let res;
  switch (type) {
    case 0x0213:
      res = ubloxSubFrame(data);
      if (res)
        redis1
          .pipeline()
          .hmset(
            `${mount}.frame.${res.gnssId}.${res.svId}`,
            `${res.subframeID}.${res.page}`,
            stringify({ words: res.words, tow: res.tow })
          )
          .expire(`${mount}.frame.${res.gnssId}.${res.svId}`, 1800)
          .exec();
      break;
    default:
      log({
        type: 'error',
        code: 'unsupport',
        call: 'caster.data.ublox.payloadParse',
        message: type,
        save: false
      });
      break;
  }
  return res;
};

/**
 * @description 处理gps原始数据帧，获取帧号，tow，page，减少数据量
 * @param {Buffer} dwrd raw words
 */
const wordsGps = dwrd => {
  let ret = {},
    word = 0,
    words = Buffer.alloc(10 * 3);
  //FIXME 无用数据去除，每4字节去除前2bits和后6bits
  for (let i = 0; i < 10; i++) {
    let temp = dwrd.readUInt32LE(i * 4);
    words.writeUIntBE((temp & 0x3fffffc0) >>> 6, i * 3, 3); //改为大端
  }
  ret.words = words;
  ret.gnssId = 'gps';
  word = dwrd.readUInt32LE(4); // word 2
  ret.subframeID = (word & 0x0700) >>> 8; //subframe
  ret.tow = ((word & 0x3fffe000) >>> 13) * 6; // tow
  if (ret.subframeID > 3) {
    word = dwrd.readUInt32LE(8); // word 3
    ret.dataID = (word & 0x30000000) >>> 28;
    ret.page = (word & 0x0fc00000) >>> 22; // TODO 相同page处理
    if (ret.page > 24) ret.page = gpsPageTable[`${ret.dataID}${ret.page}`]; // page 转换
    if (!ret.page) ret = null; // dummy SV or unsupport
  }
  return ret;
};

/**
 * @description 处理bds原始数据帧，获取帧号，tow，page，减少数据量
 * @param {Number} svId prn
 * @param {Buffer} dwrd raw words
 */
const wordsBds = (svId, dwrd) => {
  let ret = {},
    word = 0,
    words,
    wordNum = svId > 5 ? 10 : 5; //TODO 保存完整帧页
  // wordNum = 10;
  //FIXME 无用数据去除，每4字节去除前2bits和后8bits，3个字节前2bits无效
  words = Buffer.alloc(wordNum * 3);
  for (let i = 0; i < wordNum; i++) {
    let temp = dwrd.readUInt32LE(i * 4);
    words.writeUIntBE((temp & 0x3fffff00) >>> 8, i * 3, 3);
  }
  ret.words = words;
  ret.gnssId = 'bds';
  word = dwrd.readUInt32LE(0); // word 1
  ret.subframeID = (word & 0x7000) >>> 12; // subframe

  let sowMSB = (word & 0x0ff0) << 8; // sow
  word = dwrd.readUInt32LE(4); // word 2
  ret.tow = sowMSB | ((word & 0x3ffc0000) >>> 18); // tow
  // page
  if (svId < 6) {
    // GEO D2
    //TODO 暂只解析1、2、5帧
    if (ret.subframeID == 1 || ret.subframeID == 2) {
      ret.page = (word & 0x03c000) >>> 14;
    } else if (ret.subframeID == 5) {
      ret.page = (word & 0x01fc00) >>> 10;
    } else {
      return null;
    }
  } else {
    // MEO/IGSO D1
    if (ret.subframeID > 3) {
      ret.page = (word & 0x01fc00) >>> 10;
      if (ret.page == 0) return null;
    }
  }
  return ret;
};

/**
 * @description 解析原始帧数据
 * @param {Object} data
 */
const ubloxSubFrame = data => {
  let res = { type: 0x213, page: 0 };
  res.gnssId = data[0];
  res.svId = data[1];
  res.freqId = data[3];
  let wordNum = data[4];
  let dwrd = Buffer.alloc(wordNum * 4);
  data.copy(dwrd, 0, 8);
  let temp;
  switch (res.gnssId) {
    case 0: //GPS
      temp = wordsGps(dwrd);
      if (temp) Object.assign(res, temp);
      else res = null;
      break;
    case 3: //BDS
      temp = wordsBds(res.svId, dwrd);
      if (temp) Object.assign(res, temp);
      else res = null;
      break;
    default:
      res = null;
      break;
  }
  return res;
};

/**
 * @description 数据校验
 * @param {Byte} checkA
 * @param {Byte} checkB
 * @param {Buffer} data
 * @param {Number} start
 * @param {Number} length
 * @returns {Boolean} res
 */
const checkSum = (checkA, checkB, data, start, length) => {
  let ckA = 0x00,
    ckB = 0x00;
  for (i = start; i < length; i++) {
    ckA = ckA + data[i];
    ckB = ckB + ckA;
  }
  if (checkA == (ckA & 0xff) && checkB == (ckB & 0xff)) return true;
  else return false;
};

// data ID + SV ID:page
const gpsPageTable = {
  125: 2,
  126: 3,
  127: 4,
  128: 5,
  129: 7,
  130: 8,
  131: 9,
  132: 10,
  151: 25,
  152: 13,
  153: 14,
  154: 15,
  155: 17,
  156: 18,
  157: 1, //1,6,11,16,21
  158: 19,
  159: 20,
  160: 22,
  161: 23,
  162: 24, //12,24
  163: 25
};
