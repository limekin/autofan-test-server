var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var autofanPort = 3000;

var autofanStateVar = 0;
var autofanStateVarPrev = 0;
var autofanStateMax = 5;

app.get( '/state', function(req,res) {
    res.send({ state: autofanStateVar });
});

app.post( '/action', function(req,res) {
    console.log(req.body); //debug

    var reqAction = req.body.action;
    console.log(reqAction); //debug

    if( reqAction == "ON" ) {
	if( !autofanStateVar ) {
	    autofanStateVar = 1;
	    autofanStateVarPrev = 0;
	}
    }
    else if( reqAction == "OFF" ) {
	autofanStateVar = 0;
	autofanStateVarPrev = 0;
    }
    else if( reqAction == "TOGGLE" ) {
	var stateCache = autofanStateVar;
	if( autofanStateVar ) {
	    autofanStateVar = 0;
	    autofanStateVarPrev = stateCache;
	}
	else {
	    if( autofanStateVarPrev ) {
		autofanStateVar = autofanStateVarPrev;
		autofanStateVarPrev = stateCache;
	    }
	}
    }
    else if( reqAction == "UP" ) {
	var stateCache = autofanStateVar;
	if( (autofanStateVar) && (autofanStateVar < autofanStateMax) )
	    autofanStateVar += 1;
	autofanStateVarPrev = stateCache;
    }
    else if( reqAction == "DOWN" ) {
	if( autofanStateVar > 1 ) {
	    var stateCache = autofanStateVar;
	    autofanStateVar -= 1;
	    autofanStateVarPrev = stateCache;
	}
    }
    else if( reqAction == "SHIFT" ) {
	var toState = req.body.state;
	if((autofanStateVar)
	   && (toState)
	   && (toState > 0)
	   && (toState <= autofanStateMax)
	   && (toState != autofanStateVar))
	{
	    var stateCache = autofanStateVar;
	    autofanStateVar = toState;
	    autofanStateVarPrev = stateCache;
	}
    }
    
    res.send({ state: autofanStateVar });
});
	
app.listen(autofanPort, function() {
    console.log('Listening on port '+ autofanPort +'.');
});
