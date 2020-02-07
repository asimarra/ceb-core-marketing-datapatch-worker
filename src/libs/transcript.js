'use strict';
const {
  XMLtoJS,
  getValue,
  getBooleanValue,
  getDateValue,
  toArray,
  getIntValue,
  getFloatValue,
  getValueData
} = require('../libs/xml.js');

const DEFAULT_DATE = '0001-01-01T00:00:00.000Z';

const transcriptXMLtoJS = xml => {
  if (!xml && typeof xml !== 'string') {
    return null;
  }
  let transcriptData;
  const result = XMLtoJS(xml);
  const {
    transcript: { info1: info }
  } = result;
  if (info) {
    let transcriptDetail;
    if (getValue(info.id_license_period) != '0') {
      transcriptDetail = transcriptXMLModel(info);
    }
    const ownerLicenses = info.licenses.license
      ? toArray(info.licenses.license).map(licenseXMLModel)
      : null;
    const licenseCycles = info.license_periods.license_period
      ? toArray(info.license_periods.license_period).map(cyclesXMLModel)
      : null;
    transcriptData = { transcriptDetail, ownerLicenses, licenseCycles };
  }
  return transcriptData;
};

const licenseXMLModel = licenseXML => ({
  id: getValue(licenseXML.pk_license),
  number: getValue(licenseXML.ds_state_license),
  professionId: getValue(licenseXML.id_profession),
  profession: {
    id: getValue(licenseXML.id_profession),
    code: getValue(licenseXML.cd_profession),
    name: getValue(licenseXML.nm_profession),
    boardId: getValue(licenseXML.id_board),
    board: {
      id: getValue(licenseXML.id_board),
      name: getValue(licenseXML.nm_board),
      stateId: getValue(licenseXML.id_cebroker_state),
      state: {
        id: getValue(licenseXML.id_cebroker_state),
        code: getValue(licenseXML.cd_cebroker_state),
        name: getValue(licenseXML.ds_cebroker_state)
      }
    }
  }
});

const cyclesXMLModel = cyclesXML => {
  const cycleName = getValue(cyclesXML.ds_period);
  const renewalDates = cycleName.includes('-')
    ? cycleName.split('-')
    : undefined;
  return {
    id: getValue(cyclesXML.id_period),
    renewalStartDate: renewalDates ? new Date(renewalDates[0]) : DEFAULT_DATE,
    renewalEndDate: renewalDates ? new Date(renewalDates[1]) : DEFAULT_DATE,
    transcriptFields: {
      name: cycleName,
      isDefault:
        cyclesXML._attributes && cyclesXML._attributes.in_selected
          ? cyclesXML._attributes.in_selected == '1'
          : false
    }
  };
};

