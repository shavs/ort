// ort.js
// Handles processing of references
'esversion: 6';

console.log("[ORT.JS] File loaded.");

// Function declaration section
var SERVER_URL = "https://localhost:8080/";
var folder_create_button = document.getElementById("folder-create-button");
var folder_create_dialog = document.getElementById("folder-create-dialog");
var folder_create_reference_dialog = document.getElementById("folder-create-reference-dialog");

// Function to get a new User ID for each time the page loads.

// Provides a wrapper for getting information from the server
// Accepts: URL of API, and Information (defaults to nothing)
//function get_information (url = SERVER_URL, info = "", result = "") {
  //if (!info) {
    //// Information does not exist.
    //console.log("[ORT.JS] Information does not exist.");
    //return null;
  //} else {
    //// Information does exist, try to query the requested address
    //var full_url = url + "?" + info + "";
    
    //fetch(full_url).then(function(response){
      //console.log("[ORT.JS] Response Received for " + url + ", converting to JSON...");
      //return response.json();
    //}).then(function(data){
      //console.log('[ORT.JS] Data (as JS Object):');
      //console.log(data);
      //result = data;
      //return result;
    //}).catch(function(error){
      //console.log("[ORT.JS] Error! Something went wrong:", error);
    //});
  //}
//}

// Provides a wrapper for posting information to the server and returning
// the response.
function post_information (url = SERVER_URL, json = "") {
  if (!url || !json) {
    console.log("[ORT.JS] Vital information missing from POST request.");
    return null;
  } else {
  
    var request = new Request(url,{
      method: 'POST',
      mode: 'cors',
      redirect:'follow',
      headers: new Headers({'Content-Type':'text/plain'}),
      body: JSON.stringify(json)
    });

    fetch(request).then(function (response) {
      console.log('[ORT.JS] POST Response below:');
      console.log(response);
    }); 
  }
}

// IDB function to get all folder names available and return an array object
// Accepts an empty array to insert information into
function get_folder_names (array, _callback) {
  var request = indexedDB.open("folder_database", 1);

  request.onupgradeneeded = function () {
    var database = request.result;
    var store = database.createObjectStore("TextStore", {keyPath:"id", autoIncrement: true});
    var index = store.createIndex("SearchIndex", ["id"]);
  };

  request.onsuccess = function () {
    // Get the DB
    var database = request.result;
    // Create a transaction for the DB
    var TextStore = database.transaction(["TextStore"], "readwrite").objectStore("TextStore");
    // Create a search index var
    var index = TextStore.index("SearchIndex");

    // Get all the folder names available
    
    TextStore.openCursor().onsuccess = function (event) {
      var cursor = event.target.result;

      if (cursor) {
        array.push(cursor.value);
        cursor.continue();
      } else {
        if (!array || array.length === 0) {
          console.log("[ORT.JS] No folder information found: ", array, array.length);
        } else {
          console.log("[ORT.JS] Folders found: ", array, array.length);
          console.log("[ORT.JS] Callback array contents:", array, array.length, array.folder_name);
          _callback(array);
          return array;
        }
      }
    };
    TextStore.oncomplete = function () {
      database.close();
      console.log("[ORT.JS] Database closed! Finished getting folder names.");
    };
  };
}

// List creation function
// Creates a list of all the folder names when triggered
// Accepts an array, and the operation type (either "clear", or "create")
function folder_names_list_operation (array = "", operation = "", _callback) {
  if (!operation) {
    // Error - both the operation and the array were empty
    console.log("[ORT.JS] Operation was empty when calling FolderNamesListOperation");
  } else if (operation === "clear") {
    // Clear the folder list
    var folder_name_list = document.querySelector(".folder-names-list");
    // Next, remove all of the li buttons in the document
    for (i = 0; i < folder_name_list.children.length; i++) {
      console.log("Child node number:", i);
      // Checks the ID before removing it.
      if (folder_name_list.children[i].id !== "folder-create-button") {
        folder_name_list.removeChild(folder_name_list.children[i]);
      }
      console.log(folder_name_list.children[i].id);
    }
  } else if (operation === "create") {
    // Create the folder list
    console.log("[ORT.JS] Attempting to create the folder names");
    
    var folder_names_list = document.querySelector(".folder-names-list");
    var folder_create_button = document.getElementById("folder-create-button");
    console.log("Array length (create): ", array.length);
    for (i = 0; i < array.length; i++) {
      let folder_name = array[i].folder_name;
      console.log("Folder name being created:", folder_name);
      let newLi = document.createElement("li");
      let newLiContent = document.createTextNode(folder_name);
      newLi.appendChild(newLiContent);
      // Give it the appropriate CSS class
      newLi.className = "folder-name";
      console.log(newLi);
      // Insert the folder name into the DOM
      folder_names_list.insertBefore(newLi, folder_create_button);
    }
    
    console.log("[ORT.JS] Finished creating the folder names:" , array);
  } else {
    console.log("[ORT.JS] Function not working as expected.");
    console.log("[ORT.JS] Operation Value:", operation);
    console.log("[ORT.JS] Array Value:", array);
  }
  
  _callback(array);
}

