const vision = require('@google-cloud/vision');
const tempfile = require('./tempfile');

const client = new vision.ImageAnnotatorClient({
  keyFilename: '../keys/google_application_credentials.json'
});

async function request(filename) {
  const [result] = await client.documentTextDetection(tempfile.path(filename));
  return result;
}

async function write(hash) {
  var annotations = await tempfile.write(
    `${hash}.json`,
    () => request(hash),
    JSON.stringify
  );
  if (!annotations) {
    annotations = await tempfile.read(`${hash}.json`, {encoding: 'utf8'});
    annotations = JSON.parse(annotations);
  }
  return annotations;
}

module.exports = {write};