const mappingSubjectsXMLModel = subjectsXML => {
  const subjects = subjectsXML.map(subjectXML => {
    let isFlag = subjectXML.in_additional_hours
      ? getBooleanValue(subjectXML.in_additional_hours)
      : subjectXML.in_additional_hours_disc
      ? getBooleanValue(subjectXML.in_additional_hours_disc)
      : false;
    let isDependent = getBooleanValue(subjectXML.in_dependent);
    let isCompleted = getValue(subjectXML.comp_courses) != '0';
    let excessHours = 0;
    if (subjectXML.courses.course) {
      const course = subjectXML.courses.course;
      if (Array.isArray(course)) {
        excessHours = course.reduce((prev, current) => {
          return (prev += getValue(current.excess_hours));
        }, 0);
      } else {
        excessHours = getValue(course.excess_hours);
      }
    }
    const subject = getValue(subjectXML.ds_subject);
    const amEveryPeriodText = getValue(subjectXML.am_every_period_text);
    const tweak =
      getBooleanValue(subjectXML.in_recurren_requirenment) &&
      getValue(subjectXML.out_hours) != '0'
        ? `This is your selected biennium for the ${subject} requirement.${subject} is required every ${amEveryPeriodText} biennium. This will reset your ${amEveryPeriodText} biennium clock.`
        : ``;

    const postedHours =
      getValue(subjectXML.comp_hours) > excessHours
        ? getValue(subjectXML.comp_hours) - excessHours
        : 0;
    return {
      id: getValue(subjectXML.id_subject),
      name: getValue(subjectXML.ds_subject),
      isFlag,
      isDependent,
      hasDependentSubjects: getValue(subjectXML.in_has_child_subject_areas),
      isDeliveryMethodRestricted: getBooleanValue(
        subjectXML.in_delivery_method_restriction
      ),
      postedHours: postedHours,
      postedHoursWithoutExcess: getFloatValue(subjectXML.comp_hours),
      requiredHours: getFloatValue(subjectXML.req_hours),
      outstandingHours: getFloatValue(subjectXML.out_hours),
      appliedHours: getFloatValue(subjectXML.app_hours),
      isVisible: !getBooleanValue(subjectXML.in_hide_parent),
      isRequired: true,
      isPosted: isCompleted,
      isNeeded: !isCompleted,
      excessHours: excessHours,
      creditCourses: creditCoursesXMLModel(subjectXML),
      totalAppliedHours: getValue(subjectXML.total_app_hours),
      remainingHours: getFloatValue(subjectXML.remaining_hours),
      tweaks: tweak,
      subjectAreaProfessions: [
        {
          subjectAreaId: getValue(subjectXML.id_subjectarea_master),
          allowCourseSearch: getBooleanValue(subjectXML.in_allow_course_search)
        }
      ],
      isExemptionDependent: getBooleanValue(subjectXML.in_exemption_dependent),
      children: []
    };
  });

  let subjectsGrouped = [];
  subjects.forEach((subject, index) => {
    if (!subject.isDependent || index == 0) {
      subjectsGrouped.push(subject);
    } else {
      subjectsGrouped[subjectsGrouped.length - 1].children.push(subject);
    }
  });
  return subjectsGrouped;
};

const creditCoursesXMLModel = creditCoursesXML => {
  let creditCourses = [];
  if (creditCoursesXML.courses.course) {
    const course = creditCoursesXML.courses.course;
    if (Array.isArray(course)) {
      course.forEach(c => {
        pushCreditCourse(c, creditCourses);
      });
    } else {
      pushCreditCourse(course, creditCourses);
    }
  }
  return creditCourses;
};

function pushCreditCourse(course, creditCourses = []) {
  const messages =
    course.messages && course.messages.message
      ? toArray(course.messages.message).map(messageXMLModel)
      : [];

  creditCourses.push({
    courseName: getValueData(course.nm_course),
    employeeCESubmissionId: getValue(course.id_em_ce_submission),
    employerId: getValue(course.id_employer),
    employerCEcreditId: getValue(course.id_employer_ce_credit),
    disciplinaryPostCourseId: getValue(course.id_disciplinary_post_course),
    rosterAttendeeId: getValue(course.id_roster_attendee),
    messages: messages,
    hours: getValue(course.am_hours),
    excessHours: getValue(course.excess_hours),
    hoursToReact: getValue(course.hours_to_react),
    isSeries: getValue(course.in_series),
    isModular: getValue(course.in_modular),
    isConcurrent: getValue(course.in_concurrent),
    creditType: getValue(course.cd_credit_type),
    dateEarned: getDateValue(course.dt_earned),
    postCEcreditId: getValue(course.id_post_ce_credit),
    courseId: getValue(course.id_course),
    appliedHours: getValue(course.am_applied_hours),
    isCreditDeliveryRes: getValue(course.in_credit_delivery_res),
    courseType: getValue(course.cd_course_type),
    courseHoursApplied: getValue(course.chours_applied),
    courseHoursEarned: getValue(course.chours_earned),
    messageAdded: getValue(course.message_added),
    isFullFillSpecial: getValue(course.in_fulfill_special),
    isParentFullFillSpecial: getValue(course.in_parent_fulfill_special),
    courseTypeDescription: getValue(course.ds_course_type),
    isDiscCourseManipulation: getValue(course.in_disc_course_manipulation),
    isPostedToPriorCycle: getValue(course.in_posted_to_prior_cycle),
    infoMessages: getInfoMessages(course)
  });
}

