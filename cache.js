const fsPromises = require('fs').promises;
const crypto = require('crypto');

const outputPath = './cache';

function getHash(data) {
  const hash = crypto.createHash('sha3-512');
  hash.update(data);
  return hash.digest('hex');
}

const writers = new Map();

async function writeJSON(filename, makeContents) {
  const fullname = `${outputPath}/${filename}`;
  let writer = writers.get(filename);
  if (!writer) {
    writer = (async () => {
      let contents;
      try {
        contents = await fsPromises.readFile(fullname, {encoding: 'utf8'});
        contents = JSON.parse(contents);
      } catch(err) {
        if (err.code !== 'ENOENT') console.error(err);
        contents = await makeContents();
        // dispatch write job without awaiting
        (async() => {
          const contents2 = JSON.stringify(contents);
          await fsPromises.mkdir(outputPath, {recursive: true});
          fsPromises.writeFile(fullname, contents2);
        })().finally(() => {
          writers.delete(filename);
        });
      }
      return contents;
    })();
    writers.set(filename, writer);
  }
  return writer;
}

module.exports = {getHash, writeJSON};
