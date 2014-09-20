var express = require('express');
var path = require('path');
var app = express();

app.use( express.static( path.join( __dirname, 'example') ) ) ;

app.listen(9999);
