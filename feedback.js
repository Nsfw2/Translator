const fsPromises = require('fs').promises;
const html = require('./html');

const logPath = './log';

const templates = html.makeTemplates({
  response: `
    <!doctype html><head>
      <meta charset="UTF-8">
      <title>Feedback Submitted</title>
      <link href="common.css" rel="stylesheet">
      <link href="static.css" rel="stylesheet">
    </head><body>
      <%= navbar %>
      <main>
        <h1>Feedback Submitted</h1>
        <p>Thank you for your input.</p>
      </main>
    </body></html>
  `
});

async function submit(data) {
  data.time = Date.now();
  await fsPromises.mkdir(logPath, {recursive: true});
  await fsPromises.writeFile(`${logPath}/feedback`, JSON.stringify(data) + '\n', {flag: 'a'});
  const responseHTML = templates.response({navbar: html.navbar});
  return {html: responseHTML};
}

module.exports = {submit};
