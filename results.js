const _ = require('lodash');
const fileType = require('file-type');
const cache = require('./cache');
const ocr = require('./ocr');
const translate = require('./translate');

function makeTemplate(text) {
  return _.template(text.replace(/\n\s*/g, ''));
}

const templates = {
  html: makeTemplate(`
    <!doctype html><head>
      <meta charset="UTF-8">
      <title>Translation results</title>
      <link href="results.css" rel="stylesheet">
      <script src="results.js"></script>
    </head><body>
      <nav><%= navHTML %></nav>
      <main>
        <label class="annotation-reset-body" for="annotation-reset"></label>
        <div class="image-container">
          <label class="annotation-reset-image" for="annotation-reset">
            <img src="<%- imageURI %>">
          </label>
          <form class="annotation-container">
            <%= annotationsHTML %>
            <input id="annotation-reset" type="reset">
          </form>
        </div>
      </main>
      <nav><%= navHTML %></nav>
    </body></html>
  `),
  nav: makeTemplate(`
    <a href="/">Translate another</a>
  `),
  annotation: makeTemplate(`
    <label class="annotation" style="left: <%- x1 %>px; top: <%- y1 %>px;">
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
  `)
};

function escapeBR(text) {
  return _.escape(text).replace(/\n/g, '<br>');
}

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
  const translationHTML = escapeBR(translation);
  const textHTML = escapeBR(text);
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
  let mimeType = fileType(imageData).mime;
  if (!(/^image\//.test(mimeType))) mimeType = 'application/octet-stream';
  const imageURI = `data:${mimeType};base64,${imageData.toString('base64')}`;
  const navHTML = templates.nav();
  const html = templates.html({imageURI, annotationsHTML, navHTML});
  return html;
}

async function results({imageData, srcLang, destLang}) {
  const keys = await cache.getKeys(imageData);
  const annotations = await ocr.ocr({keys, imageData, srcLang});
  await translate.translate({keys, annotations, srcLang, destLang});
  const html = generateHTML({annotations, imageData});
  return {html, keys};
}

module.exports = {results};
