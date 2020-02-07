const oracledb = require('oracledb');
const knex = require('./../helpers/oracle');
const libs = require('./../libs/utils');
const transcriptModel = require('../libs/transcript.js');

const {
  DEBUG
} = process.env;

const getCurrentPeriod = async (pkLicense) => {
  try {
    console.log('getCurrentPeriod');
    return await knex.executeProcedure('PKG_LICENSE_API.CURRENT_LICENSE_PERIOD', {
      ppk_license: pkLicense,
      pin_include_disciplinary: 0
    });
  } catch (error) {
    return error;
  }
};

const getTranscript = async (license, professionId, licensePeriodId) => {
  try {
    if (DEBUG === '1') {
      console.log('getTranscript', `{
        pds_license: ${license},
        pid_profession: ${professionId},
        pid_license_period: ${licensePeriodId},
        pid_user: 0,
        pcur_folder: 'HELPDESK'
      }`);
    }

    const result = await knex.executeProcedure(
      'PKG_LICENSEE_API.GET_TRANSCRIPT',
      {
        pds_license: license,
        pid_profession: professionId,
        pid_license_period: licensePeriodId,
        pid_user: 0,
        pcur_folder: 'HELPDESK'
      },
      {
        fetchInfo: {
          XML: {
            type: oracledb.STRING
          }
        }
      }
    );

    let xml = libs.getXmlFromOracle(result);
    return transcriptModel.transcriptXMLtoJS(xml);
  } catch (error) {
    return error;
  }
};

module.exports = {
  getTranscript,
  getCurrentPeriod
};
