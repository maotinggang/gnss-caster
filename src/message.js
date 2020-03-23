const log = require('../lib/log');
const ublox = require('./data/ublox');
const nmea = require('./data/nmea');
const rtcm = require('./data/rtcm');
const heart = require('./data/heart');
/**
 * @description 参考站混合数据解析
 * @param {Number} timestamp
 * @param {String} protocol
 * @param {String} mount
 * @param {Buffer} data
 */
module.exports = ({ timestamp, protocol, mount, data }) => {
  let offset = 0;
  do {
    // not processing if not find preamble
    if (data[0] == 0xd3) {
      offset = rtcm({ data, offset, mount, timestamp }); // RTCM
    } else if (data[0] == 0x24 && data[1] == 0x47) {
      offset = nmea({ data, offset, mount, timestamp }); // NMEA
    } else if (data[0] == 0x40 && data[1] == 0x26) {
      offset = heart({ data, offset, mount, timestamp }); // heart
    } else {
      // custom
      if (protocol == 'ublox') {
        offset = ublox({ data, offset, mount, timestamp });
      } else {
        log({
          code: 'unsupport.protocol',
          call: 'caster.message',
          message: { protocol: protocol, mount: mount },
          type: 'warn'
        });
        break;
      }
    }
  } while (offset + 7 < data.length);
};
