// delete_folder
var http = require("http");
var https = require("https");
var fs = require("fs");
var util = require("util");
var url = require("url");
var path = require("path");
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require('mongodb').ObjectID;

// A script that will remove the requested folder

function delete_folder (request, response) {
  // Steps to delete the folder from the server side
  // 1. Check the request method (should be POST)
  // 1a. Parse the POST request - the request should be JSON
  
  // 2. Check if the request contained the:
  //   - Folder Name
  //   - User ID
  // 2a. Connect to MongoDB
  // 2b. Query MongoDB for the User ID
  // 2c. Get the results
  
  // 3. Check if the User ID is valid
  // 3a. Query MongoDB for the folder name and the user id
  // 3b. Get the results
  
  // 4a. If the User ID and folder match, remove the matching record
  // 4b. If the User ID and the folder do not match,
  //     return an error to the client
  // 4c. If there is any error during stages 2a-4b, then send the
  //     client an internal 500 error

  //1. Check the request method
  if (request.method === "POST"){
    // 1a. Parse the request made by the client
    var body = [];
    
    request.on("data", function(chunk) {
      body.push(chunk);
      console.log("  [DELETE_FOLDER] Chunking the POST request stream.");
    }).on("end", function() {
      body = Buffer.concat(body).toString("utf-8");
      console.log("  [DELETE_FOLDER] Result of chunking: ", body);
      
      var post_request = JSON.parse(body);
      console.log("  [DELETE_FOLDER] Parsed JSON body of the POST request:");
      console.dir(post_request, {depth: null, colors: true});

      // Trim the whitespace for the Folder Name and the DB name
      console.log("  [DELETE_FOLDER] Trimming whitespace...");
      post_request.user_id = post_request.user_id.trim();
      post_request.folder_name = post_request.folder_name.trim();
      console.log("  [DELETE_FOLDER] Trimmed whitespace output:\n", post_request.user_id, "\n", post_request.folder_name);

      // Once the folder name and the user ID have been trimmed, check
      // if they are present within the request
      if (!post_request.user_id && !post_request.folder_name) {
        // The user ID and folder name are not valid - return
        // bad request headers
        console.log("  [DELETE_FOLDER] Critical information is missing.");
        generateResponse("400", response);
      } else {
        // Valid parts of the document are there,
        // continuing with step 2a.
        MongoClient.connect("mongodb://127.0.0.1:27017/test", function(error, database) {
          if (!error) {
            console.log("  [DELETE_FOLDER] No connection error.");
            console.log("  [DELETE_FOLDER] Checking if the User ID exists...");

            var collection = database.collection("user_ids");
            collection.find({user_id:post_request.user_id}).toArray(function(error,results){
              if (!error) {
                // No error created when querying MongoDB, checking results...
                var user_id_results = 0;
                var user_id_matches = [];
                for (i = 0; i < results.length; i++) {
                  user_id_results++;
                  if (post_request.user_id === results[i].user_id) {
                    user_id_matches.push(results[i].user_id);
                  }
                }
                console.log("  [DELETE_FOLDER] Results of User ID Search:");
                console.log("  Number of results:", user_id_results);
                console.log("  User ID array of matches:", user_id_matches, user_id_matches.length);

                // if the user ID and array both contain one result
                if (user_id_results === 1 && user_id_matches.length === 1) {
                  if (user_id_matches[0] === post_request.user_id) {
                    // We can now check if the User ID and folder matches

                    var collection = database.collection("database_one");
                    collection.find({user_id: post_request.user_id, folder_name : post_request.folder_name}).toArray(function(error,results){
                      var folder_results = 0;
                      var folder_names = [];
                      for (i = 0; i < results.length; i++) {
                        folder_results++;
                        if (post_request.folder_name === results[i].folder_name) {
                          folder_names.push(results[i].folder_name);
                        }
                      }

                      console.log("  [DELETE_FOLDER] Folder Search Results:");
                      console.log("  Number of Folder Search Results: ", folder_results);
                      console.log("  Folder Names found that match:", folder_names, folder_names.length);

                      if (folder_results === 1 && folder_names.length === 1) {
                        console.log("  [DELETE FOLDER] Folder exists. Removing folder...");
                        var collection = database.collection("database_one");
                        collection.remove({user_id:post_request.user_id, folder_name : post_request.folder_name}, function (error, result){
                          if (!error) {
                            console.log("  [DELETE_FOLDER] Removing the record was a success.");
                            console.dir(result, {depth: null, colors: true});
                            generateResponse("200", response);
                          } else {
                            // Error removing record from the database
                            console.log("  [DELETE_FOLDER] There has been an error deleting the folder.");
                            console.log(error);
                            generateResponse("500", response);
                          }
                        });
                      } else {
                        console.log("  [DELETE_FOLDER] Folder does not exist.");
                        // return 404 to the client - the folder was not found
                        // on the server.
                        generateResponse("404", response);
                      }
                    }); 
                  } else {
                    console.log("  [DELETE_FOLDER] User ID is not valid.");
                    // return 400 error
                    generateResponse("400", response);
                  }
                } else if (user_id_results === 0 && user_id_matches.length === 0) {
                  // There were no matches - user ID does not exist.
                  // Return bad request to the client.
                  
                } else {
                  // Something has gone horribly 
                }
                
              } else {
                console.log("  [DELETE_FOLDER] Error querying MongoDB for the User ID");
                console.log(error);
              }
            });
          } else {
            // Connection error with MongoDB.
            console.log("  [DELETE_FOLDER] Error connecting to MongoDB");
            console.dir(error, {depth: null, colors: true});
            generateResponse("500", response);
          }
        });
      }
    });
  } else {
    // 1. Request was not POST, send error to the client
    console.log("  [DELETE_FOLDER] Request was not POST, ignore the request.");
    console.dir(request.method, {depth: null, colors: true});
    generateResponse("400", response);
  }
  // End of main function.
}

function generateResponse (responseCode = "404", response) {
  console.log("  [DELETE_FOLDER] Response code generated:", responseCode);
  response.writeHeader(responseCode, {"Access-control-allow-origin" : "*", "Content-Type" : "text/plain"});
  response.end("" + responseCode + "");
}

// Exports the module.
module.exports = delete_folder;
