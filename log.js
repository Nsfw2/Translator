const fs = require('fs');

const logPath = './log';

fs.mkdirSync(logPath, {recursive: true});

function logger(filename, {timeResolution, awaitSuccess}) {
  let stream;

  let write = async (data) => {
    let time = Date.now();
    if (timeResolution) {
      time = Math.floor(time / timeResolution) * timeResolution;
    }
    data.time = time;
    data = JSON.stringify(data) + '\n';
    if (!stream || stream.closed) {
      stream = fs.createWriteStream(`${logPath}/${filename}`, {flag: 'a'});
    }
    return new Promise((resolve, reject) => {
      function cb(err) {
        stream.off('error', cb);
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
      stream.on('error', cb);
      stream.write(data, 'utf8', cb);
    });
  };

  if (!awaitSuccess) {
    write = (data) => {
      // dispatch write job without awaiting
      write(data).catch(console.error);
    };
  }

  return write;
}

module.exports = {logger};
