const fsPromises = require('fs').promises;
const results = require('./results');

const samplePath = '../sample';
const staticPath = 'static';
const outputPath = 'test';

const srcLang = (process.argv[2] || 'auto');
const destLang = (process.argv[3] || 'en');

async function parallel(tasks) {
  return Promise.all(tasks.map(task =>
    task.catch(console.error)
  ));
}

async function handleFile(filename) {
  const imageData = await fsPromises.readFile(filename);
  const {hash, html} = await results.results({imageData, srcLang, destLang});
  return fsPromises.writeFile(`${outputPath}/${hash}.${destLang}.html`, html);
}

async function writeHTML() {
  const filenames = await fsPromises.readdir(samplePath);
  return parallel(filenames.map(f =>
    handleFile(`${samplePath}/${f}`)
  ));
}

async function makeLinks() {
  const filenames = await fsPromises.readdir(staticPath);
  return parallel(filenames.map(async f => {
    try {
      await fsPromises.symlink(`../${staticPath}/${f}`, `${outputPath}/${f}`);
    } catch(err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }));
}

async function test() {
  await fsPromises.mkdir(outputPath, {recursive: true});
  return parallel([
    writeHTML(),
    makeLinks()
  ]);
}

test();
