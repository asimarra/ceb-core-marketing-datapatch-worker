'use strict';
/* istanbul ignore file */
const mysql = require('mysql');
let db = {};

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env;

db = {
  dbPool: null,
  _connection: null,
  getSettings: function () {
    const mysqlParams = {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_DATABASE
    };
    return mysqlParams;
  },
  connect: () => {
    return new Promise((resolve, reject) => {
      var dbSettings = db.getSettings();

      if (!db.dbPool) {
        db.dbPool = mysql.createPool(dbSettings);
      }

      db.dbPool.getConnection(function (err, connection) {
        if (err) {
          return reject(err);
        } else {
          db._connection = connection;
          return resolve(db._connection);
        }
      });
    });
  },
  query: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.connect().then(connection => {
        connection.query(query, params, function (err, reply) {
          connection.release();
          if (err) {
            return reject(err);
          } else {
            return resolve(reply);
          }
        });
      }).catch(error => {
        return reject(error);
      });
    });
  },
  cebTransactions: (dt_compliance_reached, pk_license) => {
    return new Promise((resolve, reject) => {
      db.connect().then(connection => {
        connection.beginTransaction(function (err) {
          if (err) {
            return reject(err);
          } else {
            const updateStatement = `
              update marketing_report
              set dt_compliance_reached = ${dt_compliance_reached}
              where pk_license = ${pk_license}`;
            connection.query(updateStatement, function (error, results, fields) {
              if (error) {
                return connection.rollback(function () {
                  connection.release();
                  return reject(error);
                });
              }

              const insertStatement = `
                insert into tmp_pklicense_dt_compliance_reached (
                  pk_license, new_dt_compliance_reached
                ) values (
                  ${pk_license}, ${dt_compliance_reached}
                )`;
              connection.query(insertStatement, function (error, results, fields) {
                if (error) {
                  return connection.rollback(function () {
                    connection.release();
                    return reject(error);
                  });
                }

                connection.commit(function (err) {
                  if (err) {
                    return connection.rollback(function () {
                      connection.release();
                      return reject(err);
                    });
                  }
                  connection.release();
                  return resolve('success');
                });
              });
            });
          }
        });
      }).catch(error => {
        db._connection.release();
        return reject(error);
      });
    });
  }
};

module.exports = {
  query: db.query,
  cebTransactions: db.cebTransactions
};
