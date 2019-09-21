const fsPromises = require('fs').promises;
const crypto = require('crypto');

const outputPath = './results';

function path(filename) {
  return `${outputPath}/${filename}`;
}

async function read(filename, options) {
  return fsPromises.readFile(path(filename), options);
}

const writers = new Map();

async function write(filename, makeContents, encodeContents) {
  const fullname = path(filename);
  await fsPromises.mkdir(outputPath, {recursive: true});
  var writer = writers.get(filename);
  if (!writer) {
    var file;
    writer = (async () => {
      file = await fsPromises.open(fullname, 'wx');
      const contents = await (typeof makeContents === 'function' ? makeContents() : makeContents);
      const contents2 = encodeContents ? encodeContents(contents) : contents;
      await fsPromises.writeFile(file, contents2);
      return contents;
    })().finally(() => {
      if (file) return file.close();
    }).catch(async (err) => {
      if (err.code !== 'EEXIST' || file) {
        await fsPromises.unlink(fullname).catch(() => {});
        throw err;
      }
    }).finally(() => {
      writers.delete(filename);
    });
    writers.set(filename, writer);
  }
  return writer;
}

function getHash(data) {
  const hash = crypto.createHash('sha3-512');
  hash.update(data);
  return hash.digest('hex');
}

async function writeHash(contents) {
  const hash = getHash(contents);
  await write(hash, contents);
  return hash;
}

async function cacheJSON(filename, makeContents) {
  var data = await write(filename, makeContents, JSON.stringify);
  if (!data) {
    data = await read(filename, {encoding: 'utf8'});
    data = JSON.parse(data);
  }
  return data;
}

module.exports = {path, read, write, writeHash, cacheJSON};
