const collection = require('lodash/collection');
// all system and prn
exports.sateAll = (system = ['gps', 'bds']) => {
  let ret = [];
  collection.forEach(system, value => {
    if (value == 'gps') {
      for (let i = 1; i < 33; i++) ret.push({ sys: value, prn: i });
    } else if (value == 'bds') {
      for (let i = 1; i < 31; i++) ret.push({ sys: value, prn: i });
    }
  });
  return ret;
};

exports.gnssAidType = {
  NUR_GNSS_AID_ALM_BDS_GPS: 0 /* ALM of Beidou + GPS */,
  NUR_GNSS_AID_ALM_BDS: 1 /* ALM of Beidou */,
  NUR_GNSS_AID_ALM_GPS: 2 /* ALM of GPS */,
  NUR_GNSS_AID_EPH_BDS_GPS: 3 /* EPH of Beidou + GPS */,
  NUR_GNSS_AID_EPH_BDS: 4 /* EPH of Beidou */,
  NUR_GNSS_AID_EPH_GPS: 5 /* EPH of GPS */,
  NUR_GNSS_AID_TYPE_MAX: 6
};

exports.system = ['gps', 'bds'];

exports.eph = {
  sysId: {
    gps: 0x20,
    bds: 0x21
  },
  sysIdRemove: {
    gpsrem: 'gps',
    bdsrem: 'bds'
  },
  expire: {
    gps: 2 * 60 * 60, // 2h
    bds: 2 * 60 * 60 // 2h
  },
  raw: {
    satelliteId: 0,
    weekNumber: 0,
    svAccuracy: 0,
    codeOnL2: 0,
    idot: 0,
    iode: 0,
    toc: 0,
    af2: 0,
    af1: 0,
    af0: 0,
    iodc: 0,
    crs: 0,
    deltaN: 0,
    m0: 0,
    cuc: 0,
    e: 0,
    cus: 0,
    sqrtA: 0,
    toe: 0,
    cic: 0,
    omega0: 0,
    cis: 0,
    i0: 0,
    crc: 0,
    w: 0,
    omegaDot: 0,
    tgd1: 0,
    tgd2: 0,
    svHealth: 0,
    l2PDataFlag: 0,
    fitInterval: 0
  }
};

exports.alm = {
  sysId: {
    gps: 0x30,
    bds: 0x31
  },
  expire: {
    gps: 90 * 24 * 60 * 60, // 90day
    bds: 90 * 24 * 60 * 60 // 90day
  },
  raw: {
    satelliteId: 0,
    af1: 0,
    af0: 0,
    m0: 0,
    e: 0,
    toa: 0,
    deltaI: 0,
    sqrtA: 0,
    omega0: 0,
    w: 0,
    omegaDot: 0,
    svHealth: 0
  }
};

exports.error = {
  sysId: {
    gps: 0x3c,
    bds: 0x3d
  },
  expire: {
    gps: 2 * 60 * 60, // 2h
    bds: 2 * 60 * 60 // 2h
  },
  ionUtc: {
    alpha0: 0,
    alpha1: 0,
    alpha2: 0,
    alpha3: 0,
    beta0: 0,
    beta1: 0,
    beta2: 0,
    beta3: 0,
    A0: 0,
    A1: 0,
    deltaTls: 0,
    tot: 0,
    wnt: 0,
    wnLsf: 0,
    dn: 0,
    deltaTLsf: 0
  }
};

exports.priority = {
  prn: 10, //support
  wgs84: 8,
  name: 2, //specific name
  zone: 1 // specific area code
};

exports.prioritySource = {
  rxnetwork: 5,
  station: 2
};

exports.frame = {
  almanac: {
    gps: {
      1: '5.1',
      2: '5.2',
      3: '5.3',
      4: '5.4',
      5: '5.5',
      6: '5.6',
      7: '5.7',
      8: '5.8',
      9: '5.9',
      10: '5.10',
      11: '5.11',
      12: '5.12',
      13: '5.13',
      14: '5.14',
      15: '5.15',
      16: '5.16',
      17: '5.17',
      18: '5.18',
      19: '5.19',
      20: '5.20',
      21: '5.21',
      22: '5.22',
      23: '5.23',
      24: '5.24',
      25: '4.2',
      26: '4.3',
      27: '4.4',
      28: '4.5',
      29: '4.7',
      30: '4.8',
      31: '4.9',
      32: '4.10'
    },
    bds: {
      1: '4.1',
      2: '4.2',
      3: '4.3',
      4: '4.4',
      5: '4.5',
      6: '4.6',
      7: '4.7',
      8: '4.8',
      9: '4.9',
      10: '4.10',
      11: '4.11',
      12: '4.12',
      13: '4.13',
      14: '4.14',
      15: '4.15',
      16: '4.16',
      17: '4.17',
      18: '4.18',
      19: '4.19',
      20: '4.20',
      21: '4.21',
      22: '4.22',
      23: '4.23',
      24: '4.24',
      25: '5.1',
      26: '5.2',
      27: '5.3',
      28: '5.4',
      29: '5.5',
      30: '5.6'
    }
  },
  health: {
    gps: ['4.25', '5.25'],
    bds: ['5.7', '5.8']
  },
  ephemeris: {
    gps: ['1.0', '2.0', '3.0'],
    bds1: ['1.0', '2.0', '3.0'],
    bds2: [
      '1.1',
      '1.2',
      '1.3',
      '1.4',
      '1.5',
      '1.6',
      '1.7',
      '1.8',
      '1.9',
      '1.10'
    ]
  },
  ionUtc: {
    gps: ['4.18'],
    bds1: ['1.0', '5.10'], // D1
    bds2: ['1.2', '5.102'] // D2
  }
};

exports.gpsTime = {
  gpsEpochSeconds: 315964800, // Unix timestamp of the GPS epoch 1980-01-06 00:00:00 UTC
  weekSeconds: 604800 // number of seconds in a week
};

exports.wgs84 = {
  sqrtMu: Math.sqrt(3.986005e14),
  omegaE: 7.2921151467e-5,
  wgs84a: 6378137.0, //椭球的长轴
  wgs84b: 6356752.3142, //椭球的短轴
  wgs84e: 0.08181919092890633 //椭球的第一偏心率
};

exports.cgcs2000 = {
  sqrtMu: Math.sqrt(3.986004418e14),
  omegaE: 7.292115e-5,
  a: 6378137.0, //椭球的长轴
  f: 3.3528106811823e3 // 扁率
};
