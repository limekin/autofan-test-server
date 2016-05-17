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

    switch( reqAction ) {
    // ON action - Master switch; other commands active only after issuing this command
    case "ON": {
	if( !autofanStateVar ) {
	    autofanStateVar = 1;
	    autofanStateVarPrev = 0;
	}
    }
	break;
    // OFF action - Ends the autofan session
    case "OFF": {
	autofanStateVar = 0;
	autofanStateVarPrev = 0;
    }
	break;
    // TOGGLE action - When autofan is active, it toggles autofan from off  to last state
    case "TOGGLE": {
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
	break;
    // UP action - When autofan active, ups the speed by one unit
    case "UP": {
	var stateCache = autofanStateVar;
	if( (autofanStateVar) && (autofanStateVar < autofanStateMax) )
	    autofanStateVar += 1;
	autofanStateVarPrev = stateCache;
    }
	break;
    // DOWN action - When autofan active, downs the speed by one unit
    case "DOWN": {
	if( autofanStateVar > 1 ) {
	    var stateCache = autofanStateVar;
	    autofanStateVar -= 1;
	    autofanStateVarPrev = stateCache;
	}
    }
	break;
    // SHIFT action (requires "state" field in POST data) - When autofan active, shifts the speed to the state provided
    case "SHIFT": {
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
	break;
    }
    
    res.send({ state: autofanStateVar });
});
	
app.listen(autofanPort, function() {
    console.log('Listening on port '+ autofanPort +'.');
});
