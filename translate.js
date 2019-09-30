const fs = require('fs');
const {TranslationServiceClient} = require('@google-cloud/translate').v3beta1;
const cache = require('./cache');
const throttle = require('./throttle');

const keyFilename = '../keys/google_application_credentials.json';

const client = new TranslationServiceClient({keyFilename});
const projectId = JSON.parse(fs.readFileSync(keyFilename, {encoding: 'utf-8'})).project_id;
const parent = client.locationPath(projectId, 'global');

function computeCost(text) {
  return 0.02 * text.join('').length;
}

async function translate({keys, annotations, srcLang, destLang, ip}) {
  const text = annotations.map(x => x.text);
  if (!text.length) {
    return annotations;
  }
  const cost = computeCost(text);
  const request = {
    parent,
    contents: text,
    mimeType: 'text/plain',
    sourceLanguageCode: ((srcLang === 'auto') ? undefined : srcLang),
    targetLanguageCode: destLang
  };
  const translations = await cache.writeJSON(
    keys,
    `t.${srcLang}.${destLang}.json`,
    text,
    async () => {
      throttle.addCost('cloud', ip, cost);
      return client.translateText(request);
    }
  );
  translations[0].translations.forEach((result, i) => {
    if (annotations[i]) {
      annotations[i].translation = result.translatedText;
      annotations[i].srcLang = (srcLang === 'auto') ? result.detectedLanguageCode : srcLang;
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
    () => client.getSupportedLanguages({parent, displayLanguageCode: 'en'})
  );
  return new Map(languages[0].languages.map(x => [x.languageCode, {name: x.displayName}]));
}

module.exports = {translate, getLanguages};
