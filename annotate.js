const _ = require('lodash');
const tempfile = require('./tempfile');

const templates = {
  html: _.template(
    `<!doctype html><head>
<title>Translation results</title>
<link href="../css/results.css" rel="stylesheet">
</head><body>
<div class="image-container">
<img src="<%- hash %>.<%- extension %>">
<%= annotationsHTML %>
</div>
</body></html>
`
  ),
  annotation: _.template(
    `<div class="annotation" style="left: <%- x1 %>px; top: <%- y1 %>px; width: <%- dx %>px; height: <%- dy %>px;" title="<%- text %>">
<div class="annotation-tooltip-root"><span class="annotation-tooltip"><%- text %></span></div>
</div>`
  )
};

function generateAnnotation(annotation) {
  const xs = annotation.boundingPoly.vertices.map(p => p.x);
  const ys = annotation.boundingPoly.vertices.map(p => p.y);
  const x1 = Math.min.apply(Math, xs);
  const y1 = Math.min.apply(Math, ys);
  const dx = Math.max.apply(Math, xs) - x1;
  const dy = Math.max.apply(Math, ys) - y1;
  const text = annotation.description.trim();
  const html = templates.annotation({x1, y1, dx, dy, text});
  return html;
}

function generateHTML(options) {
  const {hash, extension, annotations} = options;
  annotationsHTML = annotations.map(generateAnnotation).join('\n');
  const html = templates.html({hash, extension, annotationsHTML});
  return html;
}

async function writeHTML(options) {
  return tempfile.write(`${options.hash}.html`, () => generateHTML(options));
}

async function test() {
  const hash = '11ab77154e52e621cbeecb91e667b03e3d6f6ba7513717f59f11e4a0a956cf31a45fd7474adb5c2c3d588a8d67032e8e2b7b06242b6b3ab5df8a276b0c2f9cbd';
  const extension = 'jpg';
  const annotations = JSON.parse(await tempfile.read(`${hash}.json`, {encoding: 'utf8'}));
  return writeHTML({annotations, hash, extension});
}

test();
