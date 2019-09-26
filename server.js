const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const _ = require('lodash');
const fsPromises = require('fs').promises;
const index = require('./index');
const results = require('./results');
const translate = require('./translate');
const feedback = require('./feedback');
const html = require('./html');

const staticPath = './static';
const htmlPath = './html';
const maxFileSize = (10 << 20);
const serverHostname = 'http://localhost:8009/';

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

function parseQuery(keys, query) {
  const output = {};
  keys.forEach(k => {
    if ((k in query) && (typeof query[k] === 'string')) {
      output[k] = query[k];
    }
  });
  return output;
}

app.get('/', (req, res, next) => (async () => {
  const queryData = parseQuery(index.fillableFields, req.query);
  const {html} = await index.index(queryData);
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
    if (/^https?:/i.test(imageURL)) {
      try {
        const resURL = await fetch(imageURL, {size: maxFileSize});
        if (resURL.ok) {
          imageData = await resURL.buffer();
        } else {
          return res.status(404).send(
            `${+resURL.status} ${_.escape(resURL.statusText)} from ${_.escape(imageURL)}`
          );
        }
      } catch(err) {
        if (err instanceof fetch.FetchError) {
          if (err.type === 'max-size') {
            res.status(413).send('Error: File too large');
          } else {
            res.status(404).send(`Error: ${_.escape(err.message)}`);
          }
        }
        throw err;
      }
    } else if (/^data:[^,]*;base64,/i.test(imageURL)) {
      imageData = Buffer.from(decodeURIComponent(imageURL.replace(/^.*,/, '')), 'base64');
    } else {
      return res.status(400).send(`Unsupported URL type: ${_.escape(imageURL)}`);
    }
  } else {
    return res.status(400).send('Error: No image posted.');
  }
  if (imageData.length === 0) {
    return res.status(400).send('Error: File is empty.');
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

app.get(['/tools', '/privacy'], (req, res, next) => (async () => {
  const template = await fsPromises.readFile(`${htmlPath}${req.path}`, {encoding: 'utf-8'});
  const templateHTML = _.template(html.trim(template))({
    navbar: html.navbar,
    host: serverHostname
  });
  res.send(templateHTML);
})().catch(next));

app.get('/feedback', (req, res) => {
  const feedbackHTML = feedback.feedback(req.ip);
  res.send(feedbackHTML);
});

app.post('/feedbackposted', express.urlencoded({extended: true}), (req, res, next) => (async () => {
  const {message} = req.body;
  const responseHTML = await feedback.submit({message}, req.ip);
  res.send(responseHTML);
})().catch(next));

app.use(express.static(staticPath));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE' || (err.code === 'LIMIT_FIELD_VALUE' && err.field === 'imageB64')) {
      res.status(413).send('Error: File too large');
    } else {
      const code = (err.code === 'LIMIT_FIELD_VALUE') ? 413 : 400;
      res.status(code).send(`Error: ${_.escape(err.message)}`);
    }
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
