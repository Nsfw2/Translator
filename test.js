const fsPromises = require('fs').promises;
const tempfile = require('./tempfile');
const ocr = require('./ocr');
const translate = require('./translate');
const annotate = require('./annotate');

const samplePath = '../sample';
const webPath = 'web';

async function parallel(tasks) {
  return Promise.all(tasks.map(task =>
    task.catch(console.error)
  ));
}

async function listFiles(path) {
  const entries = await fsPromises.readdir(path, {withFileTypes: true});
  const filenames = entries.filter(x => x.isFile()).map(x => x.name);
  return filenames;
}

async function handleFile(filename) {
  const imageData = await fsPromises.readFile(filename);
  const hash = await tempfile.writeHash(imageData);
  const annotations = await ocr.write(hash);
  await translate.write(annotations, 'en');
  return annotate.writeHTML({annotations, hash});
}

async function writeHTML() {
  const filenames = await listFiles(samplePath);
  return parallel(filenames.map(f =>
    handleFile(`${samplePath}/${f}`)
  ));
}

async function makeLinks() {
  const filenames = await listFiles(webPath);
  return parallel(filenames.map(f =>
    tempfile.symlink(`${webPath}/${f}`, f)
  ));
}

async function test() {
  return parallel([
    writeHTML(),
    makeLinks()
  ]);
}

test();
