const html = require('./html');
const translate = require('./translate');
const throttle = require('./throttle');

const topLanguages = ['en', 'ja'];
const fillableFields = ['imageURL', 'imageB64', 'imageB64Name', 'srcLang', 'destLang'];
const fieldCount = 7;

const templates = html.makeTemplates({
  html: `
    <!doctype html><head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width">
      <title>Translate an image</title>
      <link href="common.css" rel="stylesheet">
      <link href="index.css" rel="stylesheet">
      <script src="index.js"></script>
    </head><body>
      <%= navbar %>
      <form action="results" method="POST" enctype="multipart/form-data">
        <section class="about">
          <h1>Translate an image</h1>
          <div class="small">Powered by Google&#39;s <a href="https://cloud.google.com/vision/" target="_blank" rel="noopener">Vision API</a> and Microsoft&#39;s <a href="https://www.microsoft.com/en-us/translator/business/translator-api/" target="_blank" rel="noopener">Translator API</a></div>
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
        <section>
          Need human translations? <a href="https://track.fiverr.com/visit/?bta=57727&amp;brand=fiverrcpa&amp;landingPage=https%3A%2F%2Fwww.fiverr.com%2Fcategories%2Fwriting-translation%2Fquality-translation-services" target="_blank" rel="nofollow noopener">Hire a translator on Fiverr.</a>
        </section>
        <section class="verifysubmit" <%= submitHidden %>>
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
  topLanguages.forEach(code => {
    const {name} = languages.get(code);
    const selected = (code === selectedLang) ? 'selected' : '';
    if (name) langHTML += templates.language({code, name, selected});
  });
  languages.forEach(({name}, code) => {
    if (!topLanguages.includes(code)) {
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
  const issue = throttle.overCost('cloud', ip);
  const submitHidden = issue ? 'hidden' : '';
  const outputHidden = issue ? '' : 'hidden';
  const message = issue ? templates.message({issue}) : '';
  const indexHTML = templates.html({imageURL, imageB64, imageB64Name, srcLangHTML, destLangHTML, navbar: html.navbar, submitHidden, outputHidden, message});
  return {html: indexHTML};
}

function throttleMessage(issue) {
  return templates.message({issue});
}

module.exports = {index, fillableFields, fieldCount, throttleMessage};
