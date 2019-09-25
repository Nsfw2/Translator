const _ = require('lodash');

function makeTemplate(text) {
  return _.template(text.replace(/\n\s*/g, ''));
}

const templates = {
  html: makeTemplate(`
    <!doctype html><head>
      <meta charset="UTF-8">
      <title>Translate an image</title>
    </head><body>
      <form action="/" method="POST">
        <input type="file">
        <input type="submit">
      </form>
    </body></html>
  `),
};

async function index() {
  const html = templates.html();
  return {html};
}

module.exports = {index};
