const vision = require('@google-cloud/vision');
const cache = require('./cache');
const throttle = require('./throttle');

const client = new vision.ImageAnnotatorClient({
  keyFilename: '../keys/google_application_credentials.json'
});

async function ocr({keys, imageData, srcLang, ip}) {
  const annotations = await cache.writeJSON(
    keys,
    `o.${srcLang}.json`,
    null,
    async () => {
      throttle.addCost('cloud', ip, 1.5);
      const languageHints = (srcLang === 'auto') ? undefined : [srcLang];
      return client.documentTextDetection({
        image: {content: imageData},
        imageContext: {languageHints}
      });
    }
  );
  return processParagraphs(annotations);
}

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
  ).join('').trim();
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

function validateBox(obj) {
  return !!(obj.boundingBox && obj.boundingBox.vertices && obj.boundingBox.vertices.length);
}

function processParagraphs(annotations) {
  return (
    extractParagraphs(annotations[0])
      .filter(validateBox)
      .map(p => ({text: extractText(p), vertices: p.boundingBox.vertices}))
  );
}

module.exports = {ocr};
