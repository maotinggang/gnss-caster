const VERSION = 'v1';
const base = ({ name, script, instances, exec_mode }) => {
  name = VERSION ? `${VERSION}_${name}` : name;
  return {
    name: name,
    script: script,
    node_args: '--max_semi_space_size=64 --max-old-space-size=4096',
    restart_delay: 3000,
    kill_timeout: 3000,
    instances: instances,
    exec_mode: exec_mode,
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules'],
    max_memory_restart: '200M',
    error_file: `./logs/${name}/error.log`,
    out_file: `./logs/${name}/out.log`,
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    env: {
      NODE_ENV: 'development',
      NAME: `${name}_dev`
    },
    env_production: {
      NODE_ENV: 'production',
      NAME: name,
      // mysql
      MYSQL: JSON.stringify({
        client: 'mysql2',
        connection: {
          host: '127.0.0.1',
          user: 'agnss',
          password: 'agnss',
          database: 'agnss'
        },
        pool: { min: 1, max: 10 }
      }),
      // redis
      REDIS: JSON.stringify({
        host: '127.0.0.1',
        port: 6380,
        password: '12345678',
        db: 0
      })
    }
  };
};

const config = ({ name, script, instances = 1, exec_mode = 'fork', data }) => {
  let config = base({ name, script, instances, exec_mode });
  for (const key in data) {
    if (data.hasOwnProperty(key))
      config.env_production[key.toUpperCase()] = data[key];
  }
  return config;
};

module.exports = {
  apps: [
    config({
      name: 'station',
      script: 'station',
      data: {
        port: 8009,
        timeout: 70
      }
    }),
    config({
      name: 'station',
      script: 'station',
      data: {
        port: 8009,
        timeout: 70
      }
    })
  ]
};
