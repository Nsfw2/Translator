const _ = require('lodash');

function trim(text) {
  return text.replace(/\n\s*/g, '');
}

function makeTemplates(obj) {
  for (let key in obj) {
    obj[key] = _.template(trim(obj[key]));
  }
  return obj;
}

function escapeBR(text) {
  return _.escape(text).replace(/\n/g, '<br>');
}

module.exports = {makeTemplates, escapeBR};