const messageXMLModel = messageXML => ({
  message: messageXML ? getValue(messageXML) : ''
});

function getInfoMessages(courseXML) {
  let messages = [];
  const inAdditionalHours = getValue(courseXML.in_additional_hours);
  const inFulFillSpecial = getBooleanValue(courseXML.in_fulfill_special);
  const isParentFullFillSpecial = getBooleanValue(
    courseXML.in_parent_fulfill_special
  );
  const excessHours = getValue(courseXML.excess_hours);
  const hoursToReact = getValue(courseXML.hours_to_react);
  const deliveriesResticted = getValue(courseXML.ds_deliveries_restricted);
  const inCreditDeliveryRes = getBooleanValue(courseXML.in_credit_delivery_res);
  const cHoursApplied = getValue(courseXML.chours_applied);
  const cHoursEarned = getValue(courseXML.chours_earned);

  if (inAdditionalHours != 1) {
    if (inFulFillSpecial || isParentFullFillSpecial) {
      messages.push({
        message: 'Simultaneously posting to multiple subject areas'
      });
    }

    if (excessHours > 0) {
      messages.push({
        message: `Excess Hours not applied: ${excessHours}`
      });
    }

    if (hoursToReact > 0) {
      const hoursString = hoursToReact == 1 ? 'hour' : 'hours';
      messages.push({
        message: `${hoursString} used for reactivation of license`
      });
    }

    if (
      deliveriesResticted != '' &&
      inCreditDeliveryRes &&
      cHoursApplied < cHoursEarned
    ) {
      messages.push({
        message: `Requirement on ${deliveriesResticted} course`
      });
    }
  }
  return messages;
}

