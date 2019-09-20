const fsPromises = require('fs').promises;
const tempfile = require('./tempfile');
const ocr = require('./ocr');
const annotate = require('./annotate');

const samplePath = '../sample';

async function handleFile(filename) {
  const imageData = await fsPromises.readFile(filename);
  const hash = await tempfile.writeHash(imageData);
  const annotations = await ocr.write(hash);
  return annotate.writeHTML({annotations, hash});
}

async function test() {
  const entries = await fsPromises.readdir(samplePath, {withFileTypes: true});
  const filenames = entries.filter(x => x.isFile()).map(x => `${samplePath}/${x.name}`);
  return Promise.all(
    filenames.map(filename =>
      handleFile(filename).catch(console.error)
    )
  );
}

test();
