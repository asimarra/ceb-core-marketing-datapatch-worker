const queryMapper = (map, src) => {
  if (!map || typeof map !== 'object' || Object.keys(map).length === 0) {
    throw new Error();
  }

  if (typeof src !== 'object') return {};

  return Object.keys(src || {}).reduce((prev, key) => {
    if (!map[key]) {
      return prev;
    }
    prev[map[key]] = src[key];
    return prev;
  }, {});
};

module.exports = queryMapper;