const transcriptXMLModel = transcriptXML => {
  const isEMTorPMDProfession = getBooleanValue(
    transcriptXML.in_emt_pmd_profession
  )
    ? getBooleanValue(transcriptXML.in_emt_pmd_profession)
    : false;
  const completionDate = getDateValue(transcriptXML.dt_expire);
  const licenseExpirationDate = transcriptXML.dt_renewal_end
    ? getDateValue(transcriptXML.dt_renewal_end)
    : undefined;
  let transcriptStatus = transcriptXML.period_status
    ? getValue(transcriptXML.period_status)
    : 'NONE';
  const isNotCErequired = getBooleanValue(transcriptXML.in_ce_required);
  if (isNotCErequired) {
    transcriptStatus = 'NO_CE_REQ';
  }
  let boardLogo = getValue(transcriptXML.ds_path_logo);
  boardLogo =
    boardLogo && boardLogo.includes('../')
      ? boardLogo.replace('../', 'https://secure.cebroker.com/')
      : boardLogo;
  let lpEndDate = transcriptXML.dt_renewal_end
    ? getDateValue(transcriptXML.dt_renewal_end)
    : completionDate;

  let lpStartDate = new Date();
  const selectedCycle =
    transcriptXML.license_periods &&
    transcriptXML.license_periods.license_period
      ? toArray(transcriptXML.license_periods.license_period).filter(cycle => {
          return cycle._attributes ? cycle._attributes.in_selected == 1 : false;
        })
      : [];
  if (Array.isArray(selectedCycle) && selectedCycle[0]) {
    const cycleName = getValue(selectedCycle[0].ds_period);
    const renewalDates = cycleName.includes('-') ? cycleName.split('-') : [];
    (lpStartDate = renewalDates[0] ? new Date(renewalDates[0]) : DEFAULT_DATE),
      (lpEndDate = renewalDates[1] ? new Date(renewalDates[1]) : DEFAULT_DATE);
  }

  let licenseXML;

  if (getBooleanValue(transcriptXML.is_employer)) {
    licenseXML =
      transcriptXML.licenses && transcriptXML.licenses.license
        ? toArray(transcriptXML.licenses.license).filter(lic => {
            const comp1 = getValue(lic.id_scenario);
            const comp2 = getValue(transcriptXML.ds_license);
            if (typeof comp1 === 'string' && typeof comp2 === 'string') {
              return comp1.toUpperCase() === comp2.toUpperCase();
            } else {
              return false;
            }
          })[0]
        : undefined;
  } else {
    licenseXML =
      transcriptXML.licenses && transcriptXML.licenses.license
        ? toArray(transcriptXML.licenses.license).filter(lic => {
            if (getBooleanValue(lic.is_dual)) {
              return true;
            }
            const comp1 = getValue(lic.ds_license_value);
            const comp2 = getValue(transcriptXML.ds_license);
            if (typeof comp1 === 'string' && typeof comp2 === 'string') {
              return comp1.toUpperCase() === comp2.toUpperCase();
            } else {
              return false;
            }
          })[0]
        : undefined;
  }
  if (!licenseXML) {
    // licenseXML =
    //   transcriptXML.licenses && transcriptXML.licenses.license
    //     ? toArray(transcriptXML.licenses.license)[0]
    //     : null;

    licenseXML = {};
  }

  let scenarioDescriptionMesssage = getValue(transcriptXML.ds_scenario);
  let lstExemptions = [];
  const idScenario = getValue(transcriptXML.id_scenario);
  const cdScenarioTypeLists = ['FIRST', 'SECOND', 'FIRST_SECOND'];
  const professionCodeLists = ['PN', 'ND'];
  if (!idScenario) {
    const cdScenarioType = getValue(transcriptXML.cd_scenario2);
    const professionCode = getValue(transcriptXML.cd_profession);
    if (
      cdScenarioType &&
      professionCode &&
      cdScenarioTypeLists.includes(cdScenarioType) &&
      professionCodeLists.includes(professionCode)
    ) {
      scenarioDescriptionMesssage =
        'Please contact the Medical Quality Assurance Division at the FDOH at 850-488-0595 for your CE requirements';
    } else {
      scenarioDescriptionMesssage =
        'Please contact the "CE Broker Help Desk" at "1-877-434-6323". Monday – Friday, 8:00 am – 8:00 pm EST';
    }
  } else {
    const inExemption = getBooleanValue(transcriptXML.in_exemption);
    if (inExemption) {
      lstExemptions =
        transcriptXML.exemptions && transcriptXML.exemptions.exemption
          ? toArray(transcriptXML.exemptions.exemption).map(exmp => {
              return {
                id: getValue(exmp.id_exemption),
                name: getValue(exmp.nm_exemption),
                inDoNotShowLink: getValue(exmp.in_do_not_show_link)
              };
            })
          : [];
    } else {
      scenarioDescriptionMesssage = getValue(transcriptXML.ds_scenario);
    }
  }

  const hasSubjects = transcriptXML.subjects && transcriptXML.subjects.subject;
  let subjects = [];
  if (hasSubjects) {
    subjects = transcriptXML.subjects.subject
      ? mappingSubjectsXMLModel(toArray(transcriptXML.subjects.subject))
      : [];
  }
  const detailMessageFulFill = getBooleanValue(transcriptXML.in_fulfilled)
    ? 'All Disciplinary CE Requirements have been fulfilled'
    : '';

  const isDual = getBooleanValue(licenseXML.is_dual);
  return {
    completionDate: !isEMTorPMDProfession ? completionDate : DEFAULT_DATE,
    licenseExpirationDate,
    daysRemaining: !isEMTorPMDProfession
      ? getIntValue(transcriptXML.days_remaining)
      : 0,
    isDual,
    isEmployer: getBooleanValue(licenseXML.is_employer),
    isRecommended: getBooleanValue(licenseXML.in_recommended),
    isShowStateCode: getBooleanValue(licenseXML.in_show_cebroker_state),
    isViewOnlyCompleted: getBooleanValue(transcriptXML.in_view_only_completed),
    isShowCreditCourseType: getBooleanValue(
      transcriptXML.in_show_credit_course_type
    ),
    specialty: getValue(licenseXML.ds_specialty) || null,
    status: transcriptStatus,
    totalHoursRequired: getValue(transcriptXML.total_req),
    totalHoursPosted: getValue(transcriptXML.total_com),
    totalHoursNeeded: getValue(transcriptXML.total_out),
    totalHoursApplied: getValue(transcriptXML.total_applied),
    totalFlagsRequired: getValue(transcriptXML.total_course_req),
    totalFlagsPosted: getValue(transcriptXML.total_course_com),
    totalFlagsNeeded: getValue(transcriptXML.total_course_out),
    boardLogo,
    isInAudit: getBooleanValue(transcriptXML.in_audit_user),
    isProcessedByAudit: getBooleanValue(transcriptXML.in_processed_by_audit),
    completedPercentage: getValue(transcriptXML.am_gauge_percentage_completed),
    employerName: transcriptXML.employer_info
      ? getValue(transcriptXML.employer_transcriptXML.employer_name)
      : null,
    isBoardWithoutLisensingTranscript: getBooleanValue(
      transcriptXML.in_board_without_licensing_ts
    ),
    isEMTorPMDProfession,
    licensePeriod: {
      id: getValue(transcriptXML.id_license_period),
      isCurrentCycle: getBooleanValue(transcriptXML.is_current_cycle),
      renewalStartDate: lpStartDate,
      renewalEndDate: lpEndDate,
      activityStatus: getValue(transcriptXML.cd_praes_activity_status),
      licenseStatus: getValue(transcriptXML.cd_praes_license_status),
      licenseStatusFormatted: getValue(transcriptXML.ds_status),
      complianceStatus: transcriptXML.period_status
        ? getValue(transcriptXML.period_status)
        : 'NONE',
      percentageCompleted: getValue(
        transcriptXML.am_gauge_percentage_completed
      ),
      isEmployerScenario: getBooleanValue(transcriptXML.in_employer_scenario),
      license: {
        id: getValue(transcriptXML.pk_license),
        code: getValue(transcriptXML.id_license),
        number: isDual
          ? getValue(licenseXML.ds_license)
          : getValue(licenseXML.ds_state_license) || null,
        owner: {
          id: getValue(transcriptXML.id_user),
          firstName: getValue(transcriptXML.nm_first),
          middleName: getValue(transcriptXML.nm_middle),
          lastName: getValue(transcriptXML.nm_last)
        },
        profession: {
          id: getValue(transcriptXML.id_profession),
          code: getValue(transcriptXML.cd_profession),
          name: getValue(transcriptXML.nm_profession),
          board: {
            id: getValue(transcriptXML.id_board),
            state: {
              id: getValue(transcriptXML.id_cebroker_state),
              code: getValue(licenseXML.cd_cebroker_state) || null
            }
          }
        },
        expirationDate: getDateValue(transcriptXML.dt_expire)
          ? getDateValue(transcriptXML.dt_expire)
          : DEFAULT_DATE
      },
      scenario: {
        id: idScenario,
        type: getValue(transcriptXML.cd_scenario2),
        description: getValue(transcriptXML.ds_scenario),
        scenarioMessage: getValueData(transcriptXML.ds_message_scenario1)
          ? getValueData(transcriptXML.ds_message_scenario1)
          : getValueData(transcriptXML.ds_message_scenario2),
        descriptionMessage: scenarioDescriptionMesssage
      }
    },
    items: subjects,
    exemptions: lstExemptions,
    detailMessageFulFill: detailMessageFulFill
  };
};

module.exports = { transcriptXMLtoJS };
