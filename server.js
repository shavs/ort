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
var get_user_id = require("./get_user_id.js");
var delete_folder = require("./delete_folder.js");


// Global Response code - by default, the response code will always be 200.
// It will only change if there is any different result (e.g. errors)

var Server = https.createServer(options, function (request , response) {
  console.log("[MAIN] Request Received. Parsing URL...");

  // Parse the URL for the right path
  var url_data = url.parse(request.url, true);

  console.log("[MAIN] URL Requested: ", url_data);

  if (url_data.pathname === '/api/get_references') {
    console.log('[MAIN] Get References requested: ', url_data.pathname);
    // Get References
    get_references(request, response);
  } else if (url_data.pathname === '/api/save_references') {
    console.log('[MAIN] Save References requested: ', url_data.pathname);
    // Save references
    save_references(request, response);
  } else if (url_data.pathname === "/api/delete_folder"){
    console.log("[MAIN] Delete Folder requested: ", url_data.pathname);
    // Delete folder
    delete_folder(request, response);
  } else if (url_data.pathname === "/api/get_user_id") {
    console.log("[MAIN] Get User ID requested: ", url_data.pathname);
    // Request a user ID
    get_user_id(request, response);

  } else if (url_data.pathname === "/test_web_services.html") {
    console.log("[MAIN] Requesting old Test Web Services page.");
    fs.readFile("test_web_services.html", "binary", function(error, test_file){
      if (!error) {
        // No errors, write the test page out
        response.writeHead(200, {"Content-Type" : "text/html"});
        var str = test_file.toString();
        response.write(test_file);
        response.end();
      } else {
        console.log("[MAIN] Test Web Services not found");
        response.writeHeader(404, {"Content-Type" : "text/plain"});
        response.end("" + 404 + "");
      }
      
    });
  } else if (url_data.pathname === "/" || url_data.pathname === "/index.html"){
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
        console.log("[MAIN] Index File not found");
        response.writeHeader(404, {"Content-Type" : "text/plain"});
        response.end("" + 404 + "");
      }
      
    });
  } else {
    console.log("[MAIN] It's a request we aren't looking for - let it pass through.");
    fs.readFile("." + url_data.pathname, "binary", function(error, requested_file){
      if (!error) {
        // No error loading the file, continuing with the request
        console.log("[MAIN] Providing requested file");
        response.writeHead(200);
        var str = requested_file.toString();
        response.write(requested_file);
        response.end();
      } else {
        console.log("[MAIN] File not found");
        response.writeHeader(404, {"Content-Type" : "text/plain"});
        response.end("" + 404 + "");
      }
    });
  }
});

Server.listen(PORT, IP_ADDR, function () {
    console.log("[MAIN] Listening..." + IP_ADDR + ":" + PORT);
});
