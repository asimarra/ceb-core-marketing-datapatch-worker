const path = require('path');
const BASE_PATH = path.join(__dirname, 'server', 'db');

const {
  ORACLE_CLIENT = 'oracledb',
  ORACLE_USER,
  ORACLE_PASSWORD,
  ORACLE_CONNECTION_STRING,
  ENV = 'development'
} = process.env;

const connectionData = {
  client: ORACLE_CLIENT,
  connection: {
    user: ORACLE_USER,
    password: ORACLE_PASSWORD,
    connectString: ORACLE_CONNECTION_STRING
  }
};

const testingData = {
  client: 'sqlite3',
  connection: {
    filename: './test.sqlite3'
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(BASE_PATH, 'migrations')
  },
  seeds: {
    directory: path.join(BASE_PATH, 'seeds')
  }
};

// We return sqlite connection data if the environment is test (from testing)
module.exports = ENV === 'test' ? testingData : connectionData;
