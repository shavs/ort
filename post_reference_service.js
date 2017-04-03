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

// Requires for the API functionality
var save_references = require('./save_references.js');
var get_references = require('./get_references.js');

// Global Response code - by default, the response code will always be 200.
// It will only change if there is any different result (e.g. errors)

var Server = https.createServer(options, function (request , response) {
  console.log("[MAIN] Request Received. Parsing URL...");

  // Parse the URL for the right path
  var url_data = url.parse(request.url, true);

  console.log("[MAIN] URL Requested: ", url_data);

  if (url_data.pathname === '/api/get_references') {
    console.log('[MAIN] Get References requested: ', url_data.pathname);
    // Get References from a URL.
    get_references(request, response);
  } else if (url_data.pathname === '/api/save_references') {
    console.log('[MAIN] Save References requested: ', url_data.pathname);
    // Save references to a URL
    save_references(request, response);
  } else if (url_data.pathname === '/' || url_data.pathname === "/index.html"){
    console.log('[MAIN] Home Page requested.');
    // Send the client the home page, by reading the index.html page,
    // converting it to a string, and then returning it to the client
    // with the proper content type
    fs.readFile('index.html', "binary", function (error, index_file){
      if (!error){
        // No errors, show the page
        response.writeHead(200, { 'Content-Type' : "text/html" });
        var str = index_file.toString();
        response.write(index_file);
        response.end();
      } else {
        // Return 404 to the client - no index file can be found, and we
        // are in deep trouble!
      }
      
    });
  } else {
    console.log("[MAIN] It's a request we aren't looking for - let it pass through.");
    // Read out a 404 page, return this to the client along with a custom 404
    // page for the end user.
  }
  
  //if (request.method === "POST") {
    //// Do nothing - the URL parsing should be taking effect right now.
  //} else if (request.method === "GET") {
  //} else {
    //// Unknown request - defaults to 400 - Forbidden
    //response.writeHeader("400", {"Access-control-allow-origin" : "*", "Content-Type" : "text/plain"});
    //response.end("" + responseCode + "");
  //}
});

Server.listen(PORT, IP_ADDR, function () {
    console.log("[MAIN] Listening..." + IP_ADDR + ":" + PORT);
});
