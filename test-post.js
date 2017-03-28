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
    PORT = '8080';

var privateKey = fs.readFileSync("key.pem").toString();
var certificate = fs.readFileSync("cert.pem").toString();

var options = {
  key: privateKey,
  cert: certificate
}

var Server = https.createServer(options, function (request , response) {
  console.log("Request Recieved" + request.url);
  var body = [];
  
  request.on('data', function(chunk) {
    body.push(chunk);
    console.log("chunking");
  }).on('end', function() {
    body = Buffer.concat(body).toString('utf-8');
    console.log(body);
    // This would be needed if getting the information via a standard form
    //var post_request = qs.parse(body);
    var post_request = JSON.parse(body);
    console.dir(post_request, {depth: null, colors: true});
    
    console.log("Attempting to connect to Mongo...");

    MongoClient.connect('mongodb://127.0.0.1:27017', function(error, database) {
      if (!error) {
        // Test if the username meets the regex requirement
        if (!post_request.dbname || !post_request.user_id || !post_request.folder_name) {
          console.log("invalid - some crucial fields were left blank.");
        } else {
          // Query the MongoDB server, check if the User ID exists already
          if (!search.user_id || post_request.user_id !== search.user_id) {
            console.log('User ID does not match.');

            // Return Unauthorised.
          } else {
            // User ID matches, next
          }
        }
        
        
        var test = database.collection('dbname');
        test.insert({author: post_request.author, title:post_request.title, date_accessed: post_request.date_accessed, date_published:post_request.date_published }, function (error, results) {
          if(!error) {
            console.log("added the requested information");
            // Validate by finding the information within Mongo and displaying to the user
          } else {
            console.log(error);
            // Return the status code here
            response.writeHeader(400, {"Content-Type" : "text/plain"});
            response.end("" + response.statusCode + "");
          }
          database.close();
        });
      } else {
        console.log("ERROR: " + error);
        response.writeHeader(400, {"Content-Type" : "text/plain"});
        response.end("" + response.statusCode + "");
      }
    });
    response.writeHeader(200, {"Content-Type" : "text/plain"});
    response.end("" + response.statusCode + "");
  });
});

Server.listen(PORT, IP_ADDR, function () {
    console.log("Listening..." + IP_ADDR + ":" + PORT);
});
