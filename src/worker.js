'use strict';
require('./libs/Object.prototype.prepareData');
require('./libs/Object.prototype.prepareDataUpdate');

const moment = require('moment-timezone');
const BIdatabase = require('./helpers/mysql/transactions');
const repository = require('./repositories/worker');

const {
  LIMIT_DATA,
  DEBUG
} = process.env;

const self = {
  start: async () => {
    let delay = 30 * 1000;

    const licenses = await BIdatabase.getPeriodsToProcess(LIMIT_DATA);
    if (licenses && licenses.length) {
      await self.processLicenses(licenses);
      delay = 10;
    }

    setTimeout(() => self.start(), delay);
  },
  processLicenses: async licenses => {
    if (DEBUG === '1') { console.log(`I'll to process ${licenses.length} licenses`); }
    for (let license of licenses) {
      let { pkLicense, dsLicenseNumber, idProfession, cdState } = license;
      let ds_license = `${cdState}_${dsLicenseNumber}`;

      let currentPeriod = await repository.getCurrentPeriod(pkLicense);

      if (currentPeriod.length > 0) {
        let idLicensePeriod = currentPeriod[0].ID_LICENSE_PERIOD;
        let getTranscript = await repository.getTranscript(ds_license, idProfession, idLicensePeriod);

        await self.processTranscript(getTranscript, idLicensePeriod, pkLicense);

        await BIdatabase.insert({
          pk_license: pkLicense,
          ds_license_number: dsLicenseNumber,
          cd_state: cdState,
          id_profession: idProfession
        });
      }
    }
    if (DEBUG === '1') { console.log(`End to process ${licenses.length} licenses`); }
  },
  processTranscript: async (transcript, idLicensePeriod, pkLicense) => {
    const transcript_to_update = {
      dt_updated: moment().format(),
      id_subject_area_master: [],
      nm_subject_area_master: [],
      id_license_period: idLicensePeriod
    };

    if (transcript.transcriptDetail && transcript.transcriptDetail.items && transcript.transcriptDetail.items.length > 0) {
      // filtering the subjectareas valids (Visibles and with Remaining Hours)
      transcript.transcriptDetail.items = transcript.transcriptDetail.items.filter(item => item.isVisible === true && item.remainingHours > 0);
      transcript.transcriptDetail.items.forEach(item => {
        if (item.children && item.children.length > 0) {
          item.children = item.children.filter(children => children.isVisible === true && children.remainingHours > 0);
        }
      });

      // construct the json to update
      transcript.transcriptDetail.items.forEach(item => {
        transcript_to_update.id_subject_area_master.push(item.subjectAreaProfessions[0].subjectAreaId);
        transcript_to_update.nm_subject_area_master.push(item.name);

        if (item.children && item.children.length > 0) {
          item.children.forEach(children => {
            transcript_to_update.id_subject_area_master.push(children.subjectAreaProfessions[0].subjectAreaId);
            transcript_to_update.nm_subject_area_master.push(children.name);
          });
        }
      });
    }

    transcript_to_update.id_subject_area_master = transcript_to_update.id_subject_area_master.join(',');
    transcript_to_update.nm_subject_area_master = transcript_to_update.nm_subject_area_master.join(',');

    return await BIdatabase.update(transcript_to_update, { pk_license: pkLicense });
  }
};

module.exports = self;
