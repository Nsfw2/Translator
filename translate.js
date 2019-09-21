const {Translate} = require('@google-cloud/translate');
const tempfile = require('./tempfile');

const client = new Translate({
  keyFilename: '../keys/google_application_credentials.json'
});

async function write(annotations, target) {
  const text = annotations.map(x => x.text.replace(/\n/g, ' '));
  const hash = tempfile.getHash(JSON.stringify(text));
  const translations = await tempfile.cacheJSON(
    `${hash}.t.${target}.json`,
    () => client.translate(text, target)
  );
  translations[0].forEach((result, i) => {
    if (annotations[i]) annotations[i].translation = result;
  });
  return annotations;
}

module.exports = {write};
