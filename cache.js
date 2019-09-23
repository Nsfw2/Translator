const fsPromises = require('fs').promises;
const crypto = require('crypto');

const outputPath = './cache';

function path(filename) {
  return `${outputPath}/${filename}`;
}

async function read(filename, options) {
  return fsPromises.readFile(path(filename), options);
}

async function mkdir() {
  return fsPromises.mkdir(outputPath, {recursive: true});
}

const writers = new Map();

async function write(filename, makeContents, encodeContents) {
  const fullname = path(filename);
  await mkdir();
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

async function writeJSON(filename, makeContents) {
  var data = await write(filename, makeContents, JSON.stringify);
  if (!data) {
    data = await read(filename, {encoding: 'utf8'});
    data = JSON.parse(data);
  }
  return data;
}

async function symlink(target, filename) {
  await mkdir();
  try {
    await fsPromises.symlink(`../${target}`, path(filename));
  } catch(err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

module.exports = {path, read, write, getHash, writeHash, writeJSON, symlink};
