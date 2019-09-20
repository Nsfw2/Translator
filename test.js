const fsPromises = require('fs').promises;
const tempfile = require('./tempfile');
const ocr = require('./ocr');
const annotate = require('./annotate');

async function handleFile(filename) {
  const imageData = await fsPromises.readFile(filename);
  const hash = await tempfile.writeHash(imageData);
  const annotations = await ocr.write(hash);
  return annotate.writeHTML({annotations, hash});
}

async function test() {
  Promise.all(
    process.argv.slice(2).map(filename =>
      handleFile(filename).catch(console.error)
    )
  );
}

test();
