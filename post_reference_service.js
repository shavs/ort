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
    PORT = '8080',
    URL_ADDR = 'https://localhost';

var privateKey = fs.readFileSync("key.pem").toString();
var certificate = fs.readFileSync("cert.pem").toString();

var options = {
  key: privateKey,
  cert: certificate
}

var Server = https.createServer(options, function (request , response) {
  console.log("Request Recieved" + request.method);
  var body = [];
  if (request.method === "POST") {
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


      // Current issue - currently, I have no method of incrementing an ID
      post_request['_id'] = 123474;
      console.log("Attempting to connect to Mongo...");

      MongoClient.connect('mongodb://127.0.0.1:27017/test', function(error, database) {
        if (!error) {
          // Test if the username meets the regex requirement
          if (!post_request.dbname || !post_request.user_id || !post_request.folder_name) {
            console.log("invalid - some crucial fields were left blank.");
            // Return unsuccessful headers
            
          } else {
            console.log('Querying the Mongo DB for the UserID');
            // Query the MongoDB server, check if the User ID exists already
            var query_user_id = database.collection('db_test_name');
            query_user_id.find({'user_id' : post_request.user_id }).toArray(function(error,results){
              var number_of_results = 0;
              var matching_folder = 0;
              for (var i = 0; i < results.length; i++) {
                number_of_results++;
                if (post_request.dbname === results[i].dbname) {
                  matching_folder++;
                }
              }
              console.log('Results of check:');
              console.log(number_of_results);
              console.log(matching_folder);
              // If the User ID exists and there is a matching folder name
              if (number_of_results > 0 && matching_folder > 0) {
                console.log("There are", number_of_results, "results that have the same User ID as the POST information.");
                // Update the current DB record

                var collection = database.collection('db_test_name');
                // Update the number of records in the database
              } else if (number_of_results === 0 && matching_folder === 0) {
                console.log('Insert the new record into the database');
                var collection = database.collection('db_test_name');

                collection.insert(post_request, function (error, results){
                  if (!error) {
                    console.log('Successfully inserted the record into Mongo');
                  } else {
                    console.dir(error, {depth: null, colors: true});
                    response.writeHead(400, {"Content-Type" : "text/plain"});
                    response.end("" + response.statusCode + "");
                  }
                  database.close();
                });
                
              }
              
            });
          }
        } else {
          console.log("ERROR: " + error);
          //response.setHeader("Access-Control-Allow-Origin", "*");
          response.writeHead(400, {"Content-Type" : "text/plain"});
          response.end("" + response.statusCode + "");
        }
      });
      //response.setHeader("Access-Control-Allow-Origin", URL_ADDR + ":" + PORT + "/");
      //response.setHeader("Access-Control-Allow-Origin", "*");
      response.writeHead(200, {"Content-Type" : "text/plain"});
      response.end("" + response.statusCode + "");
    });
    
  } else if (request.method === "GET") {
    // Check the User ID and the dbname
    // 1. Query Mongo
    // 2. Get the User ID and the DBname
    // 3. If there is at least more than one mention of the user ID and the DBname
    //    in the Mongo DB, then accept the request
    // 4. Return the request to the database, formatting it as JSON
    // 5. End connection
    // If there are any errors during the process, then return HTTP status codes
    //
  }
});

Server.listen(PORT, IP_ADDR, function () {
    console.log("Listening..." + IP_ADDR + ":" + PORT);
});
