// server.js
var https = require("https");
var url = require("url");
var fs = require("fs");

var IP_ADDR = "127.0.0.1",
    PORT = "8080",
    URL_ADDR = 'https://localhost';

var privateKey = fs.readFileSync("key.pem").toString();
var certificate = fs.readFileSync("cert.pem").toString();

var options = {
  key: privateKey,
  cert: certificate
}

var server = https.createServer(options, function (request, response){
  console.log('\nRequest Received:', request.method);
  // Parse the URL to check what is actually being asked for

  var url_data = url.parse(request.url, true);
  console.log('Request URL: ', url_data);
  
  var filename = url_data.query.filename || "index.html";
  console.log('Filename:', filename);

  var dot = filename.lastIndexOf(".");
  console.log('Dot:', dot);

  var extension = filename.substr(dot+1, filename.length - dot);
  console.log('Extension:', extension);

  if (url_data.pathname === '/api/get_references') {
    console.log('Get References: ', url_data.pathname);
    // Get References from a URL.
    
  } else if (url_data.pathname === '/api/save_references') {
    console.log('Save References: ', url_data.pathname);
    // Save references to a URL
  } else if (url_data.pathname === '/' || url_data.pathname === "/index.html"){
    console.log('Home Page requested.');
    // Send the client the home page, by reading the index.html page,
    // converting it to a string, and then returning it to the client
    // with the proper contenttype
  } else {
    console.log('A bad request - return a 404 page.');
    // Read out a 404 page, return this to the client along with a custom 404
    // page for the end user.
  }

  // API
  console.log('API Path:', url_data.pathname.substring(url_data.pathname.lastIndexOf('/')+1));

  console.log('Path 2: ', url_data.pathname);

  console.log('End of information.\n');
});

server.listen(PORT, IP_ADDR, function () {
    console.log("Listening..." + IP_ADDR + ":" + PORT);
});
