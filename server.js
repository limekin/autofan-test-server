var express = require('express');

var app = express();

var autofanPort = 3000;

app.listen(autofanPort, function() {
    console.log('Listening on port '+autofanPort+'.');
});
