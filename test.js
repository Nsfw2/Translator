const fsPromises = require('fs').promises;
const cache = require('./cache');
const results = require('./results');

const samplePath = '../sample';
const staticPath = 'static';

async function parallel(tasks) {
  return Promise.all(tasks.map(task =>
    task.catch(console.error)
  ));
}

async function handleFile(filename) {
  const imageData = await fsPromises.readFile(filename);
  const hash = await cache.getHash(imageData);
  return parallel([
    cache.write(hash, imageData),
    cache.write(`${hash}.html`, () => results.results(hash, imageData))
  ]);
}

async function writeHTML() {
  const filenames = await fsPromises.readdir(samplePath);
  return parallel(filenames.map(f =>
    handleFile(`${samplePath}/${f}`)
  ));
}

async function makeLinks() {
  const filenames = await fsPromises.readdir(staticPath);
  return parallel(filenames.map(f =>
    cache.symlink(`${staticPath}/${f}`, f)
  ));
}

async function test() {
  return parallel([
    writeHTML(),
    makeLinks()
  ]);
}

test();
