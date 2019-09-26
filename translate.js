const {Translate} = require('@google-cloud/translate');
const cache = require('./cache');
const throttle = require('./throttle');

const client = new Translate({
  keyFilename: '../keys/google_application_credentials.json'
});

function computeCost(text) {
  return 0.02 * text.join('').length;
}

async function translate({keys, annotations, srcLang, destLang, ip}) {
  const text = annotations.map(x => x.text);
  const from = (srcLang === 'auto') ? undefined : srcLang;
  if (!text.length) {
    return annotations;
  }
  const cost = computeCost(text);
  const translations = await cache.writeJSON(
    keys,
    `t.${srcLang}.${destLang}.json`,
    text,
    async () => {
      throttle.addCost('cloud', ip, cost);
      return client.translate(text, {from, to: destLang});
    }
  );
  translations[1].data.translations.forEach((result, i) => {
    if (annotations[i]) {
      annotations[i].translation = result.translatedText;
      annotations[i].srcLang = (srcLang === 'auto') ? result.detectedSourceLanguage : srcLang;
      annotations[i].destLang = destLang;
    }
  });
  return annotations;
}

async function getLanguages() {
  const languages = await cache.writeJSON(
    null,
    `lang.json`,
    null,
    () => client.getLanguages()
  );
  return languages[0];
}

module.exports = {translate, getLanguages};
