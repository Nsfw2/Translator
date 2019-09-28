const fs = require('fs');

const logPath = './log';

fs.mkdirSync(logPath, {recursive: true});

function logger(filename, options={}) {
  let {timeResolution, awaitSuccess} = options;
  let stream;

  async function write(data) {
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
  }

  function log(data) {
    // dispatch write job without awaiting
    write(data).catch(console.error);
  }

  return (awaitSuccess ? write : log);
}

module.exports = {logger};
