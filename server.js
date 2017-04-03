// Core requirements for setting up a new HTTPS server
var http = require("http");
var https = require("https");
var fs = require("fs");

// Utility to pretty-print to console, inc. colours and formatting
// Also allows use of console.dir, which can make pretty-printing of the JSON
// easier
var util = require("util");

// Core Dependancies - needed in order to specify new resources
var url = require("url");
var path = require("path");

// Node.JS driver for Mongo - there are many different types of driver,
// depending on the language
// (e.g. C#, C, ...)
var MongoClient = require('mongodb').MongoClient;

// IP Address, Port Number and URL for the Server
// These can be changed to fit the environment
var IP_ADDR = '127.0.0.1',
    PORT = '8080',
    URL_ADDR = 'https://localhost';

// Parsing the security keys needed for Node JS
var privateKey = fs.readFileSync("key.pem").toString();
var certificate = fs.readFileSync("cert.pem").toString();

// Certificates needed for HTTPS
var options = {
  key: privateKey,
  cert: certificate
}


var server = https.createServer(options, function (request, response) {
  // First, log the request made:
  console.log('Request: ', request.url, request.method);
  // Next, determine what needs to be returned by looking at the URL.
  
  
});


server.listen(PORT, IP_ADDR, function () {
    console.log("Listening..." + IP_ADDR + ":" + PORT);
});

