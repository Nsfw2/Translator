const html = require('./html');
const translate = require('./translate');
const throttle = require('./throttle');
const hcaptcha = require('./hcaptcha');

const topLanguages = ['en', 'ja'];
const fillableFields = ['imageURL', 'imageB64', 'imageB64Name', 'srcLang', 'destLang'];
const fieldCount = 7;

const templates = html.makeTemplates({
  html: `
    <!doctype html><head>
      <meta charset="UTF-8">
      <title>Translate an image</title>
      <link href="common.css" rel="stylesheet">
      <link href="index.css" rel="stylesheet">
      <script src="index.js"></script>
      <script data-ad-client="ca-pub-7209242109535460" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
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
            <input name="imageURL" type="text" value="<%- imageURL %>">
          </label>
          <label>
            <div>Or drag and drop or paste an image.</div>
            <input name="imageB64" type="hidden" value="<%- imageB64 %>">
            <input class="imageB64Name" type="hidden" value="<%- imageB64Name %>">
          </label>
        </section>
        <section class="languages">
          <label>
            <div>Translate from:</div>
            <select name="srcLang">
              <option value="auto">Auto-detect</option>
              <%= srcLangHTML %>
            </select>
          </label>
          <label>
            <div>Translate to:</div>
            <select name="destLang">
              <%= destLangHTML %>
            </select>
          </label>
        </section>
        <section class="verifysubmit" <%= submitHidden %>>
          <%= captchaHTML %>
          <input value="Submit" type="submit">
        </section>
        <output <%= outputHidden %>><%= message %></output>
      </form>
    </body></html>
  `,
  language: `<option value="<%- code %>" <%= selected %>><%- name %></option>`,
  message: `Image translation is temporarily unavailable due to <%- issue %>. Try again in about an hour.`
});

function generateLangHTML(languages, selectedLang) {
  let langHTML = '';
  const langMap = new Map(languages.map(lang => [lang.code, lang.name]));
  topLanguages.forEach(code => {
    const name = langMap.get(code);
    const selected = (code === selectedLang) ? 'selected' : '';
    if (name) langHTML += templates.language({code, name, selected});
  });
  languages.forEach(lang => {
    if (!topLanguages.includes(lang.code)) {
      const {code, name} = lang;
      const selected = (code === selectedLang) ? 'selected' : '';
      langHTML += templates.language({code, name, selected});
    }
  });
  return langHTML;
}

async function index({imageURL, imageB64, imageB64Name, srcLang, destLang, ip}) {
  const languages = await translate.getLanguages();
  const srcLangHTML = generateLangHTML(languages, srcLang);
  const destLangHTML = generateLangHTML(languages, destLang);
  const captchaHTML = hcaptcha.widget();
  const issue = throttle.overCost('cloud', ip);
  const submitHidden = issue ? 'hidden' : '';
  const outputHidden = issue ? '' : 'hidden';
  const message = issue ? templates.message({issue}) : '';
  const indexHTML = templates.html({imageURL, imageB64, imageB64Name, srcLangHTML, destLangHTML, navbar: html.navbar, captchaHTML, submitHidden, outputHidden, message});
  return {html: indexHTML};
}

function throttleMessage(issue) {
  return templates.message({issue});
}

module.exports = {index, fillableFields, fieldCount, throttleMessage};
