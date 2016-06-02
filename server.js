var fs = require("fs");
var content = fs.readFileSync("data/meta.json");
console.log("Output Meta Content:\n"+ content);

// store meta content as JSON object
var metaObj = JSON.parse(content);

var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var autofanPort = 3000;

var autofanStateVar = 0;
var autofanStateVarPrev = 0;
var autofanStateMax = metaObj.properties.speeds;

// Middleware used to protect routes by checking for valid tokens.
var token_validator = function(req, res, next) {
    // We dont have to validate tokens for these paths.
    var excludedPaths = ['/auth', '/meta'];
    if(excludedPaths.indexOf(req.path) != -1) {
            next(); return;
    }

    // Get token from either query param or post data.
    var token = req.body.token || req.query.token;
    if(! token) res.status(401).send({
            error: 'Bad authentication details.'
    });

    // Okay we have a token. Lets get the clients first.
    var clients = JSON.parse( fs.readFileSync("data/clients.js") );
    for(var i=0; i<clients.length; ++i) {
            var client = clients[i];
            if(client.token == token) {
                   // If the difference is more than 1 day, token expired.
                   if(Date.now() - client.token_expiry > 24*60*60) {
                           res.status(401).send({
                                error: 'Your token has been expired, please authenticate again.'
                           }); return;
                   } else {
                           next(); return;
                   }
            }
    }

    // Token stranger.
    res.status(401).send({
            error: 'Invalid token'
    });
};

app.use(token_validator);

app.get('/meta', function(req,res) {
    res.send(metaObj.properties);
});

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

// Service Discovery code
var dgram = require('dgram');

var autofanDiscoverPort = 3001;

var broadcastListener = dgram.createSocket('udp4');

broadcastListener.on('listening', function () {
    var address = broadcastListener.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

var assistedConnect = 0;

broadcastListener.on('message', function (message, remote) {
    console.log(remote.address + ':' + remote.port +' - ' + message);

    // Selectively respond to the sender's port with the autofan port
    if( message=="AFDCRQ" || (message=="AFACRQ" && assistedConnect) ) {
	var message = new Buffer(JSON.stringify({port: autofanPort, id: metaObj.id, label: metaObj.label}));

	var udpResponder = dgram.createSocket('udp4');
	udpResponder.send(message, 0, message.length, remote.port, remote.address, function(err, bytes) {
	    if (err)
		throw err;
	    console.log('UDP Response sent to ' + remote.address +':'+ remote.port);
	    udpResponder.close();
	});
    }
});

broadcastListener.bind(autofanDiscoverPort, '');

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
      assistedConnect = 1;
      setTimeout(function () { assistedConnect = 0; console.log('Assisted Connect disabled!');}, 3000);
      console.log('Assisted Connect enabled!');
  }
});
