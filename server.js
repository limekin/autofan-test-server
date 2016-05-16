var express = require('express');

var app = express();

var autofanPort = 3000;

var autofanStateVar = 0;

app.get( '/state', function(req,res) {
    res.send({ state: autofanStateVar });
});

app.listen(autofanPort, function() {
    console.log('Listening on port '+ autofanPort +'.');
});
