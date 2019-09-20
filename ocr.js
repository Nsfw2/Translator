const vision = require('@google-cloud/vision');
const tempfile = require('./tempfile');

const client = new vision.ImageAnnotatorClient({
  keyFilename: '../keys/google_application_credentials.json'
});

async function request(filename) {
  const [result] = await client.textDetection(tempfile.path(filename));
  return result.textAnnotations;
}

async function write(hash, extension) {
  var annotations = tempfile.write(
    `${hash}.json`,
    () => request(`${hash}.${extension}`),
    JSON.stringify
  );
  if (!annotations) {
    annotations = await tempfile.read(`${hash}.json`, {encoding: 'utf8'});
    annotations = JSON.parse(annotations);
  }
  return annotations;
}

module.exports = {write};
