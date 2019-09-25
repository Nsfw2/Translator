const {Translate} = require('@google-cloud/translate');
const cache = require('./cache');

const client = new Translate({
  keyFilename: '../keys/google_application_credentials.json'
});

async function translate({keys, annotations, destLang}) {
  const text = annotations.map(x => x.text);
  const translations = await cache.writeJSON(
    keys,
    `t.${destLang}.json`,
    text,
    () => client.translate(text, destLang)
  );
  translations[1].data.translations.forEach((result, i) => {
    if (annotations[i]) {
      annotations[i].translation = result.translatedText;
      annotations[i].srcLang = result.detectedSourceLanguage;
      annotations[i].destLang = destLang;
    }
  });
  return annotations;
}

module.exports = {translate};
