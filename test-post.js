var http = require("http");
var https = require("https");
var fs = require("fs");

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
    var post_request = qs.parse(body);
    console.log(post_request);
    console.log("Attempting to connect to Mongo...");
    MongoClient.connect('mongodb://127.0.0.1:27017',
      function(error, database) {
        if (!error) {
          // Here, the type of data needs to be determined, by parsing the form information
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
