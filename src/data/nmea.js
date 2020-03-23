const string = require('lodash/string');
const moment = require('moment');
const redis1 = require('../../lib/redis').redis1.duplicate();
const log = require('../../lib/log');
const { checkSum } = require('../../lib/utils');
/**
 * @description 解析标准NMEA数据或自定义NMEA数据，可能包含多个或多种类型数据
 * @param {String} data
 * @param {String} mount
 * @returns {Number} offset
 */
module.exports = ({ data, mount, offset, timestamp }) => {
  // find end and * flag, check sum
  let index = data.indexOf(Buffer.from([0x0d, 0x0a]), offset + 10);
  if (index < 0 || data[index - 3] != 0x2a) return offset + 2;
  if (
    !checkSum({
      data: data,
      start: offset + 1,
      end: index - 3,
      sum: Number.parseInt(`0x${data.toString('utf8', index - 2, index)}`)
    })
  )
    return index + 2;

  const temp = string.split(data.toString('utf8', offset, index - 3), ',');
  let res;
  switch (temp[0]) {
    case '$GNGGA':
    case '$GPGGA':
      res = {
        type: 'GNGGA',
        utc: temp[1],
        lat: temp[2],
        latDir: temp[3],
        lon: temp[4],
        lonDir: temp[5],
        GPSQual: temp[6],
        sats: temp[7],
        hdop: temp[8],
        alt: temp[9],
        aUnits: temp[10],
        undulation: temp[11],
        uUnits: temp[12],
        age: temp[13],
        stnID: temp[14]
      };
      break;
    case '$GNGSV':
    case '$GPGSV':
      res = {
        type: 'GNGSV',
        msgs: temp[1],
        msg: temp[2],
        sats: temp[3],
        prn1: temp[4],
        elev1: temp[5],
        azimuth1: temp[6],
        SNR1: temp[7],
        prn2: temp[8],
        elev2: temp[9],
        azimuth2: temp[10],
        SNR2: temp[11],
        prn3: temp[12],
        elev3: temp[13],
        azimuth3: temp[14],
        SNR3: temp[15],
        prn4: temp[16],
        elev4: temp[17],
        azimuth4: temp[18],
        SNR4: temp[19]
      };
      break;
    case '$GNRMC':
    case '$GPRMC':
      res = {
        type: 'GNRMC',
        utc: temp[1],
        posStatus: temp[2],
        lat: temp[3],
        latDir: temp[4],
        lon: temp[5],
        lonDir: temp[6],
        speedKn: temp[7],
        trackTrue: temp[8],
        date: temp[9],
        magVar: temp[10],
        varDir: temp[11],
        modeInd: temp[12]
      };
      break;
    case '$GNZDA':
    case '$GPZDA':
      res = {
        type: 'GNZDA',
        utc: temp[1],
        day: temp[2],
        month: temp[3],
        year: temp[4]
      };
      setTime({ data: res, timestamp: timestamp, mount: mount });
      break;
    default:
      log({
        type: 'warn',
        code: 'nmea.unsupport',
        call: 'caster.data.nmea',
        message: { mount: mount, type: temp[0] },
        save: false
      });
      break;
  }
  return index + 2;
};

/**
 * @description 时间信息更新
 * @param {Object} data
 * @param {String} timestamp // receive time
 * @param {String} mount
 */
const setTime = ({ data, timestamp, mount }) => {
  let time = moment(
    `${data.year}${data.month}${data.day}${data.utc}`,
    'YYYYMMDDHHmmss.SS'
  ).utc(true);
  redis1
    .pipeline()
    .hmset(
      `${mount}.time`,
      'update',
      timestamp,
      'time',
      time.valueOf(),
      'delay',
      moment().valueOf() - timestamp
    )
    .expire(`${mount}.time`, 1800)
    .exec();
};
