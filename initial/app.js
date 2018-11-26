var express = require('express');

var app = express();
// Configure static server
app.use(express.static('public'));

const port = 3000;
app.listen(port, () =>  console.log(`Server listening ${port}`));