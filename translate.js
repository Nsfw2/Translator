const {Translate} = require('@google-cloud/translate');
const cache = require('./cache');

const client = new Translate({
  keyFilename: '../keys/google_application_credentials.json'
});

async function translate({keys, annotations, srcLang, destLang}) {
  const text = annotations.map(x => x.text);
  const from = (srcLang === 'auto') ? undefined : srcLang;
  const translations = await cache.writeJSON(
    keys,
    `t.${srcLang}.${destLang}.json`,
    text,
    () => client.translate(text, {from, to: destLang})
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

module.exports = {translate};
