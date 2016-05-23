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

// Service Discovery code
var dgram = require('dgram');

var autofanDiscoverPort = 3001;

var broadcastListener = dgram.createSocket('udp4');

broadcastListener.on('listening', function () {
    var address = broadcastListener.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

broadcastListener.on('message', function (message, remote) {
    console.log(remote.address + ':' + remote.port +' - ' + message);

    // Selectively respond to the sender's port with the autofan port
    if( message=="AFDCRQ" ) {
	var message = new Buffer(String(autofanPort));

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
