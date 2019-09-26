const html = require('./html');

const templates = html.makeTemplates({
  html: `
    <!doctype html><head>
      <meta charset="UTF-8">
      <title>Translate an image</title>
      <link href="common.css" rel="stylesheet">
      <link href="index.css" rel="stylesheet">
      <script src="index.js"></script>
      <script src="results.js"></script>
    </head><body>
      <%= navbar %>
      <form action="results" method="POST" enctype="multipart/form-data" onsubmit="ajaxSubmit(this, event)">
        <section class="about">
          <h1>Translate an image</h1>
          <div class="small">Powered by Google&#39;s <a href="https://cloud.google.com/vision/">Vision</a> and <a href="https://cloud.google.com/translate/">Translation</a> APIs</div>
        </section>
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
            <div>Or drag and drop or paste an image.</div>
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
        <output hidden></output>
      </form>
    </body></html>
  `
});

async function index() {
  const indexHTML = templates.html({navbar: html.navbar});
  return {html: indexHTML};
}

module.exports = {index};
