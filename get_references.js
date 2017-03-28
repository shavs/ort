var http = require("http");
var https = require("https");
var fs = require("fs");

// Utility to pretty-print to console, inc. colours and formatting
// Also allows use of console.dir, which can make pretty-printing of the JSON
// easier
var util = require("util");

var url = require("url");
var path = require("path");
var qs = require("querystring");
var MongoClient = require('mongodb').MongoClient;

var IP_ADDR = '127.0.0.1',
    PORT = '8090';

var privateKey = fs.readFileSync("key.pem").toString();
var certificate = fs.readFileSync("cert.pem").toString();


var options = {
  key: privateKey,
  cert: certificate
}

var Server = https.createServer(options, function (request , response) {
  console.log("Request Recieved" + request.url);
  
  
});
