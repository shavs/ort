// Where the URL is located, a fetch request can be made
// by default, fetch uses a GET request method, without being
// CORs compatible e.g. you'd have to enable the correct headers
// here and on the server side in order to parse any results if
// fetch()ing information from another URL

// Used for getting a UUID
fetch("https://localhost:8080/api/get_user_id").then(function(response){
  console.log("Response Received, converting to JSON...");
  return response.json();
}).then(function(data){
  console.log('Data (as JSON):');
  console.log(data);
}).catch(function(error){
  console.log("Error! Something went wrong:", error);
});

// Used for deleting a folder
// Fill out the User ID and the folder name in order to test
var jsonToPost = {
  user_id : "8e1866c6-4128-4656-96c3-3b96615dc18f",
  folder_name : "New_folder"
}

var request = new Request('https://localhost:8080/api/delete_folder',{
  method: 'POST',
  mode: 'cors',
  redirect:'follow',
  headers: new Headers({'Content-Type':'text/plain'}),
  body: JSON.stringify(jsonToPost)
});

fetch(request).then(function (response) {
  console.log('Response below:');
  console.log(response);
});
