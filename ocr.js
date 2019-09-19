const vision = require('@google-cloud/vision');
const tempfile = require('./tempfile');

async function getOCR(filename) {
  const client = new vision.ImageAnnotatorClient();
  const [result] = await client.textDetection(tempfile.path(filename));
  return result.textAnnotations;
}

async function writeOCR(hash, extension) {
  return tempfile.write(
    `${hash}.json`,
    () => getOCR(`${hash}.${extension}`),
    JSON.stringify
  );
}

async function test() {
  const filename = '../sample/wakeupcat.jpg';
  const extension = 'jpg';
  const fsPromises = require('fs').promises;
  const imageData = await fsPromises.readFile(filename);
  const hash = await tempfile.writeHash(extension, imageData);
  return writeOCR(hash, extension);
}

test();
