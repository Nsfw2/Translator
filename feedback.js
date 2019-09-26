const fsPromises = require('fs').promises;
const html = require('./html');
const throttle = require('./throttle');

const logPath = './log';
const maxLength = 10000;

const templates = html.makeTemplates({
  form: `
    <!doctype html><head>
      <meta charset="UTF-8">
      <title>Feedback</title>
      <link href="common.css" rel="stylesheet">
      <link href="static.css" rel="stylesheet">
    </head><body>
      <%= navbar %>
      <form action="feedbackposted" method="POST">
        <h1>Feedback</h1>
        <label>
          <div>If you can have any problems or suggestions, type them here and I&#39;ll look into them.</div>
          <textarea name="message" maxlength="<%- maxLength %>"></textarea>
        </label>
        <%= submit %>
      </form>
    </body></html>
  `,
  submit: `<input type="submit">`,
  cooldown: `<p class="cooldown"><%= message %></p>`,
  message: `Feedback is temporarily unavailable due to <%- issue %>. Try again in about an hour.`,
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

function feedback(ip) {
  const submit = throttle.replaceSubmit('feedback', ip, templates);
  const form = templates.form({navbar: html.navbar, submit, maxLength});
  return form;
}

async function submit(data, ip) {
  const issue = throttle.overCost('feedback', ip);
  if (issue) return templates.message({issue});
  throttle.addCost('feedback', ip, 1);
  data.time = Date.now();
  await fsPromises.mkdir(logPath, {recursive: true});
  await fsPromises.writeFile(`${logPath}/feedback`, JSON.stringify(data) + '\n', {flag: 'a'});
  const responseHTML = templates.response({navbar: html.navbar});
  return responseHTML;
}

module.exports = {feedback, submit, maxLength};
