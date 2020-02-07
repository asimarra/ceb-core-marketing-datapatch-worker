const config = require('./knexfile.js');
const knex = require('knex')(config);

if (config.client === 'oracledb') {
  const { oracleHelper } = require('./utils');
  const {
    executeProcedure,
    executeFunction,
    executeFunctionTrx,
    executeNonQuery,
    executeNonQueryTrx
  } = oracleHelper(knex);

  knex.executeProcedure = executeProcedure;
  knex.executeFunction = executeFunction;
  knex.executeFunctionTrx = executeFunctionTrx;
  knex.executeNonQuery = executeNonQuery;
  knex.executeNonQueryTrx = executeNonQueryTrx;
} else if (config.client === 'sqlite3') {
  knex.executeProcedure = async () => { };
  knex.executeFunction = async () => { };
  knex.executeNonQuery = async () => { };
  knex.executeNonQueryTrx = async () => { };
}

module.exports = knex;
