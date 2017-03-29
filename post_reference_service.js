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

// Global Response code - by default, the response code will always be 200.
// It will only change if there is any different result (e.g. errors)
var responseCode = '200'; 

var Server = https.createServer(options, function (request , response) {
  console.log("Request Received: " + request.method);
  var body = [];
  if (request.method === "POST") {
    request.on('data', function(chunk) {
      body.push(chunk);
      console.log("chunking");
    }).on('end', function() {
      body = Buffer.concat(body).toString('utf-8');
      console.log(body);
      // This would be needed if getting the information via a standard form
      var post_request = JSON.parse(body);
      console.dir(post_request, {depth: null, colors: true});


      // Current issue - currently, I have no method of incrementing an ID (yet)
      post_request['_id'] = 123475;

      
      console.log("Attempting to connect to Mongo...");
      MongoClient.connect('mongodb://127.0.0.1:27017/test', function(error, database) {
        if (!error) {
          // Test if the username meets the requirement
          if (!post_request.dbname || !post_request.user_id || !post_request.folder_name) {
            console.log("invalid - some crucial fields were left blank.");
            // Return unsuccessful headers
            
          } else {
            console.log('Querying the Mongo DB for the UserID');
            // Query the MongoDB server, check if the User ID exists already
            var collection = database.collection('db_test_name');
            collection.find({'user_id' : post_request.user_id }).toArray(function(error,results){
              var number_of_results = 0;
              var matching_folder = 0;
              var matching_folder_id = [];
              for (var i = 0; i < results.length; i++) {
                number_of_results++;
                if (post_request.dbname === results[i].dbname) {
                  matching_folder++;
                  matching_folder_id.push(results[i]._id);
                }
              }
              // Print out the result of the check to the console
              console.log('Results of check:');
              console.log(number_of_results);
              console.log(matching_folder);
              console.log("" + matching_folder_id + "");
              
              // If the User ID exists and there is a matching folder name
              if (number_of_results > 0 && matching_folder > 0) {
                console.log("There are", number_of_results, "results that have the same User ID as the POST information.");
                console.log("There are", matching_folder, "folders with the same name.");
                console.log("There should only be one matching folder.");
                // Update the current DB record
                var collection = database.collection('db_test_name');
                collection.update({_id : matching_folder_id[0]}, post_request, function(error, results){
                  if (!error) {
                    if (results.result.n == 1) {
                      // Updated record. Return HTTP status code.
                      console.log("Updated ID", matching_folder_id[0]);
                    } else {
                      // Information was not updated because the ID does not exist now.
                      // Retry to create a new record in the collection
                      console.log("Did not update record at ID", matching_folder_id[0], ".");
                      console.log("Debugging information:");
                      console.log(results.result);
                    }
                  }
                });
              } else if (number_of_results === 0 && matching_folder === 0) {
                console.log('Insert the new record into the database');
                var collection = database.collection('db_test_name');
                collection.insert(post_request, function (error, results){
                  if (!error) {
                    console.log('Successfully inserted the record into Mongo');
                  } else {
                    console.dir(error, {depth: null, colors: true});
                    responseCode = '400';
                  }
                  database.close();
                });
              }
            });
          }
        } else {
          console.log("ERROR: " + error);
          //response.setHeader("Access-Control-Allow-Origin", "*");
          responseCode = '400';
        }
      });

      // No matter the output, the responseCode is added to the request.
      // This ensures that the client will receive the status code.
      // The status code is, by default, 200, so if there
      // is any success with the form, then the status code is sent back

      // for debugging, requests across origins have been allowed.
      response.writeHeader(responseCode, {"Access-control-allow-origin" : "*", "Content-Type" : "text/plain"});
      response.end("" + responseCode + "");
    });
    
  } else if (request.method === "GET") {
    // Check the User ID and the dbname
    // 0. Parse the query string sent to the script
    // 1. Query Mongo, using the User ID and the Folder Name given
    // 2. If there is at least more than one mention of the user ID and the DBname
    //    in the Mongo DB, then accept the request
    // 3. Return the request to the database, formatting it as JSON
    // 4. End connection
    // If there are any errors during the process, then return HTTP status codes

    // 0. Parse the query 
    var get_request = url.parse(request.url, true).query;
    console.log(get_request);

    var get_return_payload = '';
    
    MongoClient.connect('mongodb://127.0.0.1:27017/test', function(error, database) {
    if (!error) {
      // No error, checking the User ID
      if (!get_request.user_id && !get_request.folder_name) {
        // 1. Query Mongo, using the User ID and the Folder Name
        var collection = database.collection('db_test_name');
        collection.find({user_id: get_request.user_id, folder_name:get_request.folder_name}).toArray(function (error, results){
  
          var number_of_results = 0;
          var matching_folder_name_id = [];
          for (i = 0; i < results.length; i++) {
            number_of_results++;
            matching_folder_name_id.push(results[i]._id);
          }
  
          if (number_of_results === 1 && matching_folder_name_id.length === 1) {
            // Right result - exactly what we need to return the folder for the user
            get_return_payload = JSON.toString(results[0]);
            console.log('Right Result');
          } else if (number_of_results > 1 && matching_folder_name_id.length > 1) {
            // There is more than one - worry
            console.log('Wrong Result');
          } else {
            // If there is nothing to get, just set the header
            // variable and leave it at that.
            console.log('Very Wrong Result');
          }
        });
      } else {
        console.log('Error Opening DB');
        console.log(error);
      }
      } else {
        // There was an error during the GET request
        console.log('Error - Get Request');
        console.log(get_request.user_id);
      }
    });
    // 4. Return the result, if any
    response.writeHeader("200", {"Access-control-allow-origin" : "*", "Content-Type" : "text/plain"});
    response.end("" + get_return_payload + "");
  } else {
    // Unknown request - defaults to 400 - Forbidden
    response.writeHeader("400", {"Access-control-allow-origin" : "*", "Content-Type" : "text/plain"});
    response.end("" + responseCode + "");
  }
});

Server.listen(PORT, IP_ADDR, function () {
    console.log("Listening..." + IP_ADDR + ":" + PORT);
});
