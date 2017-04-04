var http = require("http");
var https = require("https");
var fs = require("fs");
var util = require("util");
var url = require("url");
var path = require("path");
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require('mongodb').ObjectID;

function save_references (request, response) {
  var body = [];
  
  if (request.method === "POST") {
    request.on("data", function(chunk) {
      body.push(chunk);
      console.log("  [SAVE_REFERENCES] Chunking the POST request stream.");
    }).on("end", function() {
      body = Buffer.concat(body).toString("utf-8");
      console.log("  [SAVE_REFERENCES] Result of chunking: ", body);
      // This would be needed if getting the information via a standard form
      var post_request = JSON.parse(body);
      console.log('   [SAVE_REFERENCES] Parsed JSON body of the POST request:');
      console.dir(post_request, {depth: null, colors: true});

      // In order to make sure that the user does not create a "new" filename
      // by adding spaces to it, ECMAScript 6 supports .trim().
      // This is similar to the Python method of stripping whitespace before
      // and after a variable.

      console.log('  [SAVE_REFERENCES] Trimming whitespace');
      post_request.dbname = post_request.dbname.trim();
      post_request.user_id = post_request.user_id.trim();
      post_request.folder_name = post_request.folder_name.trim();
      console.log('  [SAVE_REFERENCES] Trimmed whitespace output:', post_request.dbname, "\n", post_request.user_id, "\n", post_request.folder_name);
      
      console.log("  [SAVE_REFERENCES] Attempting to connect to MongoDB.");
      MongoClient.connect("mongodb://127.0.0.1:27017/test", function(error, database) {
        if (!error) {
          // Test if the username meets the requirement
          if (!post_request.dbname || !post_request.user_id || !post_request.folder_name) {
            console.log("  [SAVE_REFERENCES] Invalid - crucial fields were left blank.");
            // Return unsuccessful headers
            generateResponse(400, response);
          } else {
            console.log("  [SAVE_REFERENCES] Check if the User ID was created by the server...");
            var collection = database.collection("user_ids");
            collection.find({user_id:post_request.user_id}).toArray(function(error, results){
              var user_id_results = 0;
              var user_id_match = [];
              for (i = 0; i < results.length; i++) {
                user_id_results++;
                if (post_request.user_id === results[i].user_id) {
                  user_id_match.push(results[i].user_id);
                }
              }
              console.log("  [SAVE_REFERENCES]");
              console.log("  Results of UUID check:");
              console.log("  Number of UUID results:", user_id_results);
              console.log("  UUIDs found:", user_id_match);
              console.log("  Ideally, there should be only one User ID found.");

              if (user_id_results === 1 && user_id_match[0] === post_request.user_id) {
                console.log("  [SAVE_REFERENCES] The UUID found was correct.");
                console.log("  [SAVE_REFERENCES] Querying MongoDB for the user_id");
                // Query the MongoDB server, check if the folder and User ID exists
                var collection = database.collection("database_one");
                collection.find({'user_id' : post_request.user_id }).toArray(function(error,results){
                  var number_of_results = 0;
                  var matching_folder = 0;
                  var matching_folder_id_true = 0;
                  var matching_folder_id = [];
                  for (var i = 0; i < results.length; i++) {
                    number_of_results++;
                    if (post_request.folder_name === results[i].folder_name) {
                      matching_folder++;
                      matching_folder_id.push(results[i]._id);
                    }
                  }
                  // Print out the result of the check to the console
                  console.log('  [SAVE_REFERENCES]');
                  console.log("Results of check:");
                  console.log("Number of results:", number_of_results);
                  console.log("Number of folders:", matching_folder);
                  console.log("Folder IDs Collected: " + matching_folder_id + "");
                  console.log("Is there a matching folder ID? (matches the array number in the array above): " +  matching_folder_id_true);
    
                  // If the User ID exists and there is a matching folder name
                  if (number_of_results >= 1 && matching_folder === 1) {
                    console.log("There are", number_of_results, "result(s) that have the same User ID as the POST information.");
                    console.log("There are", matching_folder, "folder(s) with the same name.");
                    console.log("To update a reference, there should be at least 1 matched folder");
                    // Update the current DB record
    
                    // MongoDB does not like it when updating the _id of the field -
                    // therefore, the field needs to be removed from the data.
                    post_request["_id"] = matching_folder_id[0];
                    console.log('  [SAVE_REFERENCES] Reassigned _id:', post_request["_id"]);
                    
                    var collection = database.collection("database_one");
                    collection.update({'user_id': post_request.user_id, 'folder_name': post_request.folder_name}, post_request, function(error, results){
                      if (!error) {
                        if (results.result.n == 1) {
                          // Updated record.
                          console.log("  [SAVE_REFERENCES] Updated _id", matching_folder_id[0]);
                          // Generate Response Code
                          generateResponse(200, response);
                        } else {
                          // Information was not updated because the ID does not exist now.
                          // Retry to create a new record in the collection
                          console.log("  [SAVE_REFERENCES] Did not update record at ID", matching_folder_id[0], ".");
                          console.log("  [SAVE_REFERENCES] Debugging information:");
                          console.log(results.result);
                          // Generate response code
                          generateResponse(400, response);
                        }
                      } else {
                        console.log("  [SAVE_REFERENCES] An Error Occurred Updating the MongoDB record:");
                        console.dir(error, {depth: null, colors: true});
                        // Generate response code
                        generateResponse(400, response);
                      }
                    });
                  } else if (number_of_results >= 0 && matching_folder === 0) {
                    console.log("  [SAVE_REFERENCES] Insert the new record into the database");
                    var collection = database.collection("database_one");
                    collection.insert(post_request, function (error, results){
                      if (!error) {
                        console.log("  [SAVE_REFERENCES] Successfully inserted the record into Mongo");
                        generateResponse(200, response);
                      } else {
                        console.log("  [SAVE_REFERENCES] Inserting a new record failed:");
                        console.dir(error, {depth: null, colors: true});
                        // 400
                        generateResponse(400, response);
                      }
                      database.close();
                    });
                  }
                });
              } else {
                console.log("  [SAVE_REFERENCES] There was an error checking if the User ID exists.");
                generateResponse("400", response);
              }
            });
          }
        } else {
          console.log("  [SAVE_REFERENCES] ERROR: " + error);
          generateResponse(400, response);
        }
      });

      // No matter the output, the responseCode is added to the request.
      // This ensures that the client will receive the status code.
      // The status code is, by default, 200, so if there
      // is any success with the form, then the status code is sent back

      // for debugging, requests across origins have been allowed.
      //console.log("Response code generated:", responseCode);
      //response.writeHeader(responseCode, {"Access-control-allow-origin" : "*", "Content-Type" : "text/plain"});
      //response.end("" + responseCode + "");
    });
  }
}

// Replaced global variable with a function - accepts the response status code
// and the response of the service
function generateResponse (responseCode = "404", response) {
  console.log("Response code generated:", responseCode);
  response.writeHeader(responseCode, {"Access-control-allow-origin" : "*", "Content-Type" : "text/plain"});
  response.end("" + responseCode + "");
}

// This allows the main function of the script to be "exportable", usable in
// other scripts.
module.exports = save_references;
