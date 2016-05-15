var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var autofanPort = 3000;

var autofanStateVar = 0;

app.get( '/state', function(req,res) {
    res.send({ state: autofanStateVar });
});

app.post( '/action', function(req,res) {
    console.log(req.body); //debug

    var reqAction = req.body.action;
    console.log(reqAction); //debug

    if( reqAction == "ON" )
	autofanStateVar = 1;
    else if( reqAction == "OFF" )
	autofanStateVar = 0;
    else if( reqAction == "TOGGLE" ) {
	
	if(autofanStateVar == 0)
	    autofanStateVar = 1;
	else if(autofanStateVar == 1)
	    autofanStateVar = 0;
    }

    res.send('{"state":"'+ autofanStateVar +'"}');
});
	
app.listen(autofanPort, function() {
    console.log('Listening on port '+ autofanPort +'.');
});
