const express = require('express');
const multer = require('multer');
const got = require('got');
const index = require('./index');
const results = require('./results');

const staticPath = './static';

const storage = multer.memoryStorage();
const upload = multer({storage});

const app = express();
const port = +(process.argv[2] || 80);

app.get('/', (req, res, next) => (async () => {
  const {html} = await index.index();
  res.send(html);
})().catch(next));

app.post('/', upload.single('image'), (req, res, next) => (async () => {
  let imageData;
  if (req.file) {
    imageData = req.file.buffer;
  } else if (req.body.imageB64) {
    imageData = Buffer.from(req.body.imageB64.replace(/^.*,/, ''), 'base64');
  } else if (req.body.imageURL) {
    imageData = (await got(req.body.imageURL, {encoding: null})).body;
  } else {
    throw new Error('no image posted');
  }
  const {srcLang, destLang} = req.body;
  const {html} = await results.results({imageData, srcLang, destLang});
  res.send(html);
})().catch(next));

app.use(express.static(staticPath));

app.listen(port, (err) => {
  if (err) {
    return console.error(err);
  }
  console.log(`listening on port ${port}`);
});
