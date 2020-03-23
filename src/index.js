const net = require('net');
const login = require('./login');
const log = require('../lib/log');
const message = require('./message');

const config = {
  ...require('../lib/config'),
  ...{
    timeout: process.env.TIMEOUT ? Number.parseInt(process.env.TIMEOUT) : 70,
    port: process.env.PORT ? process.env.PORT : 8009
  }
};

const server = net.createServer(socket => {
  let mount, protocol;
  let msg;
  socket.on('data', data => {
    // avoid one message split
    if (msg) msg = Buffer.concat([msg, data]);
    else msg = data;
    setTimeout(async () => {
      if (msg && msg.length > 2048) msg = null; // avoid too large data
      const temp = msg;
      msg = null;
      if (!mount && temp) {
        // login
        const ret = await login(temp);
        if (ret.error) {
          socket.end('ERROR - Bad Password\r\n'); //close
          return;
        } else {
          mount = ret.mount;
          protocol = ret.protocol;
          socket.write('ICY 200 OK\r\n');
        }
      } else {
        // process
        if (temp && mount) {
          message({
            timestamp: new Date().getTime(),
            protocol: protocol,
            mount: mount,
            data: temp
          });
        }
      }
    }, 50);
  });

  socket.on('error', err => {
    log({
      code: err.code || 'socket',
      call: 'caster.error',
      message: {
        mount: mount ? mount : socket.remoteAddress,
        error: err.message
      },
      type: 'warn'
    });
  });
  //连接断开
  socket.on('close', err => {
    log({
      code: 'close',
      call: 'caster.close',
      message: {
        mount: mount ? mount : socket.remoteAddress,
        error: err
      },
      type: 'warn'
    });
    // 更新设备状态
  });
  //连接超时
  socket.setTimeout(config.timeout * 1000, () => {
    log({
      code: 'timeout',
      call: 'caster.timeout',
      message: mount ? mount : socket.remoteAddress,
      type: 'warn'
    });
    socket.destroy();
  });
});

server.on('error', err => {
  log({
    code: err.code || 'server',
    call: 'caster.server.error',
    message: err.message,
    type: 'error'
  });
});
server.on('connection', socket => {
  if (config.debug)
    log({
      code: 'connect',
      call: 'caster.server.connection',
      message: socket.remoteAddress,
      type: 'debug'
    });
});
server.listen(config.port, () => {
  log({
    code: 'server.start',
    call: 'caster.server.listen',
    message: JSON.stringify(config),
    type: 'info'
  });
  console.log(
    `Caster Server '${config.name}-${config.id}' Start, Port: ${config.port}`
  );
});
