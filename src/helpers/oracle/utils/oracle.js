const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OBJECT;

module.exports = knex => {
  function buildParameters(parameters) {
    const bindVariables = [];
    const newParameters = {};
    Object.keys(parameters).forEach(k => {
      if (parameters[k] === undefined) {
        return;
      }
      bindVariables.push(`${k} => :${k}`);
      if (k === 'creturn') {
        newParameters[k] = { type: oracledb.CURSOR, dir: oracledb.BIND_OUT };
      } else if (Array.isArray(parameters[k])) {
        newParameters[k] = {
          type: oracledb.NUMBER,
          dir: oracledb.BIND_IN,
          val: parameters[k]
        };
      } else if (
        parameters[k] &&
        parameters[k].constructor === Object &&
        parameters[k].dir === 'out'
      ) {
        newParameters[k] = { dir: oracledb.BIND_OUT };
      } else {
        newParameters[k] = parameters[k];
      }
    });
    return {
      parameters: newParameters,
      bindVariables: bindVariables.join(', ')
    };
  }

  function receiveStream(stream) {
    return new Promise((resolve, reject) => {
      const collect = [];
      stream.on('data', data => {
        collect.push(data);
      });

      stream.on('error', error => {
        reject(error);
      });

      stream.on('end', () => {
        resolve(collect);
      });
    });
  }

  const executeProcedure = async (procedureName, params = {}, options = {}) => {
    params = { ...params, creturn: '' };
    const connection = await knex.client.acquireConnection();
    try {
      const { parameters, bindVariables } = buildParameters(params);
      const result = await connection.execute(
        `BEGIN ${procedureName}(${bindVariables}); END;`,
        parameters,
        options
      );
      const { creturn } = result.outBinds;
      return await receiveStream(creturn.toQueryStream());
    } catch (error) {
      throw error;
    } finally {
      try {
        await knex.client.releaseConnection(connection);
      } catch (error) {
        //
      }
    }
  };

  const executeFunction = async (
    functionName,
    params = {},
    outMaxSize = 4000
  ) => {
    const connection = await knex.client.acquireConnection();
    try {
      const { parameters, bindVariables } = buildParameters(params);
      parameters.return = {
        dir: oracledb.BIND_OUT,
        type: oracledb.STRING,
        maxSize: outMaxSize
      };
      const result = await connection.execute(
        `BEGIN :return := ${functionName}(${bindVariables}); END;`,
        parameters
      );
      return result.outBinds.return;
    } catch (error) {
      console.error(error);
      throw error.stack;
    } finally {
      try {
        await knex.client.releaseConnection(connection);
      } catch (error) {
        //
      }
    }
  };

  const executeFunctionTrx = async (
    functionName,
    params = {},
    outMaxSize = 4000,
    trx
  ) => {
    const connection = await knex.client.acquireConnection();
    try {
      const { parameters, bindVariables } = buildParameters(params);
      parameters.return = {
        dir: oracledb.BIND_OUT,
        type: oracledb.STRING,
        maxSize: outMaxSize
      };
      let result = knex.raw(
        `SELECT ${functionName}(${bindVariables}) AS RESULT FROM DUAL`,
        parameters
      );
      if (trx) {
        result = result.transacting(trx);
      }
      result = await result;
      return result[0].RESULT;
    } catch (error) {
      console.error(error);
      throw error.stack;
    } finally {
      try {
        await knex.client.releaseConnection(connection);
      } catch (error) {
        //
      }
    }
  };

  const executeNonQuery = async (procedureName, params = {}) => {
    const connection = await knex.client.acquireConnection();
    try {
      const { parameters, bindVariables } = buildParameters(params);
      const result = await connection.execute(
        `BEGIN ${procedureName}(${bindVariables}); END;`,
        parameters
      );
      const out = {};
      for (var p in params) {
        if (params[p] && params[p].dir === 'out') {
          out[p] = result.outBinds[p];
        }
      }
      return out;
    } catch (error) {
      throw error;
    } finally {
      try {
        await knex.client.releaseConnection(connection);
      } catch (error) {
        //
      }
    }
  };

  const executeNonQueryTrx = async (procedureName, params = {}, trx) => {
    try {
      const { parameters, bindVariables } = buildParameters(params);
      let result = knex.raw(
        `BEGIN ${procedureName}(${bindVariables}); END;`,
        parameters
      );
      if (trx) {
        result = result.transacting(trx);
      }
      result = await result;
      return result;
    } catch (error) {
      throw error.stack;
    }
  };

  return {
    buildParameters,
    receiveStream,
    executeProcedure,
    executeNonQuery,
    executeFunction,
    executeFunctionTrx,
    executeNonQueryTrx
  };
};
