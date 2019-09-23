const _ = require('lodash');
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
      <label class="annotation-reset-body" for="annotation-reset"></label>
      <div class="image-container">
        <label for="annotation-reset">
          <img src="<%- hash %>">
        </label>
        <form class="annotation-container">
          <%= annotationsHTML %>
          <input id="annotation-reset" type="reset">
        </form>
      </div>
    </body></html>
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
  const linkParams = [srcLang, destLang, text.replace(/\n/g, ' ')].map(encodeURIComponent).join('|');
  return {z1, x1, y1, dx, dy, points, translationHTML, textHTML, srcLang, destLang, linkParams};
}

function generateHTML(options) {
  const {hash, annotations} = options;
  const annotationsData = annotations.map(generateAnnotation);
  const zs = annotationsData.map(o => o.z1).sort((a, b) => a - b);
  annotationsData.forEach(o => {
    o.z1 = zs.indexOf(o.z1) - zs.length;
  });
  const annotationsHTML = annotationsData.map(templates.annotation).join('');
  const html = templates.html({hash, annotationsHTML});
  return html;
}

async function results(hash, imageData) {
  const annotations = await ocr.write(hash, imageData);
  await translate.write(annotations, 'en');
  return generateHTML({annotations, hash});
}

module.exports = {results};
