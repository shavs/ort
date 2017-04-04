var http = require("http");
var https = require("https");
var fs = require("fs");
var util = require("util");
var url = require("url");
var path = require("path");
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require('mongodb').ObjectID;

function get_references (request, response) {
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

  var get_return_payload = "";
  
  MongoClient.connect("mongodb://127.0.0.1:27017/test", function(error, database) {
  if (!error) {
    // No error, checking the User ID
    if (!get_request.user_id && !get_request.folder_name) {
      // There was an error opening the MongoDB connection
      console.log("Error - core information missing.");
      console.log(error);
      generateResponse(500, response);
    } else {
      // 1. Query Mongo, using the User ID and the Folder Name
      var collection = database.collection("database_one");
      collection.find({user_id: get_request.user_id, folder_name:get_request.folder_name}).toArray(function (error, results){

        var number_of_results = 0;
        var matching_folder_name_id = [];
        for (i = 0; i < results.length; i++) {
          number_of_results++;
          matching_folder_name_id.push(results[i]._id);
        }

        if (number_of_results === 1 && matching_folder_name_id.length === 1) {
          // Right result - exactly what we need to return the folder for the user
          get_return_payload = JSON.stringify(results[0]);
          // Attach payload to write to the response obj
          
          console.log("Right Result");
          generateResponse(200, response, get_return_payload);
        } else if (number_of_results > 1 && matching_folder_name_id.length > 1) {
          // There is more than one - worry
          console.log("Wrong Result - more than one result, and the length of the ID array is longer than 1");
          generateResponse(400, response);
        } else {
          // If there is nothing to get, just set the header
          // variable and leave it at that.
          console.log("Very Wrong Result");
          generateResponse(400, response);
        }
      });
    }
  } else {
    // There was an error during the GET request
    console.log("Error - Get Request");
    console.log(get_request.user_id);
    generateResponse(400, response);
   }
  });
  // 4. Return the result, if any
  //response.writeHeader("200", {"Access-control-allow-origin" : "*", "Content-Type" : "text/plain"});
  //response.end("" + get_return_payload + "");
  //generateResponse(responseCode = "404", response);
}

function generateResponse (responseCode = "404", response, get_return_payload) {
  console.log("Response code generated:", responseCode);
  console.log(get_return_payload);
  if (!get_return_payload) {
    response.writeHeader(responseCode, {"Access-control-allow-origin" : "*", "Content-Type" : "text/plain"});
    response.end("" + responseCode + "");
  } else {
    response.writeHeader(responseCode, {"Access-control-allow-origin" : "*", "Content-Type" : "application/json"});
    //response.json(get_return_payload);
    response.end(get_return_payload);
  }
}


// export module 
module.exports = get_references;
