const express = require('express');
const index = require('./index');

const staticPath = './static';

const app = express();
const port = +(process.argv[2] || 80);

app.get('/', async (request, response) => {
  const {html} = await index.index();
  response.send(html);
});

app.use(express.static(staticPath));

app.listen(port, (err) => {
  if (err) {
    return console.error(err);
  }
  console.log(`listening on port ${port}`);
});
