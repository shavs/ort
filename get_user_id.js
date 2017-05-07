//get_user_id
var http = require("http");
var https = require("https");
var fs = require("fs");
var util = require("util");
var url = require("url");
var path = require("path");
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require('mongodb').ObjectID;

// Require UUIDs.
var uuidV4 = require('uuid/v4');
// UUIDs are individual values assigned, they have a change of
// around 1-in-a-million collision - therefore, even if the service
// was spammed with requests, the number of IDs generated would be significantly
// less. 

// Function to get the user ID
function get_user_id (request, response) {

  if (request.method === "GET") {
    console.log("  [GET_USER_ID] Right Method of request:", request.method);

    // 1. Create the UUID
    // 2. Add the UUID to a dedicated collection of user_ids
    // 3. Return the UUID to the client, in the form of a JSON object
    // 4. Script complete

    // 1. Create the UUID
    var new_id = uuidV4();
    console.log("  [GET_USER_ID] Created the UUID:", new_id);
    console.log("  [GET_USER_ID] Connecting to MongoDB...");
    
    // 2. Add the UUID to a dedicated collection of user_ids
    MongoClient.connect("mongodb://127.0.0.1:27017/test", function(error, database) {
      if (!error) {
        console.log("  [GET_USER_ID] Connected to MongoDB.");

        // 2a. Query Mongo DB, test if the UUID already exists
        var collection = database.collection("user_ids");
        collection.find({user_id : new_id}).toArray(function(error,results){
          if (!error) {
            // 2b. If the UUID does not match, insert it into the DB
            // 2c. If the UUID does match, ask the client to try again
  
            var number_of_results = 0;
            var matched_uuid = [];
            for (i = 0; i < results.length; i++) {
              number_of_results++;
              if (user_id === uuid) {
                console.log("  [GET_USER_ID] Matched UUID - something is wrong.");
                matched_uuid.push(results[i]);
              }
            }
            console.log("\n  [GET_USER_ID] Search Results:");
            console.log("  Number of results found:", number_of_results);
            console.log("  UUIDs Matched: ", matched_uuid);
            console.log("  The chances of a UUID collision is 1 in 1,000,000,000.");
            console.log("  In the event of a collision, we are going to check anyway.");
  
            if (number_of_results === 0 && matched_uuid.length === 0) {
              // 2d. Add the UUID to the collection of User IDs
              console.log("  [GET_USER_ID] No UUID matches, inserting it into the user_ids collection.");
              var collection = database.collection("user_ids");
              collection.insert({user_id: new_id}, function (error, results){
                if (!error) {
                    console.log("  [GET_USER_ID] Successfully inserted the record into MongoDB");
                    // Create the neccessary JSON to output
                    var get_user_id_result = {
                      "user_id" : new_id
                    }

                    var get_user_id_payload = JSON.stringify(get_user_id_result);
                    generateResponse(200, response, get_user_id_payload);
                  } else {
                    console.log("  [GET_USER_ID] Inserting a new record failed:");
                    console.dir(error, {depth: null, colors: true});
                    // 400
                    generateResponse(400, response);
                  }
                  database.close();
              });
            } else {
              // There was a match for the UUID
              console.log("  [GET_USER_ID] There was a match for the User ID.");
              generateResponse("500", response);
            }
          } else {
            console.log("  [GET_USER_ID] Error when querying MongoDB for the User ID:");
            console.log(error);
            generateResponse("500", response);
          }
        });
      } else {
        console.log("  [GET_USER_ID] Error occured when connecting to MongoDB.");
        console.log(error);
        // Return a 500 error code
        generateResponse("500", response);
      }
    });
  } else {
    // Return error to the client
    console.log("  [GET_USER_ID] Wrong Method of request:", request.method);
    generateResponse("400", response);
  }
}

function generateResponse (responseCode = "404", response, get_user_id_payload = "") {
  console.log("  [GET_USER_ID] Response code generated:", responseCode);
  console.log("  [GET_USER_ID] Payload created:", get_user_id_payload);
  if (!get_user_id){
    response.writeHeader(responseCode, {"Access-control-allow-origin" : "*", "Content-Type" : "text/plain"});
    response.end("" + responseCode + "");
  } else {
    response.writeHeader(responseCode, {"Access-control-allow-origin" : "*", "Content-Type" : "application/json"});
    response.end(get_user_id_payload);
  }
}

// Export the function as the main module
module.exports = get_user_id;

// UUID Explanation
// http://stackoverflow.com/a/2117523
// https://en.wikipedia.org/wiki/Universally_unique_identifier
// Used commonly in EXT4 filesystems, it is a unique identifier that has an extremely low chance of collision.
// Unlike the attack on SHA-1, whereby the chance of collision has now been reduced to practically zero, it is still a safe method of creating a unique ID.
// One thing may need to be added to the server however - a checking references script. This would need to be done to ensure that the end users are
// not just bots, and that legitimate references are being created by the client-side.


