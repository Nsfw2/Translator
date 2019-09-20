const _ = require('lodash');
const tempfile = require('./tempfile');

const templates = {
  html: _.template(
    `<!doctype html><head>
<meta charset="UTF-8">
<title>Translation results</title>
<link href="../css/results.css" rel="stylesheet">
</head><body>
<div class="image-container">
<img src="<%- hash %>">
<%= annotationsHTML %>
</div>
</body></html>
`
  ),
  annotation: _.template(
    `<div class="annotation" style="left: <%- x1 %>px; top: <%- y1 %>px; width: <%- dx %>px; height: <%- dy %>px;">
<div class="annotation-tooltip-root"><div class="annotation-tooltip"><%- text %></div></div>
</div>`
  )
};

const breaksAsText = new Map([
  ['UNKNOWN', ''],
  ['SPACE', ' '],
  ['SURE_SPACE', ' '],
  ['EOL_SURE_SPACE', '\n'],
  ['HYPHEN', '\n'],
  ['LINE_BREAK', '\n']
]);

function addBreak(text, property) {
  if (!property || !property.detectedBreak) return text;
  const {type, isPrefix} = property.detectedBreak;
  const breakText = (breaksAsText.get(type) || '');
  return isPrefix ? (breakText + text) : (text + breakText);
}

function extractText(paragraph) {
  return (paragraph.words || []).map(w =>
    addBreak(
      (w.symbols || []).map(s => addBreak(s.text, s.property)).join(''),
      w.property
    )
  ).join('');
}

function extractParagraphs(annotations) {
  const paragraphs = [];
  ((annotations.fullTextAnnotation || {}).pages || []).forEach(page => {
    (page.blocks || []).forEach(b => {
      (b.paragraphs || []).forEach(p => {
        paragraphs.push(p);
      });
    });
  });
  return paragraphs;
}

function generateAnnotation(paragraph) {
  const box = (paragraph.boundingBox || []);
  const xs = box.vertices.map(p => p.x);
  const ys = box.vertices.map(p => p.y);
  const x1 = Math.min.apply(Math, xs);
  const y1 = Math.min.apply(Math, ys);
  const dx = Math.max.apply(Math, xs) - x1;
  const dy = Math.max.apply(Math, ys) - y1;
  const text = extractText(paragraph).trim();
  const html = templates.annotation({x1, y1, dx, dy, text});
  return html;
}

function generateHTML(options) {
  const {hash, annotations} = options;
  const annotationsHTML = extractParagraphs(annotations).map(generateAnnotation).join('\n');
  const html = templates.html({hash, annotationsHTML});
  return html;
}

async function writeHTML(options) {
  return tempfile.write(`${options.hash}.html`, () => generateHTML(options));
}

async function test() {
  const fsPromises = require('fs').promises;
  const ocr = require('./ocr');

  async function handleFile(filename) {
    const imageData = await fsPromises.readFile(filename);
    const hash = await tempfile.writeHash(imageData);
    const annotations = await ocr.write(hash);
    return writeHTML({annotations, hash});
  }

  Promise.all(
    process.argv.slice(2).map(filename =>
      handleFile(filename).catch(console.error)
    )
  );
}

test();
