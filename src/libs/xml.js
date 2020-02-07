'use strict';

const convert = require('xml-js');
const moment = require('moment');

const DEFAULT_OPTIONS = {
  compact: true,
  ignoreComment: true,
  spaces: 4,
  nativeType: true
};

const DEFAULT_DATE = '0001-01-01T00:00:00';

module.exports = {
  XMLtoJS: (xml, options = DEFAULT_OPTIONS) => {
    return convert.xml2js(xml, options);
  },
  getValue: xmlProperty => {
    if (xmlProperty) {
      const xmlObjectProperty = xmlProperty.length
        ? xmlProperty[0]
        : xmlProperty;
      if (xmlObjectProperty.hasOwnProperty('_text')) {
        return xmlObjectProperty._text;
      } else {
        return undefined;
      }
    } else {
      return xmlProperty;
    }
  },
  getValueData: xmlObjectProperty => {
    if (xmlObjectProperty) {
      if (xmlObjectProperty.hasOwnProperty('_cdata')) {
        return xmlObjectProperty._cdata;
      } else {
        return undefined;
      }
    } else {
      return xmlObjectProperty;
    }
  },
  getBooleanValue: xmlObjectProperty => {
    if (xmlObjectProperty) {
      if (xmlObjectProperty.hasOwnProperty('_text')) {
        return xmlObjectProperty._text === 1;
      }
    }
    return false;
  },
  getDateValue: (xmlObjectProperty, showDefaultDate = true) => {
    if (xmlObjectProperty) {
      if (xmlObjectProperty.hasOwnProperty('_text')) {
        const d = moment
          .utc(xmlObjectProperty._text, 'MM/DD/YYYY')
          .startOf('day');
        if (d.isValid()) {
          return d.format();
        }
      }
    }
    return showDefaultDate ? DEFAULT_DATE : null;
  },
  toArray: xmlObjectProperty => {
    if (xmlObjectProperty && !Array.isArray(xmlObjectProperty)) {
      return [xmlObjectProperty];
    } else {
      return xmlObjectProperty;
    }
  },
  getIntValue: xmlObjectProperty => {
    if (xmlObjectProperty) {
      if (xmlObjectProperty.hasOwnProperty('_text')) {
        const result = parseInt(xmlObjectProperty._text);
        return !isNaN(result) ? result : 0;
      }
    }
    return 0;
  },
  getFloatValue: xmlObjectProperty => {
    if (xmlObjectProperty) {
      if (xmlObjectProperty.hasOwnProperty('_text')) {
        const result = parseFloat(xmlObjectProperty._text);
        return !isNaN(result) ? result : 0;
      }
    }
    return 0;
  }
};
