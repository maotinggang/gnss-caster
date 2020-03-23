const os = require('os');
const number = require('lodash/number');
const collection = require('lodash/collection');
const base64 = require('base64-js');
const { crc32 } = require('crc');

/**
 * @description 根据时间获取message sequence,second*1000+millisecond+random<65536
 * @returns {String}
 */
exports.getMsgSeq = () => {
  const now = new Date();
  return (
    now.getSeconds() * 1000 + now.getMilliseconds() + number.random(0, 5536)
  );
};
/**
 * @description 将度分形式转换成度
 * @param {Number} data
 * @returns {String}
 */
exports.deciToDegree = data => {
  let deci = data % 100;
  let degree = (data - deci) / 100;
  return (degree + deci / 60).toFixed(8);
};

/**
 * @description 输入gps week 与周内毫秒，返回utc时间
 * @param {Number} week
 * @param {Number} msweek ms of week
 */
const gpsStart = new Date('1980-01-06 00:00:00');
exports.gpstToUtc = (week, msWeek) => {
  let time = gpsStart;
  time.setDate(time.getDate() + week * 7);
  time.setMilliseconds(msWeek);
  return time;
};

/**
 * @description 获取服务器ID,用于区分服务器,platform,arch,hostname
 * @returns {String}
 */
exports.serverUUID = () => {
  return crc32(`${os.platform()}${os.arch()}${os.hostname()}`).toString(16);
};
/**
 * @description get token by timestamp+uuid+random, and base64
 * @param {String} uuid
 */
exports.token = uuid => {
  let buf = Buffer.alloc(12);
  buf.writeUIntBE(new Date().valueOf(), 0, 6);
  buf.writeUInt32BE(crc32(uuid), 6);
  buf.writeUInt16BE(number.random(0, 65535), 10);
  return base64.fromByteArray(buf);
};

/**
 * @description get buffer by array, max number 5 bytes
 * @param {Number} size
 * @param {Array} data
 * @returns {Bufferr}
 */
exports.arrayToBuffer = ({ size, data }) => {
  let buf = Buffer.alloc(size);
  let offset = 0;
  try {
    collection.forEach(data, value => {
      value.data &= 0xffffffff >>> (32 - value.bits);
      const residue = offset % 8;
      const bytes = Math.ceil((value.bits + residue) / 8);
      const offsetBytes = Math.floor(offset / 8);
      let lastByte = buf[offsetBytes] << ((bytes - 1) * 8);
      if (bytes == 5) {
        // FIXME bit or can not use
        let temp = value.data >>> (32 - (8 - residue));
        buf[offsetBytes] = lastByte | temp;
        temp = value.data << (8 - residue);
        if (temp > 0) buf.writeUInt32BE(temp, offsetBytes + 1);
        else buf.writeInt32BE(temp, offsetBytes + 1);
      } else {
        const temp =
          lastByte | (value.data << (bytes * 8 - value.bits - residue));
        if (temp > 0) buf.writeUIntBE(temp, offsetBytes, bytes);
        else buf.writeIntBE(temp, offsetBytes, bytes);
      }
      offset += value.bits;
    });
  } catch (error) {
    console.log(error);
  }
  return buf;
};
