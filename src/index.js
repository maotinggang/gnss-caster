const net = require('net');
const login = require('./login');
const log = require('./log');
const redis0 = require('./redis').redis0;

const config = {
  debug: process.env.NODE_ENV == 'production' ? false : true,
  name: process.env.NAME || 'debug',
  timeout: process.env.TIMEOUT ? Number.parseInt(process.env.TIMEOUT) : 70,
  port: process.env.PORT ? process.env.PORT : 9009
};

const server = net.createServer(socket => {
  let id, type, msg, duplicate;
  socket.on('data', data => {
    // avoid one message split
    if (msg) msg = Buffer.concat([msg, data]);
    else msg = data;
    setTimeout(async () => {
      // avoid null and too large data
      if (!msg || msg.length > 8192) {
        msg = null;
        return;
      }
      if (id) {
        if (type == 'server') {
          duplicate.publishBuffer(`source.${id}`, msg);
        }
      } else {
        const ret = await login(msg);
        msg = null;
        if (ret.error) {
          socket.end('ERROR - Bad Password\r\n');
        } else {
          id = ret.id;
          type = ret.type;
          socket.write('ICY 200 OK\r\n');
          duplicate = redis0.duplicate();
          // client subscribe
          if (type == 'client') {
            duplicate.subscribe(`source.${ret.mount}`, err => {
              if (err) {
                log({
                  level: 'error',
                  code: 'subscribe.failure',
                  call: 'caster',
                  message: err.message
                });
                socket.destroy();
              } else {
                duplicate.on('messageBuffer', (channel, message) => {
                  socket.write(message, err => {
                    if (err) {
                      log({
                        level: 'warn',
                        code: 'send.failure',
                        call: 'caster',
                        message: err.message
                      });
                      socket.destroy();
                    }
                  });
                });
              }
            });
          }
        }
      }
      msg = null;
    }, 100);
  });

  socket.on('error', err => {
    log({
      code: 'socket',
      call: 'caster.error',
      message: {
        id: id ? id : socket.remoteAddress,
        error: err.message
      },
      level: 'warn'
    });
  });
  //连接断开
  socket.on('close', err => {
    if (duplicate) duplicate.quit();
    log({
      code: 'close',
      call: 'caster.close',
      message: {
        id: id ? id : socket.remoteAddress,
        error: err
      },
      level: 'warn'
    });
    // 更新设备状态
  });
  //连接超时
  socket.setTimeout(config.timeout * 1000, () => {
    log({
      code: 'timeout',
      call: 'caster.timeout',
      message: id ? id : socket.remoteAddress,
      level: 'warn'
    });
    socket.destroy();
  });
});

server.on('error', err => {
  log({
    code: err.code || 'server',
    call: 'caster.server.error',
    message: err.message,
    level: 'error'
  });
});
server.on('connection', socket => {
  if (config.debug)
    log({
      code: 'connect',
      call: 'caster.server.connection',
      message: socket.remoteAddress,
      level: 'debug'
    });
});
server.listen(config.port, () => {
  log({
    code: 'server.start',
    call: 'caster.server.listen',
    message: JSON.stringify(config),
    level: 'info'
  });
});
