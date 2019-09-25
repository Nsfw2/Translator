const express = require('express');

const staticPath = './static';

const app = express();
const port = +(process.argv[2] || 80);

app.get('/', (request, response) => {
  response.send('Hello from Express!');
});

app.use(express.static(staticPath));

app.listen(port, (err) => {
  if (err) {
    return console.error(err);
  }
  console.log(`listening on port ${port}`);
});
