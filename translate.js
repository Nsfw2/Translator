const {Translate} = require('@google-cloud/translate');
const cache = require('./cache');

const client = new Translate({
  keyFilename: '../keys/google_application_credentials.json'
});

async function write(annotations, target) {
  const text = annotations.map(x => x.text.replace(/\n/g, ' '));
  const hash = cache.getHash(JSON.stringify(text));
  const translations = await cache.writeJSON(
    `${hash}.t.${target}.json`,
    () => client.translate(text, target)
  );
  translations[1].data.translations.forEach((result, i) => {
    if (annotations[i]) {
      annotations[i].translation = result.translatedText;
      annotations[i].srcLang = result.detectedSourceLanguage;
      annotations[i].destLang = target;
    }
  });
  return annotations;
}

module.exports = {write};
