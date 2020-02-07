require('dotenv').config();

function validateCredentials() {
  const {
    /* The Oracle connection variables. */
    ORACLE_USER,
    ORACLE_PASSWORD,
    ORACLE_CONNECTION_STRING,
    /* The MySQL connection variables */
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_DATABASE
  } = process.env;

  // Verify if the oracle connection variables exists.
  if (!ORACLE_USER || !ORACLE_PASSWORD || !ORACLE_CONNECTION_STRING) {
    throw new Error('Missing Oracle credentials!');
  }

  // Verify if the mysql connection variables exists.
  if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_DATABASE) {
    throw new Error('Missing MySQL credentials!');
  }
}

(() => {
  try {
    // validating the credentials
    validateCredentials();

    const worker = require('./src/worker');
    worker.start();

    process.on('SIGINT', async () => {
      process.exit();
    });
  } catch (error) {
    console.log(error);
    process.exit();
  }
})();
