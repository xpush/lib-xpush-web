var express = require('express');
var path = require('path');
var app = express();

app.use( express.static( path.join( __dirname, 'example') ) ) ;


var XPush = require('./example/xpush-client');

var xpush = new XPush('http://demo.stalk.io:8000', 'sample');

setTimeout( function (){
	xpush.signup( 'james1', '1234', function(err,data){
  	console.log('register success : ', data);
	}); 
}, 1000);

app.listen(9999);