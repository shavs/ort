var http = require("http");
var url = require("url");
var path = require("path");
var qs = require("querystring");
var MongoClient = require('mongodb').MongoClient;

var IP_ADDR = '127.0.0.1',
    PORT = '8080';
    // IP address and port to listen on

    // useful: https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/

var Server = http.createServer(function (request , response) {
    console.log("Request Recieved" + request.url);
    var body = [];

    // Because Node treats the recieved info as a "body",
    // and also as a "stream", the data needs to be collected as a
    // "body" of information being recieved
    request.on('data', function(chunk) {
      body.push(chunk);
    }).on('end', function() {
      // Creates the query string
      body = Buffer.concat(body).toString('utf-8');
      console.log(body);
      // Creates a JSON output, which is much easier to manipulate
      var post_request = qs.parse(body);
      console.log(post_request);

      // User ID needs to be checked here, make sure that it is valid

      // Once the User ID has been checked, next would need to be
      // the folder name, create it, if it is already created, move on
      
      // all of the references in an existing folder should be deleted
      // once they have been deleted, insert the new records into the database
      
      // An addiitonal check should be implemented to make sure that the
      // author and title of each publication are the same.

      // In terms of JSON structure, something like:
      //
      //{
      //  "user_id": "1111-1111-1111-1111",
      //  "folder_name": "foldernamehere",
      //  "folder_references": {
      //    "0": {
      //      "type": "webpage",
      //      "author": "Sergey Brin",
      //      "date_published": "2017-01-01",
      //      "date_accessed": "2017-01-02",
      //      "url": "http://google.com/"
      //    }
      //  }
      // }

      // or
      // 
      // {
      //  "user_id": "1111-1111-1111-1111",
      //  "folder_name": "foldernamehere",
      //  "folder_references": {
      //    "0": {
      //      "type": "webpage",
      //      "author": "Sergey Brin",
      //      "title": "Google, Inc.",
      //      "date_published": "2017-01-01",
      //      "date_accessed": "2017-01-02",
      //      "url": "http://google.com/"
      //    },
      //    "1": {
      //      "type": "webpage",
      //      "author": "Sergey Brin",
      //      "title": "Google, Inc",
      //      "date_published": "2017-01-01",
      //      "date_accessed": "2017-01-02",
      //      "url": "http://google.com/"
      //    },
      //    "2": {
      //      "type": "tv",
      //      "time_broadcast": "21:00",
      //      "date_published": "2017-01-01",
      //      "title": "Project Code Rush",
      //      "channel": "ITV2"
      //    }
      //  }
      // }
      // 
      
      
      // Once the data has been checked, now the
      MongoClient.connect('mongodb://localhost:27017/test',
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
      // if all of the above was successful, return a status code
      response.writeHeader(200, {"Content-Type" : "text/plain"});
      response.end("" + response.statusCode + "");
      // response.statusCode returns any value that you have assiged in the header
      // so if 400 is returned, 400 is used by response.statusCode
    });
    });
    
    // In order to get the form data, 
    // Processing the request, putting it into MongoDB

   
Server.listen(PORT, IP_ADDR, function () {
    console.log("Listening..." + IP_ADDR + ":" + PORT);
    // Just prints to the console when a request has been made
});


// Questions:
// Is the structure of the JSON OK? What could be done to improve it?
// How would I make a structure like this in MongoDB?
//
// What would be the best method of differentiating the title and the year, 
// so as to append a, b, c to the end of the year of a duplicate reference?