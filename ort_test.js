// Testing using copy-pasting of code into console to test functionality
// of the document.

// Test getting the folder information for the client side
function getfolder (folder_name) {
  // first, make a call to the GET request function
  var result = "";
  // Fetch the information
  fetch("https://localhost:8080/api/get_references?user_id=35640b42-b1b5-4622-ba35-406ea52540b8&folder_name=New_folder").then(function(response){
      //console.log("[ORT.JS] Response Received for " + url + ", converting to JSON...");
      return response.json();
    }).then(function(data){
      console.log('[TESTSCRIPT] Data (as JS Object):');
      console.log(data);
      // Got the data, now we can test creating a folder and getting it
      console.log("[TESTSCRIPT] Got the result:", data);

      // Send the JSON response to IndexedDB for caching.
      var result_string = JSON.stringify(data);
      console.log("[TESTSCRIPT] Turning result into string:", result_string);

      console.log("[TESTSCRIPT] Creating the Reference from the data returned.");
      create_reference(data, "website", function () {
        var array = [];
        console.log("[TESTSCRIPT] Called Back! Getting the folder names");
        get_folder_names(array, function (new_array){
        console.log('[TESTSCRIPT] Called Back! Clearing the foldern names');
        console.log("[TESTSCRIPT] New Array contains:", new_array, new_array.length);
        folder_names_list_operation(new_array, "clear", function () {
          console.log('[TESTSCRIPT] Called back! Generating Folder names now.');
          folder_names_list_operation(new_array, "create", function () {
            console.log('[TESTSCRIPT] Called Back! Final callback.');
          });
        });
      });
      
      });
      // Generate the folder names based on the values stored in
      // IndexedDB

    }).catch(function(error){
      console.log("[TESTSCRIPT] Error! Something went wrong:", error);
    });

    console.log("[TESTSCRIPT] Remove test data from IDB.");

    
}

getfolder("New_folder");
