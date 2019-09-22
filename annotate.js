const _ = require('lodash');
const tempfile = require('./tempfile');

function makeTemplate(text) {
  return _.template(text.replace(/\n\s*/g, ''));
}

const templates = {
  html: makeTemplate(`
    <!doctype html><head>
      <meta charset="UTF-8">
      <title>Translation results</title>
      <link href="results.css" rel="stylesheet">
    </head><body>
      <div class="image-container">
        <img src="<%- hash %>">
        <label class="annotation-unselect"><input name="annotation-select" type="radio" checked></label>
        <div class="annotation-container">
          <%= annotationsHTML %>
        </div>
      </div>
    </body></html>
  `),
  annotation: makeTemplate(`
    <label class="annotation" style="left: <%- x1 %>px; top: <%- y1 %>px;">
      <input name="annotation-select" type="radio">
      <svg class="outline" style="z-index: <%- z1 %>; width: <%- dx %>px; height: <%- dy %>px;" viewbox="0 0 <%- dx %> <%- dy %>" xmlns="http://www.w3.org/2000/svg">
        <polygon points="<%- points %>" fill="currentColor" stroke="black" />
      </svg>
      <div class="tooltip-root"><div class="tooltip">
        <div class="translation"><%- translation %></div>
        <div class="original"><%- text %></div>
        <a href="https://translate.google.com/#<%- linkParams %>" target="_blank" rel="noopener">open in Google Translate</a>
      </div></div>
    </label>
  `)
};

function generateAnnotation({translation, text, vertices, srcLang, destLang}) {
  const xs = vertices.map(p => p.x);
  const ys = vertices.map(p => p.y);
  const zs = vertices.map(p => p.x + p.y);
  const x1 = Math.min.apply(Math, xs);
  const y1 = Math.min.apply(Math, ys);
  const z1 = Math.min.apply(Math, zs);
  const dx = Math.max.apply(Math, xs) - x1;
  const dy = Math.max.apply(Math, ys) - y1;
  const points = vertices.map(p => `${p.x - x1},${p.y - y1}`).join(' ');
  const linkParams = [srcLang, destLang, text.replace(/\n/g, ' ')].map(encodeURIComponent).join('|');
  return {z1, x1, y1, dx, dy, points, translation, text, linkParams};
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

async function writeHTML(options) {
  return tempfile.write(`${options.hash}.html`, () => generateHTML(options));
}

module.exports = {writeHTML};
