const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('client'));

app.get('/', function(req, res) {
  res.sendFile(path.join(`${__dirname}/client`, 'index.html'));
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});