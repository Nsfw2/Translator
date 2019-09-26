const html = require('./html');
const translate = require('./translate');

const topLanguages = ['en', 'ja'];

const templates = html.makeTemplates({
  html: `
    <!doctype html><head>
      <meta charset="UTF-8">
      <title>Translate an image</title>
      <link href="common.css" rel="stylesheet">
      <link href="index.css" rel="stylesheet">
      <script src="index.js"></script>
    </head><body>
      <%= navbar %>
      <form action="results" method="POST" enctype="multipart/form-data">
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
              <%= langHTML %>
            </select>
          </label>
          <label>
            <div>Translate to:</div>
            <select name="destLang">
              <%= langHTML %>
            </select>
          </label>
        </section>
        <input value="Submit" type="submit">
        <output hidden></output>
      </form>
    </body></html>
  `,
  language: `<option value="<%- code %>"><%- name %></option>`
});

function generateLangHTML(languages) {
  let langHTML = '';
  const langMap = new Map(languages.map(lang => [lang.code, lang.name]));
  topLanguages.forEach(code => {
    const name = langMap.get(code);
    if (name) langHTML += templates.language({code, name});
  });
  languages.forEach(lang => {
    if (!topLanguages.includes(lang.code)) {
      langHTML += templates.language(lang);
    }
  });
  return langHTML;
}

async function index() {
  const languages = await translate.getLanguages();
  const langHTML = generateLangHTML(languages);
  const indexHTML = templates.html({langHTML, navbar: html.navbar});
  return {html: indexHTML};
}

module.exports = {index};
