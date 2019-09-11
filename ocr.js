const fsPromises = require('fs').promises;
const crypto = require('crypto');
const vision = require('@google-cloud/vision');

const outputPath = './results/';

async function getHash(filename) {
  const data = await fsPromises.readFile(filename);
  const hash = crypto.createHash('sha3-512');
  hash.update(data);
  return hash.digest('hex');
}

async function testExists(filename) {
  try {
    await fsPromises.access(filename);
    return true;
  } catch(err) {
    return false;
  }
}

async function getOCR(filename) {
  const client = new vision.ImageAnnotatorClient();
  const [result] = await client.textDetection(filename);
  return result.textAnnotations;
}

async function writeOCR(filename) {
  const hash = await getHash(filename);
  const outputFilename = `${outputPath}${hash}.json`;
  const exists = await testExists(outputFilename);
  if (!exists) {
    const annotations = await getOCR(filename);
    await fsPromises.mkdir(outputPath, {recursive: true});
    await fsPromises.writeFile(`${outputFilename}.tmp`, JSON.stringify(annotations));
    await fsPromises.rename(`${outputFilename}.tmp`, outputFilename);
  }
}

const filename = '../sample/wakeupcat.jpg';
writeOCR(filename);
