const fsPromises = require('fs').promises;
const crypto = require('crypto');

const outputPath = './cache';

function getHash(data) {
  const hash = crypto.createHash('sha3-512');
  hash.update(data);
  return hash.digest('hex');
}

const writers = new Map();

async function writeJSON(filename, inputData, makeContents) {
  let writer = writers.get(filename);
  if (writer) return writer;
  writer = (async () => {
    const fullname = `${outputPath}/${filename}`;
    let contents;
    try {
      contents = await fsPromises.readFile(fullname, {encoding: 'utf8'});
      contents = JSON.parse(contents);
      if (JSON.stringify(contents.i) === JSON.stringify(inputData)) {
        return contents.o;
      }
    } catch(err) {
      if (err.code !== 'ENOENT') console.error(err);
    }
    contents = await makeContents();
    // dispatch write job without awaiting
    (async() => {
      const contents2 = JSON.stringify({i: inputData, o: contents});
      await fsPromises.mkdir(outputPath, {recursive: true});
      fsPromises.writeFile(fullname, contents2);
    })().finally(() => {
      writers.delete(filename);
    });
    return contents;
  })();
  writers.set(filename, writer);
  return writer;
}

module.exports = {getHash, writeJSON};
