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
      <script src="index.js"></script>
    </head><body>
      <form action="." method="POST" enctype="multipart/form-data">
        <h1>Translate an image</h1>
        <section class="imageselect">
          <label>
            <div>Choose an image from your computer:</div>
            <input name="image" type="file" onchange="fileInputChanged(this)">
            <div class="imagepreview" hidden>
              <button type="button" onclick="clearFile()">\xd7</button>
              <img>
              <span class="imagepreview-filename"></span>
            </div>
          </label>
          <label>
            <div>Or paste a link to the image:</div>
            <input name="imageURL" type="text">
          </label>
          <label>
            <div>Or drag and drop an image.</div>
            <input name="imageB64" type="hidden">
            <input class="imageB64Name" type="hidden">
          </label>
        </section>
        <section class="languages">
          <label>
            <div>Translate from:</div>
            <select name="srcLang">
              <option value="auto">Auto-detect</option>
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
