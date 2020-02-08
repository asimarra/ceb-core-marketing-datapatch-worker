const mysql = require('../index');

const {
  DEBUG
} = process.env;

const getPeriodsToProcess = async (limit) => {
  let query = `
      select
          rqr.pk_license as pkLicense,
          rqr.ds_license_number as dsLicenseNumber,
          rqr.cd_state as cdState,
          rqr.id_profession as idProfession
        from tmp_datapatch_lcq tmp
      right join required_courses_report rqr
          on tmp.pk_license = rqr.pk_license
          inner join marketing_report mr
      on mr.pk_license = rqr.pk_license
      where tmp.pk_license is null
        and mr.dt_updated > rqr.dt_updated
      limit ${parseInt(limit)}
  `;
  let response = await mysql.query(query);
  return response;
};

const insert = async (data, table = 'tmp_datapatch_lcq') => {
  const [columns, values] = data.prepareData();

  if (DEBUG === '1') {
    console.log(`insert into ${table} (${columns.join(', ')}) values (${values.join(', ')}) \n`);
  }

  let response = await mysql.query(`insert into ${table} (${columns.join(', ')}) values (${values.join(', ')})`);
  return response;
};

const update = async (data, criteria, in_clause = false, table = 'required_courses_report') => {
  const values = data.prepareDataUpdate();
  const [column, value] = criteria.prepareData();

  if (DEBUG === '1') {
    console.log(`update ${table} set ${values} where ${column} ${in_clause ? `in (${value.join(',')})` : `= ${value}`}`);
  }

  let response = await mysql.query(`update ${table} set ${values} where ${column} ${in_clause ? `in (${value.join(',')})` : `= ${value}`}`);
  return response;
};

module.exports = {
  getPeriodsToProcess,
  insert,
  update
};
