const fileType = require('file-type');
const cache = require('./cache');
const ocr = require('./ocr');
const translate = require('./translate');
const html = require('./html');
const log = require('./log').logger('results');

const maxCharCount = 1000;
const noSpaces = ['ja', 'zh-CN', 'zh-TW'];
const srcSubstitutions = new Map([['zh-TW', 'zh-CN']]);

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
        <section id="warnings">
          <%= warningsHTML %>
        </section>
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
      <div class="tooltip-root"><div class="tooltip <%- hideTranslation %>">
        <div class="translation"><%= translationHTML %></div>
        <div class="original"><%= textHTML %></div>
        <div class="attribution">
          <a href="https://translate.google.com/" target="_blank" rel="noopener"><img src="translated-by-google.png"></a><span> (<%- srcLang %> \u2192 <%- destLang %>)</span>
        </div>
        <div class="openGT">
          <%= linkHTML %>
        </div>
      </div></div>
    </label>
  `,
  translateLink: `<a href="<%- url %>" target="_blank" rel="noopener" onclick="openGoogleTranslate(event)"><%- label %></a>`,
  charCount: `<div>Translation aborted: Maximum character count of <%- maxCharCount %> exceeded.</div>`
});

function googleTranslateLink({srcLang, destLang, text}) {
  srcLang = (srcSubstitutions.get(srcLang) || srcLang);
  let linkParams = [srcLang, destLang, text].map(encodeURIComponent).join('|');
  return `https://translate.google.com/#${linkParams}`;
}

function generateTranslateLinks({srcLang, destLang, text}) {
  let linkHTML = '';
  linkHTML += templates.translateLink({
    url: googleTranslateLink({srcLang, destLang, text}),
    label: 'open in Google Translate'
  });
  if (/\n/.test(text)) {
    let joiner = (noSpaces.includes(srcLang) ? '' : ' ');
    let textJoined = text.replace(/\n/g, joiner);
    linkHTML += ' ' + templates.translateLink({
      url: googleTranslateLink({srcLang, destLang, text: textJoined}),
      label: '[join lines]'
    });
  }
  return linkHTML;
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
  const translationHTML = html.escapeBR(translation);
  const textHTML = html.escapeBR(text);
  const linkHTML = generateTranslateLinks({srcLang, destLang, text});
  const hideTranslation = translation.length ? '' : 'hide-translation';
  return {z1, x1, y1, dx, dy, points, translationHTML, textHTML, srcLang, destLang, linkHTML, hideTranslation};
}

function generateHTML(options) {
  const {annotations, imageData, warningsHTML} = options;
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
  const resultsHTML = templates.html({imageHTML, navbar: html.navbar, warningsHTML});
  return resultsHTML;
}

async function results({imageData, srcLang, destLang, ip}) {
  let warningsHTML = '';
  const keys = await cache.getKeys(imageData);
  const annotations = await ocr.ocr({keys, imageData, srcLang, ip});
  const charCount = annotations.map(x => x.text).join('').length;
  if (charCount <= maxCharCount) {
    await translate.translate({keys, annotations, srcLang, destLang, ip});
  } else {
    warningsHTML += templates.charCount({maxCharCount});
  }
  annotations.forEach(x => {
    if (!x.translation) x.translation = '';
    if (!x.srcLang) x.srcLang = srcLang;
    if (!x.destLang) x.destLang = destLang;
  });
  const resultsHTML = generateHTML({annotations, imageData, warningsHTML});
  log({hash: keys.storage, charCount, srcLang, destLang});
  return {html: resultsHTML, keys};
}

function blankHTML() {
  const resultsHTML = templates.html({imageHTML: '', navbar: html.navbar});
  return resultsHTML;
}

module.exports = {results, blankHTML};
