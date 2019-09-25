const express = require('express');
const multer = require('multer');
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
  if (!req.file) throw new Error('no image posted');
  const imageData = req.file.buffer;
  const srcLang = 'auto';
  const destLang = 'en';
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
