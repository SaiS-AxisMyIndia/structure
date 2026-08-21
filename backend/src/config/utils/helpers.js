// Generic helper functions
const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});

const omit = (obj, keys) =>
  Object.keys(obj || {}).reduce((acc, key) => {
    if (!keys.includes(key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});

module.exports = {
  pick,
  omit,
};
