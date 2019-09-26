const express = require('express');
const multer = require('multer');
const got = require('got');
const _ = require('lodash');
const index = require('./index');
const results = require('./results');
const translate = require('./translate');

const staticPath = './static';
const maxFileSize = (10 << 20);

const limits = {
  fields: index.fieldCount - 1,
  files: 1,
  fileSize: maxFileSize,
  fieldSize: Math.ceil(maxFileSize*(8/6))
};
const storage = multer.memoryStorage();
const upload = multer({storage, limits});

const app = express();
const port = +(process.argv[2] || 80);

app.get('/', (req, res, next) => (async () => {
  const {html} = await index.index();
  res.send(html);
})().catch(next));

app.get('/results', (req, res) => {
  res.send(results.blankHTML());
});

app.post('/results', upload.single('image'), (req, res, next) => (async () => {
  let imageData;
  if (req.file) {
    imageData = req.file.buffer;
  } else if (req.body.imageB64) {
    imageData = Buffer.from(req.body.imageB64.replace(/^.*,/, ''), 'base64');
  } else if (req.body.imageURL) {
    const {imageURL} = req.body;
    if (!/^https?:/i.test(imageURL)) {
      return res.status(400).send(`Invalid URL: ${_.escape(imageURL)}`);
    }
    try {
      imageData = (await got(imageURL, {encoding: null})).body;
    } catch(err) {
      return res.status(404).send(
        (err.statusCode ? `Error ${+err.statusCode}` : 'Connection error') + ` from ${_.escape(imageURL)}`
      );
    }
  } else {
    return res.status(400).send('Error: No image posted.');
  }
  const {srcLang, destLang} = req.body;
  const languages = await translate.getLanguages();
  const languageCodes = new Set(languages.map(lang => lang.code));
  if (srcLang !== 'auto' && !languageCodes.has(srcLang)) {
    return res.status(400).send(`Invalid source language: ${_.escape(srcLang)}`);
  }
  if (!languageCodes.has(destLang)) {
    return res.status(400).send(`Invalid destination language: ${_.escape(destLang)}`);
  }
  const {html} = await results.results({imageData, srcLang, destLang});
  res.send(html);
})().catch(next));

app.use(express.static(staticPath));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const code = ['LIMIT_FILE_SIZE', 'LIMIT_FIELD_VALUE'].includes(err.code) ? 413 : 400;
    res.status(code).send(`Error: ${_.escape(err.message)}`);
  } else {
    next(err);
  }
});

app.listen(port, (err) => {
  if (err) {
    return console.error(err);
  }
  console.log(`listening on port ${port}`);
});
