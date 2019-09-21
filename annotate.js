const _ = require('lodash');
const tempfile = require('./tempfile');

const templates = {
  html: _.template(
    `<!doctype html><head>
<meta charset="UTF-8">
<title>Translation results</title>
<link href="results.css" rel="stylesheet">
</head><body>
<div class="image-container">
<img src="<%- hash %>">
<div class="annotation-container">
<%= annotationsHTML %>
</div>
</div>
</body></html>
`
  ),
  annotation: _.template(
    `<div class="annotation" style="left: <%- x1 %>px; top: <%- y1 %>px;" tabindex="0">
<svg class="outline" style="z-index: <%- z1 %>; width: <%- dx %>px; height: <%- dy %>px;" viewbox="0 0 <%- dx %> <%- dy %>" xmlns="http://www.w3.org/2000/svg">
<polygon points="<%- points %>" fill="currentColor" stroke="black" />
</svg>
<div class="tooltip-root" style="width: <%- dx %>px; top: <%- dy %>px;">
<div class="tooltip"><div class="translation"><%- translation %></div><div class="original"><%- text %></div></div>
</div>
</div>`
  )
};

function generateAnnotation({translation, text, vertices}) {
  const xs = vertices.map(p => p.x);
  const ys = vertices.map(p => p.y);
  const zs = vertices.map(p => p.x + p.y);
  const x1 = Math.min.apply(Math, xs);
  const y1 = Math.min.apply(Math, ys);
  const z1 = Math.min.apply(Math, zs);
  const dx = Math.max.apply(Math, xs) - x1;
  const dy = Math.max.apply(Math, ys) - y1;
  const points = vertices.map(p => `${p.x - x1},${p.y - y1}`).join(' ');
  return {z1, x1, y1, dx, dy, points, translation, text};
}

function generateHTML(options) {
  const {hash, annotations} = options;
  const annotationsData = annotations.map(generateAnnotation);
  const zs = annotationsData.map(o => o.z1).sort((a, b) => a - b);
  annotationsData.forEach(o => {
    o.z1 = zs.indexOf(o.z1) - zs.length;
  });
  const annotationsHTML = annotationsData.map(templates.annotation).join('\n');
  const html = templates.html({hash, annotationsHTML});
  return html;
}

async function writeHTML(options) {
  return tempfile.write(`${options.hash}.html`, () => generateHTML(options));
}

module.exports = {writeHTML};
