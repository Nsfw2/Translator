const _ = require('lodash');

function makeTemplate(text) {
  return _.template(text.replace(/\n\s*/g, ''));
}

const templates = {
  html: makeTemplate(`
    <!doctype html><head>
      <meta charset="UTF-8">
      <title>Translate an image</title>
      <link href="index.css" rel="stylesheet">
    </head><body>
      <form action="." method="POST" enctype="multipart/form-data">
        <h1>Translate an image</h1>
        <section class="imageselect">
          <label>
            <div>Choose an image from your computer:</div>
            <input name="image" type="file">
          </label>
          <label>
            <div>Or paste a link to the image:</div>
            <input name="imageURL" type="text">
          </label>
          <label>Or drag and drop an image.</label>
        </section>
        <section class="languages">
          <label>
            <div>Translate from:</div>
            <select name="srcLang">
              <option value="auto">Autodetect</option>
              <option value="ja">Japanese</option>
            </select>
          </label>
          <label>
            <div>Translate to:</div>
            <select name="destLang">
              <option value="en">English</option>
              <option value="es">Spanish</option>
            </select>
          </label>
        </section>
        <input value="Submit" type="submit">
      </form>
    </body></html>
  `),
};

async function index() {
  const html = templates.html();
  return {html};
}

module.exports = {index};