// Create a reference - the main function of this application
// Accepts a JSON object of the reference information
// and inserts it into the folder

// Not checking type for now, as it has not been implemented within
// other functionality
function create_reference (json, type, _callback) {
  var request = indexedDB.open("folder_database", 1);

  request.onsuccess = function () {
    // Get the DB
    var database = request.result;
    // Create a transaction for the DB
    var TextStore = database.transaction(["TextStore"], "readwrite").objectStore("TextStore");
    // Create a search index var
    var index = TextStore.index("SearchIndex");

    // Insert the record into the DB.
    TextStore.put(json);

    TextStore.oncomplete = function () {
      database.close();
    };
  };

  _callback();
}

// Action on the page. Mainly uses event listeners for each of the buttons.
window.addEventListener('load', function () {
  // Init procedure:
  // 1. Check localStorage for a key
  
  // 2a. If access is given, check if the user has been assigned a UUID
  // 2a.i  If the user has been assigned an ID, carry on
  // 2a.ii If the user has not been assigned an ID,
  //       then:
  //       - Get the UUID
  //       - Store the UUID as a localStorage key
  //
  
  // 2b. If access is not given, then present error message to client
  //     by overwriting the DOM with the error message, preventing
  //     the user access to the referencing service.
  try {
    var user_id = localStorage.getItem("user_id");
    if (!user_id) {
      fetch(SERVER_URL + "api/get_user_id").then(function(response){
        console.log("[ORT.JS] Response Received, converting to JSON...");
        return response.json();
      }).then(function(data){
        console.log('[ORT.JS] Data (as Object):');
        console.log(data);
        // Store the UUID as a localStorage object
        try {
          localStorage.setItem("user_id", data.user_id);
        } catch (e) {
          console.log("[ORT.JS] There was an error setting the UUID");
          console.log(e);
        }
        // Test getting the UUID from storage.
        try {
          var user_id = localStorage.getItem("user_id");
          if (!user_id) {
            console.log("[ORT.JS] The User ID was not valid, or does not exist.");
          } else {
            console.log("[ORT.JS] User ID was successfully obtained.", user_id);
          }
        } catch (e) {
          console.log("[ORT.JS] There was an error during UUID testing.");
          console.log(e);
        }
        
      }).catch(function(error){
        console.log("[ORT.JS] Error! Something went wrong during the fetch:", error);
      });
    } else {
      console.log("[ORT.JS] Looks like the User ID has already been set.");
    }
  } catch (e) {
    console.log("[ORT.JS] Looks like localStorage is not supported.");
    console.log(e);
    // Hacky, but it works to demonstrate to the user that the
    // service is unavailable because the browser does not
    // support localStorage, which, if that is the case,
    // then none of the other technologies used
    // will support it.
    document.write("<h1>ERROR: localStorage is not supported by this browser.</h1><p>This service requires the lastest browsers to use. Please try using:</p><ul><li>Mozilla Firefox</li><li>Google Chrome</li><li>Chromium</li></ul>");
  }

  // Once this has been done...
  // 1. Check if there is a database created
  
  // 2a. If there is not a database created, create the appropriate schema
  // 2aa. Create the DB and the Schema
  // 2ab. Move the user automatically to the "Create a folder" page
  // 2ac. Wait for the user to create a folder
  // 2ad. Create the folder name within IDB
  // 2ae. Automatically open the view for the page
  // 2af. Display all results for the folder name in the view
  // 2ag. Finish.
  
  // 2b. If there is a db created...
  // 2ba. Query the DB for the folder names
  // 2bb. Insert the appropriate folder names into the folder-names list
  // 2bc. Automatically open the page on the first folder-names list
  // 2bd. Display all results for the folder name in the view
  // 2be. Finish.

  // 1. Check if there is a database created
  
});


// Add an event listener to the Folder Creation button.
document.getElementById("folder-create-button").addEventListener('click', function (){
  // Show the reference creator once clicked.
  var has_hide = document.getElementById("folder-create-folder-dialog");
  console.log("[ORT.JS] Folder Creation button clicked.", has_hide.style.display);
  if (has_hide.style.display === "none" || has_hide.style.display === "") {
    // Show the element, hide all of the other elements in the page
    var folder_references = document.querySelector(".folder-references");
    // Next, remove all of the li buttons in the document
    for (i = 0; i < folder_references.children.length; i++) {
      console.log("Child node number:", i);
      // Checks the ID before removing it.
      if (folder_references.children[i].style.display !== "none" && folder_references.children[i].id !== "folder-create-reference-dialog") {
        folder_references.children[i].style.display = "none";
      } else if (folder_references.children[i].id === "folder-create-reference-dialog") {
        folder_references.children[i].style.display = "block";
      }
      console.log(folder_references.children[i].style.display);
    }
  } else {
    console.log("[ORT.JS] Display value is not hide, do nothing and");
    console.log("         make sure that the folder references and other parts are not showing.");
    
  }
  
});
