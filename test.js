var express = require('express');
var path = require('path');
//var io = require('socket.io-client');
var app = express();

app.use( express.static( path.join( __dirname, 'example') ) ) ;

/**
var XPush = require('./dist/xpush-client');

var xpush = new XPush('http://demo.stalk.io:8000', 'demo');

xpush.createSimpleChannel('channel-dashboard', function(){

});
*/

app.listen(9999);
