// Where the URL is located, a fetch request can be made
// by default, fetch uses a GET request method, without being
// CORs compatible e.g. you'd have to enable the correct headers
// here and on the server side in order to parse any results if
// fetch()ing information from another URL

fetch("https://localhost:8080/api/get_user_id").then(function(response){
  console.log("Response Received, converting to JSON...");
  return response.json();
}).then(function(data){
  console.log('Data (as JSON):');
  console.log(data);
}).catch(function(error){
  console.log("Error! Something went wrong:", error);
});
