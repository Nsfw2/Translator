const fsPromises = require('fs').promises;
const crypto = require('crypto');

const outputPath = './cache';

function path(filename) {
  return `${outputPath}/${filename}`;
}

async function mkdir() {
  return fsPromises.mkdir(outputPath, {recursive: true});
}

function evaluate(x) {
  return (typeof x === 'function' ? x() : x);
}

const readers = new Map();
const writers = new Map();

async function read (filename, options, decodeContents, makeContents) {
  let reader = (readers.get(filename) || writers.get(filename));
  if (!reader) {
    reader = (async () => {
      let contents;
      try {
        contents = await fsPromises.readFile(path(filename), options);
        if (decodeContents) contents = decodeContents(contents);
      } catch(err) {
        if (makeContents) {
          contents = await evaluate(makeContents);
        } else {
          throw err;
        }
      }
      return contents;
    })();
  }
  return reader;
}

async function write(filename, makeContents, encodeContents, mode='wx') {
  const fullname = path(filename);
  let reader = readers.get(filename);
  if (reader) await reader.catch(() => {});
  let writer = writers.get(filename);
  if (!writer) {
    let file;
    writer = (async () => {
      await mkdir();
      try {
        file = await fsPromises.open(fullname, mode);
      } catch(err) {
        if (mode !== 'wx' || err.code !== 'EEXIST') throw err;
        return;
      }
      const contents = await evaluate(makeContents);
      const contents2 = encodeContents ? encodeContents(contents) : contents;
      await fsPromises.writeFile(file, contents2);
      return contents;
    })().finally(() => {
      if (file) return file.close();
    }).catch(async (err) => {
      await fsPromises.unlink(fullname).catch(() => {});
      throw err;
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

async function writeJSON(filename, makeContents) {
  let miss = false;
  let contents = await read(filename, {encoding: 'utf8'}, JSON.parse, () => {
    miss = true;
    return evaluate(makeContents);
  });
  if (miss) {
    // dispatch write job without awaiting
    write(filename, contents, JSON.stringify, 'w').catch(console.error);
  }
  return contents;
}

async function symlink(target, filename) {
  await mkdir();
  try {
    await fsPromises.symlink(`../${target}`, path(filename));
  } catch(err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

module.exports = {path, read, write, getHash, writeJSON, symlink};
