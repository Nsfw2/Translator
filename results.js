const fileType = require('file-type');
const cache = require('./cache');
const ocr = require('./ocr');
const translate = require('./translate');
const html = require('./html');

const templates = html.makeTemplates({
  html: `
    <!doctype html><head>
      <meta charset="UTF-8">
      <title>Translation results</title>
      <link href="common.css" rel="stylesheet">
      <link href="results.css" rel="stylesheet">
      <script src="results.js"></script>
    </head><body>
      <div>
        <label class="annotation-reset-body" for="annotation-reset"></label>
        <%= navbar %>
        <main>
          <label class="annotation-reset-main" for="annotation-reset"></label>
          <div class="image-container">
            <%= imageHTML %>
          </div>
        </main>
        <nav id="botnav"><a href=".">Translate another</a></nav>
      </div>
    </body></html>
  `,
  image: `
    <label class="annotation-reset-image" for="annotation-reset">
      <img src="<%- imageURI %>">
    </label>
    <form class="annotation-container">
      <%= annotationsHTML %>
      <input id="annotation-reset" type="reset">
    </form>
  `,
  annotation: `
    <label class="annotation" style="left: <%- x1 %>px; top: <%- y1 %>px;" onmouseup="handleSelection(this)">
      <input name="annotation-select" type="radio" onfocus="annotationFocus(this)">
      <svg class="outline" style="z-index: <%- z1 %>;" width="<%- dx %>" height="<%- dy %>" viewbox="0 0 <%- dx %> <%- dy %>" xmlns="http://www.w3.org/2000/svg">
        <polygon points="<%- points %>" fill="none" stroke="black" />
      </svg>
      <div class="tooltip-root"><div class="tooltip">
        <div class="translation"><%= translationHTML %></div>
        <div class="original"><%= textHTML %></div>
        <div class="small">
          <img src="translated-by-google.png"><span> (<%- srcLang %> \u2192 <%- destLang %>)</span>
        </div>
        <div class="small">
          <a href="https://translate.google.com/#<%- linkParams %>" target="_blank" rel="noopener" onclick="openGoogleTranslate(event)">open in Google Translate</a>
        </div>
      </div></div>
    </label>
  `
});

function generateAnnotation({translation, text, vertices, srcLang, destLang}) {
  const xs = vertices.map(p => p.x);
  const ys = vertices.map(p => p.y);
  const zs = vertices.map(p => p.x + p.y);
  const x1 = Math.max(0, Math.min.apply(Math, xs));
  const y1 = Math.max(0, Math.min.apply(Math, ys));
  const z1 = Math.min.apply(Math, zs);
  const dx = Math.max.apply(Math, xs) - x1;
  const dy = Math.max.apply(Math, ys) - y1;
  const points = vertices.map(p => `${p.x - x1},${p.y - y1}`).join(' ');
  const translationHTML = html.escapeBR(translation);
  const textHTML = html.escapeBR(text);
  const linkParams = [srcLang, destLang, text].map(encodeURIComponent).join('|');
  return {z1, x1, y1, dx, dy, points, translationHTML, textHTML, srcLang, destLang, linkParams};
}

function generateHTML(options) {
  const {annotations, imageData} = options;
  const annotationsData = annotations.map(generateAnnotation);
  const zs = annotationsData.map(o => o.z1).sort((a, b) => a - b);
  annotationsData.forEach(o => {
    o.z1 = zs.indexOf(o.z1) - zs.length;
  });
  const annotationsHTML = annotationsData.map(templates.annotation).join('');
  let mimeType = (fileType(imageData) || {}).mime;
  if (!mimeType || !(/^image\//.test(mimeType))) mimeType = 'application/octet-stream';
  const imageURI = `data:${mimeType};base64,${imageData.toString('base64')}`;
  const imageHTML = templates.image({imageURI, annotationsHTML});
  const resultsHTML = templates.html({imageHTML, navbar: html.navbar});
  return resultsHTML;
}

async function results({imageData, srcLang, destLang}) {
  const keys = await cache.getKeys(imageData);
  const annotations = await ocr.ocr({keys, imageData, srcLang});
  await translate.translate({keys, annotations, srcLang, destLang});
  const resultsHTML = generateHTML({annotations, imageData});
  return {html: resultsHTML, keys};
}

function blankHTML() {
  const resultsHTML = templates.html({imageHTML: '', navbar: html.navbar});
  return resultsHTML;
}

module.exports = {results, blankHTML};
