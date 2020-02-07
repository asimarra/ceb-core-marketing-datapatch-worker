const getXmlFromOracle = result => {
  return Array.isArray(result) && result.length > 0 ? result[0].XML : null;
};

module.exports = {
  getXmlFromOracle
};
