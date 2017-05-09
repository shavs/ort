"use strict";

/*jshint esversion: 6 */
console.log("--------------------------------------------------");
var SERVER_URL = "";

// Check if the browser supports IndexedDB
// Also needed to check if IDB is available within Private Mode / Incognito
// https://github.com/dfahlander/Dexie.js/issues/312


// Create a new database for the folders,
// if it doesn't already exist
var db = new Dexie("folder_database");

// Next, create the database with the set version
db.version(1).stores({
  TextStore: "++id, folder_name"
}).upgrade(function (version) {
  // In future versions, you would need to migrate TextStore
  // to a new store located in the next DB version
  console.log("[ORT.JS] Database is being upgraded.");
});

try {
  db.open().then(function () {
    // Register the service worker - 
    // otherwise the user will be stuck with a version
    // or ORT that does not work.
    console.log("[ORT.JS] IndexedDB is supported. Attempting registration of Service Worker...");
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        //   ort_service_worker.js
        navigator.serviceWorker.register("").then(function (registration) {
          console.log("[ORT.JS] SW Scope: ", registration.scope);
        }, function (error) {
          console.log("[ORT.JS] SW Registration has failed:", error);
        });
      });
    }
  }).catch(function (error) {
    console.log("[ORT.JS] Browser does not support IDB stores, or the browser is in private mode.");
    document.body.innerHTML = "";
    document.body.innerHTML = "<h1>Please leave Incognito mode / Private Browsing mode, as it prevents use of IndexedDB.</h1><p>Error for developers: " + error.message + "</p>";
  });
} catch (error) {
  console.log("[ORT.JS] Attempted opening of the DB resulted in failure. ", error);
  document.body.innerHTML = "";
  document.body.innerHTML = "<h1>Please leave Incognito mode / Private Browsing mode, as it prevents use of IndexedDB.</h1><p>Error for developers: " + error.message + "</p>";
}

// If the next version of the DB needs updating,
// then not only have v1 of Dexie, but also v2 of the
// dexie DB.

window.addEventListener('load', function () {
  try {
    var user_id = localStorage.getItem("user_id");
    if (!user_id) {
      fetch("api/get_user_id").then(function (response) {
        console.log("[ORT.JS] Response Received, converting to JSON...");
        return response.json();
      }).then(function (data) {
        console.log('[ORT.JS] Data (as Object):');
        console.log(data);
        try {
          localStorage.setItem("user_id", data.user_id);
        } catch (e) {
          console.log("[ORT.JS] There was an error setting the UUID");
          console.log(e);
        }
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
      }).catch(function (error) {
        console.log("[ORT.JS] Error! Something went wrong during the fetch:", error);
        // Because the initial fetch went wrong, and the User ID does not exist,
        // prevent the user from continuing.
        document.body.innerHTML = "";
        document.body.innerHTML = "<h1>ERROR: It appears that the request for a User ID has failed.</h1> <p>Please try loading this page with a normal internet connection.</p>";
      });
    } else {
      console.log("[ORT.JS] Looks like the User ID has already been set.");
    }

    // Update the sidebar of folder information
    update_folder_names();
  } catch (e) {
    console.log("[ORT.JS] Looks like localStorage is not supported.");
    console.log(e);
    document.body.innerHTML = "";
    document.body.innerHTML = "<h1>ERROR: localStorage is not supported by this browser.</h1><p>This service requires the lastest browsers to use. Please try using:</p><ul><li>Mozilla Firefox</li><li>Google Chrome</li><li>Chromium</li></ul>";
  }
});

function update_folder_names() {
  // In this function, we need to find any existing folders and display their
  // names on the left-hand side of the folder creator.
  console.log("[ORT.JS] Finding Existing folders and Displaying them to the user");

  // 1. Find the available folders
  db.TextStore.toArray(function (results) {
    var _this = this;

    console.log("[ORT.JS] Result of Search: ", results);
    if (results.length === 0) {
      console.log("[ORT.JS] No folder names to display.");
      var folder_names_list = document.getElementById("folder-names-list");
      var folder_create_button = document.getElementById("folder-create-button");

      console.log("[ORT.JS] Length of results:", results.length);
      // Next, remove all of the li buttons
      folder_names_list.innerHTML = "";
      folder_names_list.appendChild(folder_create_button);
    } else {
      console.log("[ORT.JS] Displaying each of the folder names");
      var _folder_names_list = document.getElementById("folder-names-list");
      var _folder_create_button = document.getElementById("folder-create-button");

      console.log("[ORT.JS] Length of results:", results.length);
      // Next, remove all of the li buttons
      _folder_names_list.innerHTML = "";
      _folder_names_list.appendChild(_folder_create_button);

      // Next, add each of the names of the folders as children on the left

      var _loop = function _loop(i) {
        var folder_name = results[i].folder_name;
        console.log("[ORT.JS] Folder name being created:", folder_name);
        var newLi = document.createElement("li");
        var newLiContent = document.createTextNode(folder_name);
        newLi.appendChild(newLiContent);
        // Give it the appropriate CSS class
        newLi.className = "folder-name";
        console.log("[ORT.JS] New element being inserted into the DOM:", newLi);

        // Give the element an event listener
        newLi.addEventListener("click", function (innerText) {
          // Trigger a separate function that displays the folder's contents
          display_folder_contents(newLi.innerText);
        }.bind(_this, newLi.innerText));

        // Insert the element into the DOM
        _folder_names_list.insertBefore(newLi, _folder_create_button);
      };

      for (var i = 0; i < results.length; i++) {
        _loop(i);
      }
    }
  });
}

// Function that is triggered when a folder has been clicked.
function display_folder_contents(folder_name) {
  // Check if the folder_name was a valid value
  if (!folder_name) {
    // Folder name was not valid
    console.log("[ORT.JS] Folder name was invalid.", folder_name);
  } else {
    // folder name was valid, check if it exists within IndexedDB
    console.log("[ORT.JS] Folder name was valid:", folder_name);
    console.log("[ORT.JS] Checking folder is in IndexedDB");
    db.TextStore.where("folder_name").equals(folder_name).toArray(function (results) {
      if (results.length === 0) {
        console.log("[ORT.JS] No folders found with that name: ", folder_name);
      } else if (results.length === 1) {
        // A folder was found with that name
        console.log("[ORT.JS] A single folder was found:", folder_name, results, results.length);
        // Display the contents of the folder into the DOM

        // First, hide anything else
        document.getElementById("folder-create-reference-dialog").classList.add("dialog-hide");
        document.getElementById("folder-create-folder-dialog").classList.add("dialog-hide");

        document.getElementById("reference-form").innerHTML = "";

        // then look at the folder's current references
        var references = results[0].references;

        // If there are no references in the folder, display error
        // to the user
        var folder_display = document.getElementById("folder-display");
        // Remove any HTML that exists within that document
        folder_display.innerHTML = "";
        // Also, make sure to remove any children
        while (folder_display.firstChild) {
          folder_display.removeChild(folder_display.firstChild);
        }

        // Append the error par
        var createErrorPar = document.createElement("p");
        createErrorPar.classList.add("error-no-references");
        folder_display.appendChild(createErrorPar);

        // Create a container div for the headings, append that to the dom
        var newHD = document.createElement("div");
        newHD.classList.add("folder-headings");

        // Create the heading element with the folder title inside:
        var newFT = document.createElement("h3");
        newFT.innerText = "" + folder_name + "";
        newHD.appendChild(newFT);

        // Give a paragraph tag for some folder controls
        //let newBT = document.createElement("h4");
        //newBT.innerText = "Folder Controls";
        //newHD.appendChild(newBT);

        // Append the headings to the DOM
        folder_display.appendChild(newHD);

        // Create div for the folder controls
        var newFC = document.createElement("div");
        newFC.classList.add("folder-controls");

        // Append the "create reference" button
        var newRefButton = document.createElement("button");
        newRefButton.type = "button";
        newRefButton.innerText = "Add a new Reference";
        newRefButton.addEventListener("click", function () {
          // Needs the folder name
          add_reference(folder_name);
        });
        newFC.appendChild(newRefButton);

        // Append the "export references" button
        var newExpBtn = document.createElement("button");
        newExpBtn.type = "button";
        newExpBtn.innerText = "Export References as Plain Text";
        newExpBtn.addEventListener("click", function () {
          // Exports the folder - needs only the folder name
          export_references(folder_name);
        });
        newFC.appendChild(newExpBtn);

        // Append the "export references" button
        var newDelBtn = document.createElement("button");
        newDelBtn.type = "button";
        newDelBtn.innerText = "Delete this folder";
        newDelBtn.addEventListener("click", function () {
          // Exports the folder - needs only the folder name
          delete_folder(folder_name);
        });
        newFC.appendChild(newDelBtn);

        folder_display.appendChild(newFC);

        if (references.length === 0 || !references) {
          console.log("[ORT.JS] No references to display:", references, references.length);
          document.querySelector(".error-no-references").innerText = "No references available for " + folder_name + ".\n\n Please create a reference using the button below.";
        } else {
          // If there are any references to display
          console.log("[ORT.JS] There are references to display:", references, references.length);

          // First, store any neccessary HTML as a let
          document.querySelector(".error-no-references").innerText = "";

          // Next, for each reference that exists

          var _loop2 = function _loop2() {
            console.log("[ORT.JS] Reference:", references[i], i);
            // create a new div container
            var newDiv = document.createElement("div");
            newDiv.className = "reference";
            // Create a small title for each of the references
            var newRefTitle = document.createElement("h4");
            newRefTitle.innerText = "Reference " + (i + 1) + " - type: " + removeUnderscores(references[i].type) + "";
            newDiv.appendChild(newRefTitle);

            // Append a delete button

            var delval = i;
            var newDeleteButton = document.createElement("button");
            newDeleteButton.type = "button";
            newDeleteButton.innerText = "Delete this Reference";
            newDeleteButton.addEventListener("click", function () {
              delete_reference(folder_name, delval);
            });
            newDiv.appendChild(newDeleteButton);

            // Append an edit button
            //newEditButton = document.createElement("button");
            //newEditButton.type = "button";
            //newEditButton.innerText = "Edit this Reference";
            //newEditButton.addEventListener("click", function(){
            //edit_reference(folder_name, delval);
            //});
            //newDiv.appendChild(newEditButton);

            // For each property that the reference has

            // First, create a table

            newTable = document.createElement("table");
            keys = Object.keys(references[i]);

            keys.sort();

            for (p = 0; p < keys.length; p++) {
              // Create the table row
              k = keys[p];

              if (k !== "type") {
                newTableRow = document.createElement("tr");

                var k_n = k.charAt(0).toUpperCase() + k.slice(1);
                var key_name = removeUnderscores(k_n);
                var newTH = document.createElement("th");
                newTH.innerText = "" + key_name + "";
                newTableRow.appendChild(newTH);
                var newTD = document.createElement("td");
                newTD.innerText = "" + references[i][k] + "";
                newTableRow.appendChild(newTD);
                // Append the new property to the document element
                console.log("[ORT.JS] New Element Created:", newTH, newTH.innerText, newTD, newTD.innerText);
                newTable.appendChild(newTableRow);
              }
            }
            // Append the new reference div to the document
            newDiv.appendChild(newTable);
            document.getElementById("folder-display").appendChild(newDiv);
          };

          for (var i = 0; i < references.length; i++) {
            var newTable;
            var keys;
            var p;
            var k;
            var newTableRow;

            _loop2();
          }
        }
        // After that, display the folder contents to the user
        document.getElementById("folder-display").classList.remove("dialog-hide");
      } else {
        // More than one folder was found.
        console.log("[ORT.JS] More than one folder was found:", folder_name, results, results.length);
      }
    });
  }
}

// Add Reference function
function add_reference(folder_name) {
  if (!folder_name) {
    console.log("[ORT.JS] No folder name specified:", folder_name);
  } else {
    // Folder name
    // Query the DB for the folder name, then display a form for the user
    console.log("[ORT.JS] Folder name is: ", folder_name);
    console.log("[ORT.JS] Checking if folder name is valid with IDB...");
    db.TextStore.where("folder_name").equals(folder_name).toArray(function (results) {
      if (results.length === 0 || !results) {
        console.log("[ORT.JS] Error - no folder name exists when searching for the existing folder.", folder_name, results);
      } else if (results.length === 1) {
        console.log("[ORT.JS] Success - a single folder exists for the folder name found", folder_name, results);

        // Now that we have the folder, we need to
        // display the form that allows reference adding to the folder.

        document.getElementById("folder-create-reference-dialog").classList.remove("dialog-hide");
        document.getElementById("folder-create-folder-dialog").classList.add("dialog-hide");
        document.getElementById("folder-display").classList.add("dialog-hide");

        // Reset the value of the select to the "blank" option
        document.getElementById("reference-type").options[0].selected = true;

        // Get the button, remove it, then add a new button with an additional event listener
        var save_reference_button = document.getElementById("folder-create-reference-dialog").querySelector("button");

        document.getElementById("folder-create-reference-dialog").removeChild(save_reference_button);

        var newSaveRefBtn = document.createElement("button");
        newSaveRefBtn.innerText = save_reference_button.innerText;
        newSaveRefBtn.type = save_reference_button.type;
        newSaveRefBtn.addEventListener("click", function () {
          add_reference_info(folder_name);
        });
        document.getElementById("folder-create-reference-dialog").appendChild(newSaveRefBtn);
      } else {
        console.log("[ORT.JS] Error - either more than one folder was found, or there was an issue when querying for the folder.", folder_name, results);
      }
    });
  }
}

function add_reference_info(folder_name) {
  if (!folder_name) {
    console.log("[ORT.JS] Folder name does not exist", folder_name);
  } else {
    // Check if the folder exists
    db.TextStore.where("folder_name").equals(folder_name).toArray(function (results) {
      if (results.length === 0 || !results) {
        console.log("[ORT.JS] No folders matched when searching to insert the reference", folder_name, results, results.length);
      } else if (results.length === 1 && results[0].folder_name === folder_name) {
        console.log("[ORT.JS] One folder matches the search", folder_name, results, results.length);

        // Now, we need to
        //
        // Collect the reference information, and turn it into
        // a piece of JSON
        //
        // then
        //
        // add the reference to the folder
        //
        // then
        //
        // show the folder's contents again

        //var ref_info = {
        //type : "website",
        //author : "When your head is much lighter",
        //address : "https://google.com/"
        //}

        var reference_type = document.getElementById("reference-type").value;
        var reference_form = document.getElementById("reference-form");

        var ref_info = {};

        if (reference_type !== "blank") {
          if (reference_type === "book" || reference_type === "chapter" || reference_type === "conference" || reference_type === "journal" || reference_type === "blog" || reference_type === "image" || reference_type === "film" || reference_type === "newspaper_magazine" || reference_type === "online_report" || reference_type === "tv" || reference_type === "website") {
            console.log("[ORT.JS] Reference is a website.");

            for (var c = 0; c < reference_form.childNodes.length; c++) {
              var child = reference_form.childNodes[c];
              console.log("[ORT.JS] Found Child: ", child);

              // We only need input tags
              if (child.tagName.toLowerCase() === "input") {
                console.log("[ORT.JS] Found the tag", child.tagName.toLowerCase);
                // Append the property name and the value of the named property
                ref_info[child.name] = child.value.trim();
                // One check that might be needed is if any of the values are
                // empty
              }
            }

            // Get the reference type, and append it to the object.
            ref_info.type = document.getElementById("reference-type").value;
            Object.keys(ref_info).sort();
          } else if (reference_type === "manual") {
            console.log("[ORT.JS] Manual reference selected.");
            // For now, do nothing
          } else {
            console.log("[ORT.JS] No reference type found. Don't do anything.", reference_type);
          }
        } else {
          console.log("[ORT.JS] One of the references must be blank.");
        }

        if (!reference_type || reference_type === "blank") {
          console.log("[ORT.JS] No Reference Info was created", ref_info);
          ref_info = {};
        } else {
          console.log("[ORT.JS]", ref_info);

          // Put the results into the folder
          results[0].references.push(ref_info);

          console.log("[ORT.JS] This is going to replace the current folder", results);

          // add the reference to the folder
          db.TextStore.put(results[0]);

          // Remove the contents of the form
          reference_form.innerHTML = "";

          // Display the contents of the folder to the user again

          display_folder_contents(folder_name);
        }
      } else {
        console.log("[ORT.JS] Either more than one folder was found, or there wan another error with the results", folder_name, results, results.length);
      }
    });
  }
}

// Event listener that waits and generates the appropriate fields for the references
document.getElementById("reference-type").addEventListener("change", function () {
  var reference_form_type = document.getElementById("reference-type").value;
  if (!reference_form_type) {
    // The form type is not valid
    console.log("[ORT.JS] Reference type not found:", reference_form_type);
  } else {
    var reference_form = document.getElementById("reference-form");
    reference_form.innerHTML = "";

    console.log("[ORT.JS] Reference type was found,");
    if (reference_form_type === "website") {
      console.log("[ORT.JS] Reference was a website. Creating website form.");
      // Neccessary inputs:
      // Author(s) (properly formatted)
      // URL
      // Title

      // Year Published

      // Year Accessed
      // Month Accessed
      // Day Accessed

      var newP1 = document.createElement("p");
      newP1.innerText = "Please enter the authors, by: \n separating each author with a space, followed by a forward slash, followed by a space ( / ):";
      newP1.classList.add("ref_par");
      reference_form.appendChild(newP1);

      var newAuth = document.createElement("input");
      newAuth.type = "text";
      newAuth.placeholder = "Please enter the authors, by separating each author with a space, followed by a forward slash, followed by a space ( / )";
      newAuth.name = "authors";
      reference_form.appendChild(newAuth);

      var newP2 = document.createElement("p");
      newP2.innerText = "Please enter a valid URL:";
      newP2.classList.add("ref_par");
      reference_form.appendChild(newP2);

      var newURL = document.createElement("input");
      newURL.type = "url";
      newURL.placeholder = "URL";
      newURL.name = "url";
      reference_form.appendChild(newURL);

      var newP3 = document.createElement("p");
      newP3.innerText = "Title of the Website:";
      newP3.classList.add("ref_par");
      reference_form.appendChild(newP3);

      var newTitle = document.createElement("input");
      newTitle.type = "text";
      newTitle.placeholder = "Title of Website";
      newTitle.name = "title";
      reference_form.appendChild(newTitle);

      var newP4 = document.createElement("p");
      newP4.innerText = "Date Published (yyyy):";
      newP4.classList.add("ref_par");
      reference_form.appendChild(newP4);

      var newYP = document.createElement("input");
      newYP.type = "text";
      newYP.maxlength = "4";
      newYP.minlength = "4";
      newYP.placeholder = "yyyy - Date Published";
      newYP.name = "date_published";
      reference_form.appendChild(newYP);

      var newP5 = document.createElement("p");
      newP5.innerText = "Date Accessed, formatted as yyyy-mm-dd (ISO date standard):";
      newP5.classList.add("ref_par");
      reference_form.appendChild(newP5);

      var newDA = document.createElement("input");
      newDA.type = "text";
      newDA.maxlength = "10";
      newDA.placeholder = "yyyy-mm-dd";
      newDA.name = "date_accessed";
      reference_form.appendChild(newDA);
    } else if (reference_form_type === "book") {
      console.log("[ORT.JS] Reference was a book, creating book form...");

      var _newP = document.createElement("p");
      _newP.innerText = "Please enter the authors, by: \n separating each author with a space, followed by a forward slash, followed by a space ( / ):";
      _newP.classList.add("ref_par");
      reference_form.appendChild(_newP);

      var _newAuth = document.createElement("input");
      _newAuth.type = "text";
      _newAuth.placeholder = "Please enter the authors, by separating each author with a space, followed by a forward slash, followed by a space ( / )";
      _newAuth.name = "authors";
      reference_form.appendChild(_newAuth);

      var _newP2 = document.createElement("p");
      _newP2.innerText = "Date Published (yyyy)";
      _newP2.classList.add("ref_par");
      reference_form.appendChild(_newP2);

      var _newYP = document.createElement("input");
      _newYP.type = "text";
      _newYP.maxlength = "4";
      _newYP.minlength = "4";
      _newYP.placeholder = "yyyy - Date Published";
      _newYP.name = "date_published";
      reference_form.appendChild(_newYP);

      var _newP3 = document.createElement("p");
      _newP3.innerText = "Title of the Book:";
      _newP3.classList.add("ref_par");
      reference_form.appendChild(_newP3);

      var _newTitle = document.createElement("input");
      _newTitle.type = "text";
      _newTitle.placeholder = "Title of Book";
      _newTitle.name = "title";
      reference_form.appendChild(_newTitle);

      var _newP4 = document.createElement("p");
      _newP4.innerText = "Edition of the Book (leave blank if not applicable):";
      _newP4.classList.add("ref_par");
      reference_form.appendChild(_newP4);

      var newEd = document.createElement("input");
      newEd.type = "text";
      newEd.placeholder = "Edition (leave blank if not applicable)";
      newEd.name = "edition";
      reference_form.appendChild(newEd);

      var _newP5 = document.createElement("p");
      _newP5.innerText = "Place of Publication:";
      _newP5.classList.add("ref_par");
      reference_form.appendChild(_newP5);

      var newPlace = document.createElement("input");
      newPlace.type = "text";
      newPlace.placeholder = "Place of Publication";
      newPlace.name = "place_of_publication";
      reference_form.appendChild(newPlace);

      var newP6 = document.createElement("p");
      newP6.innerText = "Publisher:";
      newP6.classList.add("ref_par");
      reference_form.appendChild(newP6);

      var newPub = document.createElement("input");
      newPub.type = "text";
      newPub.placeholder = "Publisher";
      newPub.name = "publisher";
      reference_form.appendChild(newPub);
    } else if (reference_form_type === "chapter") {
      console.log("[ORT.JS] Reference is a chapter. Constructing form...");

      // Authors of Chapter
      // Year of Publication
      // Title of chapter/essay
      // Editors of the book
      // Title of book
      // Edition (if none, leave blank)
      // Place of Publication
      // Publisher
      // Pages

      var _newP6 = document.createElement("p");
      _newP6.innerText = "Please enter the Editors / Authors of the Chapter, by: \n separating each author with a space, followed by a forward slash, followed by a space ( / ):";
      _newP6.classList.add("ref_par");
      reference_form.appendChild(_newP6);

      var _newAuth2 = document.createElement("input");
      _newAuth2.type = "text";
      _newAuth2.placeholder = "Please enter the Editors / Authors of the Chapter, by: separating each author with a space, followed by a forward slash, followed by a space ( / ):";
      _newAuth2.name = "authors_of_chapter";
      reference_form.appendChild(_newAuth2);

      var _newP7 = document.createElement("p");
      _newP7.innerText = "Date Published (yyyy):";
      _newP7.classList.add("ref_par");
      reference_form.appendChild(_newP7);

      var _newYP2 = document.createElement("input");
      _newYP2.type = "text";
      _newYP2.maxlength = "4";
      _newYP2.minlength = "4";
      _newYP2.placeholder = "yyyy - Date Published";
      _newYP2.name = "date_published";
      reference_form.appendChild(_newYP2);

      var _newP8 = document.createElement("p");
      _newP8.innerText = "Title of Chapter/Essay:";
      _newP8.classList.add("ref_par");
      reference_form.appendChild(_newP8);

      var newChapTitle = document.createElement("input");
      newChapTitle.type = "text";
      newChapTitle.placeholder = "Title of Chapter/Essay";
      newChapTitle.name = "chapter_title";
      reference_form.appendChild(newChapTitle);

      var _newP9 = document.createElement("p");
      _newP9.innerText = "Please enter the Authors of the Book / Editors of the Book, by: \n separating each author with a space, followed by a forward slash, followed by a space ( / ):";
      _newP9.classList.add("ref_par");
      reference_form.appendChild(_newP9);

      var newEdBook = document.createElement("input");
      newEdBook.type = "text";
      newEdBook.placeholder = "Please enter the Authors of the Book / Editors of the Book, by separating each author with a space, followed by a forward slash, followed by a space ( / ):";
      newEdBook.name = "authors_of_book";
      reference_form.appendChild(newEdBook);

      var _newP10 = document.createElement("p");
      _newP10.innerText = "Title of the Book:";
      _newP10.classList.add("ref_par");
      reference_form.appendChild(_newP10);

      var _newTitle2 = document.createElement("input");
      _newTitle2.type = "text";
      _newTitle2.placeholder = "Title of Book";
      _newTitle2.name = "title";
      reference_form.appendChild(_newTitle2);

      var _newP11 = document.createElement("p");
      _newP11.innerText = "Edition (leave blank if not applicable):";
      _newP11.classList.add("ref_par");
      reference_form.appendChild(_newP11);

      var _newEd = document.createElement("input");
      _newEd.type = "text";
      _newEd.placeholder = "Edition (leave blank if not applicable)";
      _newEd.name = "edition";
      reference_form.appendChild(_newEd);

      var newP7 = document.createElement("p");
      newP7.innerText = "Place of Publication:";
      newP7.classList.add("ref_par");
      reference_form.appendChild(newP7);

      var _newPlace = document.createElement("input");
      _newPlace.type = "text";
      _newPlace.placeholder = "Place of Publication";
      _newPlace.name = "place_of_publication";
      reference_form.appendChild(_newPlace);

      var newP8 = document.createElement("p");
      newP8.innerText = "Publisher:";
      newP8.classList.add("ref_par");
      reference_form.appendChild(newP8);

      var _newPub = document.createElement("input");
      _newPub.type = "text";
      _newPub.placeholder = "Publisher";
      _newPub.name = "publisher";
      reference_form.appendChild(_newPub);

      var newP9 = document.createElement("p");
      newP9.innerText = "Pages (formatted as: \"pp.n-n\", where n is a number):";
      newP9.classList.add("ref_par");
      reference_form.appendChild(newP9);

      var newPages = document.createElement("input");
      newPages.type = "text";
      newPages.placeholder = "Pages (formatted as: \"pp.n-n\", where n is a number)";
      newPages.name = "pages";
      reference_form.appendChild(newPages);
    } else if (reference_form_type === "conference") {

      var _newP12 = document.createElement("p");
      _newP12.innerText = "Please enter the authors, by: \n separating each author with a space, followed by a forward slash, followed by a space ( / ):";
      _newP12.classList.add("ref_par");
      reference_form.appendChild(_newP12);

      var _newAuth3 = document.createElement("input");
      _newAuth3.type = "text";
      _newAuth3.placeholder = "Please enter the authors, formatted correctly. Authors / Editors of the chapter";
      _newAuth3.name = "authors_of_chapter";
      reference_form.appendChild(_newAuth3);

      var _newP13 = document.createElement("p");
      _newP13.innerText = "Date Published (yyyy):";
      _newP13.classList.add("ref_par");
      reference_form.appendChild(_newP13);

      var _newYP3 = document.createElement("input");
      _newYP3.type = "text";
      _newYP3.maxlength = "4";
      _newYP3.minlength = "4";
      _newYP3.placeholder = "yyyy - Date Published";
      _newYP3.name = "date_published";
      reference_form.appendChild(_newYP3);

      var _newP14 = document.createElement("p");
      _newP14.innerText = "Title of Chapter / Essay:";
      _newP14.classList.add("ref_par");
      reference_form.appendChild(_newP14);

      var _newChapTitle = document.createElement("input");
      _newChapTitle.type = "text";
      _newChapTitle.placeholder = "Title of Chapter/Essay";
      _newChapTitle.name = "chapter_title";
      reference_form.appendChild(_newChapTitle);

      var _newP15 = document.createElement("p");
      _newP15.innerText = "Please enter the Authors / Editors of the book, by: \n separating each author with a space, followed by a forward slash, followed by a space ( / ):";
      _newP15.classList.add("ref_par");
      reference_form.appendChild(_newP15);

      var _newEdBook = document.createElement("input");
      _newEdBook.type = "text";
      _newEdBook.placeholder = "Please enter the Authors / Editors of the book, by separating each author with a space, followed by a forward slash, followed by a space ( / ):";
      _newEdBook.name = "authors_of_book";
      reference_form.appendChild(_newEdBook);

      var _newP16 = document.createElement("p");
      _newP16.innerText = "Title of Book:";
      _newP16.classList.add("ref_par");
      reference_form.appendChild(_newP16);

      var _newTitle3 = document.createElement("input");
      _newTitle3.type = "text";
      _newTitle3.placeholder = "Title of Book";
      _newTitle3.name = "title";
      reference_form.appendChild(_newTitle3);

      var _newP17 = document.createElement("p");
      _newP17.innerText = "Edition (leave blank if not applicable)";
      _newP17.classList.add("ref_par");
      reference_form.appendChild(_newP17);

      var _newEd2 = document.createElement("input");
      _newEd2.type = "text";
      _newEd2.placeholder = "Edition (leave blank if not applicable)";
      _newEd2.name = "edition";
      reference_form.appendChild(_newEd2);

      var _newP18 = document.createElement("p");
      _newP18.innerText = "Date and place of the Conference - Formatted as nn-nn MMM, YYYY \n For example: 22-23 January, 2017";
      _newP18.classList.add("ref_par");
      reference_form.appendChild(_newP18);

      var newDate = document.createElement("input");
      newDate.type = "text";
      newDate.placeholder = "Date and place of Conference - Formatted nn-nn MMM, YYYY.";
      newDate.name = "date_of_conference";
      reference_form.appendChild(newDate);

      var _newP19 = document.createElement("p");
      _newP19.innerText = "Place of Publication:";
      _newP19.classList.add("ref_par");
      reference_form.appendChild(_newP19);

      var _newPlace2 = document.createElement("input");
      _newPlace2.type = "text";
      _newPlace2.placeholder = "Place of Publication";
      _newPlace2.name = "place_of_publication";
      reference_form.appendChild(_newPlace2);

      var _newP20 = document.createElement("p");
      _newP20.innerText = "Publisher:";
      _newP20.classList.add("ref_par");
      reference_form.appendChild(_newP20);

      var _newPub2 = document.createElement("input");
      _newPub2.type = "text";
      _newPub2.placeholder = "Publisher";
      _newPub2.name = "publisher";
      reference_form.appendChild(_newPub2);

      var newP10 = document.createElement("p");
      newP10.innerText = "Pages (formatted as: \"pp.n-n\", where n is a number):";
      newP10.classList.add("ref_par");
      reference_form.appendChild(newP10);

      var _newPages = document.createElement("input");
      _newPages.type = "text";
      _newPages.placeholder = "Pages (formatted as: \"pp.n-n\", where n is a number)";
      _newPages.name = "pages";
      reference_form.appendChild(_newPages);
    } else if (reference_form_type === "journal") {
      // Authors
      // Year of Publication
      // Title of Article
      // Title of Journal
      // Volume and Part number
      // pages

      var _newP21 = document.createElement("p");
      _newP21.innerText = "Please enter the authors, by: \n separating each author with a space, followed by a forward slash, followed by a space ( / ):";
      _newP21.classList.add("ref_par");
      reference_form.appendChild(_newP21);

      var _newAuth4 = document.createElement("input");
      _newAuth4.type = "text";
      _newAuth4.placeholder = "Please enter the authors, by separating each author with a space, followed by a forward slash, followed by a space ( / ):";
      _newAuth4.name = "authors";
      reference_form.appendChild(_newAuth4);

      var _newP22 = document.createElement("p");
      _newP22.innerText = "Date Published (yyyy):";
      _newP22.classList.add("ref_par");
      reference_form.appendChild(_newP22);

      var _newYP4 = document.createElement("input");
      _newYP4.type = "text";
      _newYP4.maxlength = "4";
      _newYP4.minlength = "4";
      _newYP4.placeholder = "yyyy - Date Published";
      _newYP4.name = "date_published";
      reference_form.appendChild(_newYP4);

      var _newP23 = document.createElement("p");
      _newP23.innerText = "Title of Article:";
      _newP23.classList.add("ref_par");
      reference_form.appendChild(_newP23);

      var newArtTitle = document.createElement("input");
      newArtTitle.type = "text";
      newArtTitle.placeholder = "Title of Article";
      newArtTitle.name = "article_title";
      reference_form.appendChild(newArtTitle);

      var _newP24 = document.createElement("p");
      _newP24.innerText = "Title of Journal:";
      _newP24.classList.add("ref_par");
      reference_form.appendChild(_newP24);

      var _newTitle4 = document.createElement("input");
      _newTitle4.type = "text";
      _newTitle4.placeholder = "Title of Journal";
      _newTitle4.name = "journal_title";
      reference_form.appendChild(_newTitle4);

      var _newP25 = document.createElement("p");
      _newP25.innerText = "Volume Number (issue or part number):";
      _newP25.classList.add("ref_par");
      reference_form.appendChild(_newP25);

      var newVolNum = document.createElement("input");
      newVolNum.type = "text";
      newVolNum.placeholder = "Volume Number (issue or part number)";
      newVolNum.name = "volume_number";
      reference_form.appendChild(newVolNum);

      var _newP26 = document.createElement("p");
      _newP26.innerText = "Pages (formatted as: \"pp.n-n\", where n is a number):";
      _newP26.classList.add("ref_par");
      reference_form.appendChild(_newP26);

      var _newPages2 = document.createElement("input");
      _newPages2.type = "text";
      _newPages2.placeholder = "Pages (formatted as: \"n-n\", where n is a number)";
      _newPages2.name = "pages";
      reference_form.appendChild(_newPages2);
    } else if (reference_form_type === "blog") {

      // Authors
      // Year published
      // Title of the entry
      // Title of blog
      // Full date of blog entry
      // Viewed date of blog entry
      // URL

      var _newP27 = document.createElement("p");
      _newP27.innerText = "Please enter the authors, by: \n separating each author with a space, followed by a forward slash, followed by a space ( / ):";
      _newP27.classList.add("ref_par");
      reference_form.appendChild(_newP27);

      var _newAuth5 = document.createElement("input");
      _newAuth5.type = "text";
      _newAuth5.placeholder = "Please enter the authors, by separating each author with a space, followed by a forward slash, followed by a space ( / )";
      _newAuth5.name = "authors";
      reference_form.appendChild(_newAuth5);

      var _newP28 = document.createElement("p");
      _newP28.innerText = "Title of Blog Entry:";
      _newP28.classList.add("ref_par");
      reference_form.appendChild(_newP28);

      var newBlogEntryTitle = document.createElement("input");
      newBlogEntryTitle.type = "text";
      newBlogEntryTitle.placeholder = "Title of Blog Entry";
      newBlogEntryTitle.name = "title_of_entry";
      reference_form.appendChild(newBlogEntryTitle);

      var _newP29 = document.createElement("p");
      _newP29.innerText = "Title of Blog:";
      _newP29.classList.add("ref_par");
      reference_form.appendChild(_newP29);

      var newBlogTitle = document.createElement("input");
      newBlogTitle.type = "text";
      newBlogTitle.placeholder = "Title of Blog";
      newBlogTitle.name = "title_of_blog";
      reference_form.appendChild(newBlogTitle);

      var _newP30 = document.createElement("p");
      _newP30.innerText = "Date Published (yyyy):";
      _newP30.classList.add("ref_par");
      reference_form.appendChild(_newP30);

      var _newYP5 = document.createElement("input");
      _newYP5.type = "text";
      _newYP5.maxlength = "4";
      _newYP5.minlength = "4";
      _newYP5.placeholder = "Date Published (yyyy)";
      _newYP5.name = "date_published";
      reference_form.appendChild(_newYP5);

      var _newP31 = document.createElement("p");
      _newP31.innerText = "Date Accessed, formatted as yyyy-mm-dd (ISO date standard):";
      _newP31.classList.add("ref_par");
      reference_form.appendChild(_newP31);

      var _newDA = document.createElement("input");
      _newDA.type = "text";
      _newDA.maxlength = "10";
      _newDA.placeholder = "yyyy-mm-dd";
      _newDA.name = "date_accessed";
      reference_form.appendChild(_newDA);

      var _newP32 = document.createElement("p");
      _newP32.innerText = "Date blog post was published, formatted as yyyy-mm-dd (ISO date standard):";
      _newP32.classList.add("ref_par");
      reference_form.appendChild(_newP32);

      var newDAF = document.createElement("input");
      newDAF.type = "text";
      newDAF.maxlength = "10";
      newDAF.placeholder = "yyyy-mm-dd";
      newDAF.name = "date_published_full";
      reference_form.appendChild(newDAF);

      var _newP33 = document.createElement("p");
      _newP33.innerText = "Please enter a valid URL:";
      _newP33.classList.add("ref_par");
      reference_form.appendChild(_newP33);

      var _newURL = document.createElement("input");
      _newURL.type = "url";
      _newURL.placeholder = "URL";
      _newURL.name = "url";
      reference_form.appendChild(_newURL);
    } else if (reference_form_type === "image") {
      // Originators / Authors - authors
      // Date Published - date_published
      // Title image - title 
      // Date Viewed - date_accessed
      // URL - url
      var _newP34 = document.createElement("p");
      _newP34.innerText = "Please enter the authors, by: \n separating each author with a space, followed by a forward slash, followed by a space ( / ):";
      _newP34.classList.add("ref_par");
      reference_form.appendChild(_newP34);

      var _newAuth6 = document.createElement("input");
      _newAuth6.type = "text";
      _newAuth6.placeholder = "Please enter the authors, formatted correctly";
      _newAuth6.name = "authors";
      reference_form.appendChild(_newAuth6);

      var _newP35 = document.createElement("p");
      _newP35.innerText = "Date Published (yyyy):";
      _newP35.classList.add("ref_par");
      reference_form.appendChild(_newP35);

      var _newYP6 = document.createElement("input");
      _newYP6.type = "text";
      _newYP6.maxlength = "4";
      _newYP6.minlength = "4";
      _newYP6.placeholder = "yyyy - Date Published";
      _newYP6.name = "date_published";
      reference_form.appendChild(_newYP6);

      var _newP36 = document.createElement("p");
      _newP36.innerText = "Title of Image:";
      _newP36.classList.add("ref_par");
      reference_form.appendChild(_newP36);

      var _newTitle5 = document.createElement("input");
      _newTitle5.type = "text";
      _newTitle5.placeholder = "Title of Image";
      _newTitle5.name = "title";
      reference_form.appendChild(_newTitle5);

      var _newP37 = document.createElement("p");
      _newP37.innerText = "Date Accessed, formatted as yyyy-mm-dd (ISO date standard):";
      _newP37.classList.add("ref_par");
      reference_form.appendChild(_newP37);

      var _newDA2 = document.createElement("input");
      _newDA2.type = "text";
      _newDA2.maxlength = "10";
      _newDA2.placeholder = "yyyy-mm-dd";
      _newDA2.name = "date_accessed";
      reference_form.appendChild(_newDA2);

      var _newP38 = document.createElement("p");
      _newP38.innerText = "Please enter a valid URL:";
      _newP38.classList.add("ref_par");
      reference_form.appendChild(_newP38);

      var _newURL2 = document.createElement("input");
      _newURL2.type = "url";
      _newURL2.placeholder = "URL";
      _newURL2.name = "url";
      reference_form.appendChild(_newURL2);
    } else if (reference_form_type === "film") {
      // Title - title
      // Year
      // Material designation (already filled in with [film])
      // Subsidiary Originator - originator
      // Production Details

      var _newP39 = document.createElement("p");
      _newP39.innerText = "Title of film or video:";
      _newP39.classList.add("ref_par");
      reference_form.appendChild(_newP39);

      var _newTitle6 = document.createElement("input");
      _newTitle6.type = "text";
      _newTitle6.placeholder = "Title of film or video";
      _newTitle6.name = "title";
      reference_form.appendChild(_newTitle6);

      var _newP40 = document.createElement("p");
      _newP40.innerText = "Date Published (yyyy):";
      _newP40.classList.add("ref_par");
      reference_form.appendChild(_newP40);

      var _newYP7 = document.createElement("input");
      _newYP7.type = "text";
      _newYP7.maxlength = "4";
      _newYP7.minlength = "4";
      _newYP7.placeholder = "yyyy - Date Published";
      _newYP7.name = "date_published";
      reference_form.appendChild(_newYP7);

      var _newP41 = document.createElement("p");
      _newP41.innerText = "Material Designation (for a film, enter: [film] ):";
      _newP41.classList.add("ref_par");
      reference_form.appendChild(_newP41);

      var mat_des = document.createElement("input");
      mat_des.type = "text";
      mat_des.placeholder = "Material Designation (for a film, enter [film] ).";
      mat_des.value = "[film]";
      mat_des.name = "material_designation";
      reference_form.appendChild(mat_des);

      var _newP42 = document.createElement("p");
      _newP42.innerText = "Subsidiary Originator:";
      _newP42.classList.add("ref_par");
      reference_form.appendChild(_newP42);

      var newSubO = document.createElement("input");
      newSubO.type = "text";
      newSubO.name = "subsidiary_originator";
      newSubO.placeholder = "Subsidiary originator";
      reference_form.appendChild(newSubO);

      var _newP43 = document.createElement("p");
      _newP43.innerText = "Production Details:";
      _newP43.classList.add("ref_par");
      reference_form.appendChild(_newP43);

      var newProdDetails = document.createElement("input");
      newProdDetails.type = "text";
      newProdDetails.name = "production_details";
      newProdDetails.placeholder = "Production Details";
      reference_form.appendChild(newProdDetails);
    } else if (reference_form_type === "newspaper_magazine") {
      // Authors
      // Year Published
      // Title of Article
      // Title of Newspaper / magazine
      // day and month published
      // pages 

      var _newP44 = document.createElement("p");
      _newP44.innerText = "Please enter the authors, by: \n separating each author with a space, followed by a forward slash, followed by a space ( / ):";
      _newP44.classList.add("ref_par");
      reference_form.appendChild(_newP44);

      var _newAuth7 = document.createElement("input");
      _newAuth7.type = "text";
      _newAuth7.placeholder = "Please enter the authors, formatted correctly";
      _newAuth7.name = "authors";
      reference_form.appendChild(_newAuth7);

      var _newP45 = document.createElement("p");
      _newP45.innerText = "Date Published (yyyy):";
      _newP45.classList.add("ref_par");
      reference_form.appendChild(_newP45);

      var _newYP8 = document.createElement("input");
      _newYP8.type = "text";
      _newYP8.maxlength = "4";
      _newYP8.minlength = "4";
      _newYP8.placeholder = "yyyy - Date Published";
      _newYP8.name = "date_published";
      reference_form.appendChild(_newYP8);

      var _newP46 = document.createElement("p");
      _newP46.innerText = "Title of Article:";
      _newP46.classList.add("ref_par");
      reference_form.appendChild(_newP46);

      var newTA = document.createElement("input");
      newTA.type = "text";
      newTA.placeholder = "Title of Article";
      newTA.name = "title_of_article";
      reference_form.appendChild(newTA);

      var _newP47 = document.createElement("p");
      _newP47.innerText = "Title of Newspaper / Magazine:";
      _newP47.classList.add("ref_par");
      reference_form.appendChild(_newP47);

      var newTNM = document.createElement("input");
      newTNM.type = "text";
      newTNM.placeholder = "Title of Newspaper / Magazine";
      newTNM.name = "title_of_newspaper";
      reference_form.appendChild(newTNM);

      var _newP48 = document.createElement("p");
      _newP48.innerText = "Day and Month Published (formatted as dd MMMM, e.g. 7 June):";
      _newP48.classList.add("ref_par");
      reference_form.appendChild(_newP48);

      var newDMP = document.createElement("input");
      newDMP.type = "text";
      newDMP.placeholder = "Day and Month Published (formatted as dd MMMM, e.g. 7 June):";
      newDMP.name = "day_and_month_published";
      reference_form.appendChild(newDMP);

      var _newP49 = document.createElement("p");
      _newP49.innerText = "Pages (formatted as: \"n-n\", where n is a number. Example: 1-2): ";
      _newP49.classList.add("ref_par");
      reference_form.appendChild(_newP49);

      var _newPages3 = document.createElement("input");
      _newPages3.type = "text";
      _newPages3.placeholder = "Pages (formatted as: \"n-n\", where n is a number. Example: 1-2): ";
      _newPages3.name = "pages";
      reference_form.appendChild(_newPages3);
    } else if (reference_form_type === "online_report") {

      var _newP50 = document.createElement("p");
      _newP50.innerText = "Please enter the authors, by: \n separating each author with a space, followed by a forward slash, followed by a space ( / ):";
      _newP50.classList.add("ref_par");
      reference_form.appendChild(_newP50);

      var _newAuth8 = document.createElement("input");
      _newAuth8.type = "text";
      _newAuth8.placeholder = "Please enter the authors, by separating each author with a space, followed by a forward slash, followed by a space ( / )";
      _newAuth8.name = "authors";
      reference_form.appendChild(_newAuth8);

      var _newP51 = document.createElement("p");
      _newP51.innerText = "Please enter a valid URL:";
      _newP51.classList.add("ref_par");
      reference_form.appendChild(_newP51);
      var _newURL3 = document.createElement("input");
      _newURL3.type = "url";
      _newURL3.placeholder = "URL";
      _newURL3.name = "url";
      reference_form.appendChild(_newURL3);

      var _newP52 = document.createElement("p");
      _newP52.innerText = "Title:";
      _newP52.classList.add("ref_par");
      reference_form.appendChild(_newP52);

      var _newTitle7 = document.createElement("input");
      _newTitle7.type = "text";
      _newTitle7.placeholder = "Title";
      _newTitle7.name = "title";
      reference_form.appendChild(_newTitle7);

      var _newP53 = document.createElement("p");
      _newP53.innerText = "Place of Publication:";
      _newP53.classList.add("ref_par");
      reference_form.appendChild(_newP53);

      var _newPlace3 = document.createElement("input");
      _newPlace3.type = "text";
      _newPlace3.placeholder = "Place of Publication";
      _newPlace3.name = "place_of_publication";
      reference_form.appendChild(_newPlace3);

      var _newP54 = document.createElement("p");
      _newP54.innerText = "Publisher:";
      _newP54.classList.add("ref_par");
      reference_form.appendChild(_newP54);

      var _newPub3 = document.createElement("input");
      _newPub3.type = "text";
      _newPub3.placeholder = "Publisher";
      _newPub3.name = "publisher";
      reference_form.appendChild(_newPub3);

      var _newP55 = document.createElement("p");
      _newP55.innerText = "Date Published (yyyy):";
      _newP55.classList.add("ref_par");
      reference_form.appendChild(_newP55);

      var _newYP9 = document.createElement("input");
      _newYP9.type = "text";
      _newYP9.maxlength = "4";
      _newYP9.minlength = "4";
      _newYP9.placeholder = "yyyy - Date Published";
      _newYP9.name = "date_published";
      reference_form.appendChild(_newYP9);

      var _newP56 = document.createElement("p");
      _newP56.innerText = "Date Accessed, formatted as yyyy-mm-dd (ISO date standard):";
      _newP56.classList.add("ref_par");
      reference_form.appendChild(_newP56);

      var _newDA3 = document.createElement("input");
      _newDA3.type = "text";
      _newDA3.maxlength = "10";
      _newDA3.placeholder = "yyyy-mm-dd";
      _newDA3.name = "date_accessed";
      reference_form.appendChild(_newDA3);
    } else if (reference_form_type === "tv") {
      console.log("[ORT.JS] Reference was a TV Broadcast. Creating TV Broadcast form.");
      // Title
      // Date
      // Time
      // Channel

      var _newP57 = document.createElement("p");
      _newP57.innerText = "Title of the programme:";
      _newP57.classList.add("ref_par");
      reference_form.appendChild(_newP57);

      var _newTitle8 = document.createElement("input");
      _newTitle8.type = "text";
      _newTitle8.placeholder = "Title of the programme";
      _newTitle8.name = "title";
      reference_form.appendChild(_newTitle8);

      var _newP58 = document.createElement("p");
      _newP58.innerText = "Date Published (yyyy):";
      _newP58.classList.add("ref_par");
      reference_form.appendChild(_newP58);

      var _newDate = document.createElement("input");
      _newDate.type = "text";
      _newDate.placeholder = "Date Published (yyyy)";
      _newDate.name = "date_published";
      reference_form.appendChild(_newDate);

      var _newP59 = document.createElement("p");
      _newP59.innerText = "Material Designation (for TV, it is [TV], or for radio, it is [radio] ):";
      _newP59.classList.add("ref_par");
      reference_form.appendChild(_newP59);

      var newMD = document.createElement("input");
      newMD.type = "text";
      newMD.placeholder = "Material Designation (for TV, it is [TV], or for radio, it is [radio] )";
      newMD.name = "material_designation";
      newMD.value = "[TV]";
      reference_form.appendChild(newMD);

      var _newP60 = document.createElement("p");
      _newP60.innerText = "Channel:";
      _newP60.classList.add("ref_par");
      reference_form.appendChild(_newP60);

      var newC = document.createElement("input");
      newC.type = "text";
      newC.placeholder = "Channel";
      newC.name = "channel";
      reference_form.appendChild(newC);

      var _newP61 = document.createElement("p");
      _newP61.innerText = "Day and Month Published (formatted as dd MMMM, e.g. 7 June) ";
      _newP61.classList.add("ref_par");
      reference_form.appendChild(_newP61);

      var _newDMP = document.createElement("input");
      _newDMP.type = "text";
      _newDMP.placeholder = "Day and Month Published (formatted as dd MMMM, e.g. 7 June):";
      _newDMP.name = "day_and_month_published";
      reference_form.appendChild(_newDMP);

      var _newP62 = document.createElement("p");
      _newP62.innerText = "Time of Broadcast (formatted in 24 hours. Example: 18:00)";
      _newP62.classList.add("ref_par");
      reference_form.appendChild(_newP62);

      var newTB = document.createElement("input");
      newTB.type = "text";
      newTB.placeholder = "Time of Broadcast (formatted in 24 hours. Example: 18:00)";
      newTB.name = "time";
      reference_form.appendChild(newTB);
    } else if (reference_form_type === "manual") {
      // Manual - Being removed from the code, as it should not be
      // needed anymore.
    } else {
      console.log("[ORT.JS] Reference type has not been encountered before:", reference_form_type);
    }
  }
});

// Function that will remove a reference from a folder
function delete_reference(folder_name, reference_info) {
  if (!folder_name) {
    console.log("[ORT.JS] Attempted deletion - missing folder name or reference_info", folder_name, reference_info);
  } else {
    // Check that the folder name is correct
    db.TextStore.where("folder_name").equals(folder_name).toArray(function (results) {
      if (results.length === 0 || !results) {
        console.log("[ORT.JS] Failure - no folder exists with this name:", folder_name, results);
      } else if (results.length === 1 && results[0].folder_name === folder_name) {
        var references = results[0].references;
        console.log("[ORT.JS] Attempting to delete the reference.", reference_info);
        console.log(references[reference_info]);
        references.splice(reference_info, 1);
        console.log(references[reference_info]);
        results[0].references = references;
        db.TextStore.put(results[0]);
        // Re-display the folder to show the changes
        display_folder_contents(folder_name);
      } else {
        console.log("[ORT.JS] Failure - more than one result, or an unknown issue:", folder_name, results);
      }
    });
  }
}

// Listens for the "export" button and generates the respective text for it
function export_references(folder_name) {
  if (!folder_name) {
    console.log("[ORT.JS] Attempted export - missing folder name", folder_name);
  } else {
    console.log("[ORT.JS] Export - folder name is OK, checking if the folder exists...");
    db.TextStore.where("folder_name").equals(folder_name).toArray(function (results) {
      if (results.length === 0 || !results) {
        console.log("[ORT.JS] Failure to search when exporting - no results found.", results);
      } else if (results.length === 1 && results[0].folder_name === folder_name) {
        console.log("[ORT.JS] Found the correct folder to export:", folder_name, results);
        // Now that we have the right folder to export, we can go ahead
        // and get the contents of the references
        var references = results[0].references;
        // Create the element that they are going to sit in
        var newExportCtn = document.createElement("textarea");
        newExportCtn.placeholder = "If there is nothing inside of this container, please re-export the folder!";
        newExportCtn.style.width = "80%";
        newExportCtn.style.height = "25vh";
        newExportCtn.style.display = "block";

        // References have been obtained, but it is neccessary to process
        // any duplicates within this.
        appendDuplicates(references);

        // Got the references
        for (var f = 0; f < references.length; f++) {

          if (references[f].type === "website") {

            var string = "" + references[f].authors + ", " + references[f].date_published + ". " + references[f].title + " [viewed " + processDate(references[f].date_accessed) + "]. Available from: " + references[f].url;
            newExportCtn.value = newExportCtn.value + string + "\n\n";

            // Next reference!
          } else if (references[f].type === "book") {

            var _string = "" + references[f].authors + ", " + references[f].date_published + ". " + references[f].title + ". " + processEdition(references[f].edition) + "" + references[f].place_of_publication + ": " + references[f].publisher;
            newExportCtn.value = newExportCtn.value + _string + "\n\n";

            // Next reference!
          } else if (references[f].type === "chapter") {

            var _string2 = "" + references[f].authors_of_chapter + ", " + references[f].date_published + ". " + references[f].chapter_title + ". In: " + processEditors(references[f].authors_of_book) + "" + references[f].title + ". " + processEdition(references[f].edition) + "" + references[f].place_of_publication + ": " + references[f].publisher + ", " + references[f].pages;
            newExportCtn.value = newExportCtn.value + _string2 + "\n\n";

            // Next Reference!
          } else if (references[f].type === "conference") {

            var _string3 = "" + references[f].authors_of_chapter + ", " + references[f].date_published + ". " + references[f].chapter_title + ". In: " + processEditors(references[f].authors_of_book) + "" + processEdition(references[f].edition) + "" + references[f].place_of_publication + ": " + references[f].publisher + ", " + references[f].pages;
            newExportCtn.value = newExportCtn.value + _string3 + "\n\n";

            // Next reference!
          } else if (references[f].type === "journal") {

            var _string4 = "" + references[f].authors + ", " + references[f].date_published + ". " + references[f].article_title + ". " + references[f].journal_title + ", " + references[f].volume_number + ", " + references[f].pages;
            newExportCtn.value = newExportCtn.value + _string4 + "\n\n";

            // Next reference!
          } else if (references[f].type === "blog") {

            var _string5 = "" + references[f].authors + ", " + references[f].date_published + ". " + references[f].title_of_entry + ". In: " + references[f].title_of_blog + ". " + processDate(references[f].date_published_full) + " [viewed " + processDate(references[f].date_accessed) + "]. Available from: " + references[f].url;
            newExportCtn.value = newExportCtn.value + _string5 + "\n\n";
          } else if (references[f].type === "image") {

            // Originators / Authors - authors
            // Date Published - date_published
            // Title image - title 
            // Date Viewed - date_accessed
            // URL - url

            var _string6 = "" + references[f].authors + ", " + references[f].date_published + " [digital image] [viewed " + processDate(reference[f].date_accessed) + "]. Available from: " + references[f].url;
            newExportCtn.value = newExportCtn.value + _string6 + "\n\n";

            // Next reference
          } else if (references[f].type === "film") {

            var _string7 = "" + references[f].title + ", " + references[f].date_published + ". " + references[f].material_designation + " " + references[f].subsidiary_originator + " " + references[f].production_details;
            newExportCtn.value = newExportCtn.value + _string7 + "\n\n";

            // Next reference
          } else if (references[f].type === "newspaper_magazine") {

            var _string8 = "" + references[f].authors + ", " + references[f].date_published + ". " + references[f].title_of_article + ". " + references[f].title_of_newspaper + ", " + references[f].day_and_month_published + ", " + references[f].pages;
            newExportCtn.value = newExportCtn.value + _string8 + "\n\n";

            // Next reference
          } else if (references[f].type === "online_report") {

            var _string9 = "" + references[f].authors + ", " + references[f].date_published + ". " + references[f].title + ". " + references[f].place_of_publication + ": " + references[f].publisher + " [viewed " + processDate(date_accessed) + "]. Available from: " + references[f].url;
            newExportCtn.value = newExportCtn.value + _string9 + "\n\n";

            // Next reference
          } else if (references[f].type === "tv") {

            var _string10 = "" + references[f].title + ", " + references[f].date_published + " " + references[f].material_designation + ". " + references[f].channel + ", " + references[f].day_and_month_published + ", " + references[f].time + "";
            newExportCtn.value = newExportCtn.value + _string10 + "\n\n";

            // Next Reference!
          } else {
            console.log("[ORT.JS] Reference type has never been encountered before.");
          }
          // Append the new reference to the value of the textarea,
          // with a paragraph in between
        }
        // Sort the textarea by alphabetical order
        newExportCtn.value = newExportCtn.value.split("\n\n").sort().join("\n\n");
        // Append the new textarea to the folder-display

        // Remove any old textareas before continuing
        try {
          var textareas = document.querySelectorAll("textarea");
          for (r = 0; r < textareas.length; r++) {
            textareas[r].parentNode.removeChild(textareas[r]);
          }
        } catch (e) {
          console.log("[ORT.JS] No textareas available.", e);
        }

        var folder_cards = document.querySelector(".reference");
        document.getElementById("folder-display").insertBefore(newExportCtn, folder_cards);
      } else {
        console.log("[ORT.JS] Unknown error when exporting:", folder_name, results);
      }
    });
  }
}

// Event Listener: Loops through each of the sections,
// and hides them to display the "folder create" button on the left of the menu
document.getElementById("folder-create-button").addEventListener('click', function () {
  // A rewrite using the .dialog-hide class
  var folder_create_dialog = document.getElementById("folder-create-folder-dialog");
  // Remove the class from the folder create dialog
  folder_create_dialog.classList.remove("dialog-hide");

  // Remove the value that the folder name creation has
  document.getElementById("folder-create-name").value = "";

  // Add the class to the other two elements
  document.getElementById("folder-display").classList.add("dialog-hide");
  document.getElementById("folder-create-reference-dialog").classList.add("dialog-hide");
});

// Event listener for the folder creation button
document.getElementById("folder-create-form-button").addEventListener("click", function () {
  var folder_create_name = document.getElementById("folder-create-name");
  var folder_create_style = document.getElementById("folder-create-style");
  if (!folder_create_name.value || !folder_create_style.value || folder_create_name.value.trim() === "" || folder_create_style.value.trim() === "") {
    console.log("[ORT.JS] Either the folder name was blank, or the style was blank.", folder_create_name.value, folder_create_style.value);
    document.querySelector(".error").innerText = "Please enter a valid folder name before clicking \"Create Folder\".";
  } else {
    console.log("[ORT.JS] Folder Name and Folder Style:", folder_create_name.value, folder_create_style.value);
    // Next, create the folder in IndexedDB and create the next items for it
    // Try to get the UUID
    try {
      var UUID = localStorage.getItem("user_id");
      console.log("[ORT.JS] Got User ID, now checking for folder name...");
      // Search the DB to see if there is another result that is the same
      db.TextStore.where("folder_name").equalsIgnoreCase(folder_create_name.value.trim()).toArray(function (results) {
        if (results.length === 0) {
          // Folder name has not been created before
          db.TextStore.add({
            user_id: UUID,
            folder_name: folder_create_name.value.trim(),
            folder_style: folder_create_style.value.trim(),
            references: []
          }).then(function (results) {
            console.log("[ORT.JS] Added new folder to DB", results);
          }).catch(function (error) {
            console.log("[ORT.JS] Error occurred when inserting the new folder into the database.");
            console.log("[ORT.JS] Error output: ", error);
          });;

          // Next, regenerate that list.
          update_folder_names();
          // Once the names are generated, "click" the right element to
          // display it's contents
          display_folder_contents(folder_create_name.value.trim());

          // Also, remove the error text that was inserted into the error field
          document.querySelector(".error").innerText = "";
        } else {
          console.log("[ORT.JS] Folder name has already been created.", results, results.length);
          // Bring up the error
          document.querySelector(".error").innerText = "This folder has already been created. Please create another folder with a different name.";
        }
      });
    } catch (e) {
      console.log("[ORT.JS] Error getting the UUID", e);
    }
  }
});

function delete_folder(folder_name) {
  if (!folder_name) {
    console.log("[ORT.JS] No folder name given.", folder_name);
  } else {
    console.log("[ORT.JS] Folder name found.", folder_name);

    // Check information before deleting
    try {
      var UUID = localStorage.getItem("user_id");
      console.log("[ORT.JS] Got User ID, now checking for folder name...");
      // Search the DB to see if there is another result that is the same
      db.TextStore.where("folder_name").equals(folder_name).toArray(function (results) {
        if (results.length === 0) {
          console.log("[ORT.JS] Error - no matching folder name", folder_name, results);
        } else if (results.length === 1) {
          console.log("[ORT.JS] Matching folder name: ", folder_name, results);
          // Now, we can delete the folder / collection
          db.TextStore.where("folder_name").equals(folder_name).delete().then(function () {
            console.log("[ORT.JS] Deleted the folder named:", folder_name);
            update_folder_names();
            update_folder_names();
            // Hide the folder-display - it isn't showing anything
            // useful to the user
            var folder_display = document.getElementById("folder-display");
            folder_display.innerHTML = "";
            // That's all!
          });
        } else {
          console.log("[ORT.JS] Error occurred when attempting to delete the folder name", folder_name, results);
        }
      });
    } catch (e) {
      console.log("[ORT.JS] Error getting the UUID for the user.");
    }
  }
}

// This is an "added bonus" - it checks all elements of an array for the
// same value - if they match, the success. If they don't, then there
// are some issues
// This is added to every single array as a prototype

Array.prototype.allArrayValuesSame = function () {
  for (var i = 1; i < this.length; i++) {
    if (this[i] !== this[0]) {
      return false;
    }
  }
  return true;
};

function processDate(date) {
  if (date.length !== 10) {
    return false;
  } else {
    // parse the date
    var d = new Date(date);
    // array of months
    var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var string = "" + d.getDate() + " " + month[d.getMonth()] + " " + d.getFullYear() + "";
    console.log("[ORT.JS] Constructed Date: ", string);
    return string;
  }
}

// This segments and rejoins the authors string into
// a new string that can be accurately used with references
function processAuthors(input_authors) {
  // Format the authors correctly
  // 1. Split the string where there is (" / ")
  // 2. Capitalise the parts of the array that are not " / "
  // 3. Join the whole string together again
  // 4. reassign the authors part.
  var split_authors = input_authors.split(" / ");
  var authors = [];
  for (var i = 0; i < split_authors.length; i++) {
    if (split_authors[i] !== " / " && split_authors[i] !== "") {
      authors.push(split_authors[i].trim());
    }
  }

  if (authors.length === 1) {
    var _input_authors = "" + authors[0].toUpperCase() + "";
    return _input_authors;
  } else if (authors.length === 2) {
    var _input_authors2 = "" + authors[0].toUpperCase() + " and " + authors[1].toUpperCase() + "";
    return _input_authors2;
  } else if (authors.length === 3) {
    var _input_authors3 = "" + authors[0].toUpperCase() + ", " + authors[1].toUpperCase() + " and " + authors[2].toUpperCase() + "";
    return _input_authors3;
  } else if (authors.length > 3) {
    var _input_authors4 = "" + authors[0].toUpperCase() + " et al.";
    return _input_authors4;
  } else {
    // Do nothing - as the user may have a better idea.
    return input_authors;
  }
}

// Appends the edition with the period needed,
// if the edition exists.
function processEdition(edition) {
  if (edition !== "") {
    return edition + ". ";
  } else {
    return edition;
  }
}

// Appends ", ed." or ", eds." to the end of
// the book editors. Needed for the conference papers and the chapters
// in an edited book.

function processEditors(input_authors) {
  var split_authors = input_authors.split(" / ");
  var authors = [];
  for (var i = 0; i < split_authors.length; i++) {
    if (split_authors[i] !== " / " && split_authors[i] !== "") {
      authors.push(split_authors[i]);
    }
  }

  if (authors.length === 1) {
    var _input_authors5 = "" + authors[0].toUpperCase() + ", ed. ";
    return _input_authors5;
  } else if (authors.length === 2) {
    var _input_authors6 = "" + authors[0].toUpperCase() + " and " + authors[1].toUpperCase() + ", eds. ";
    return _input_authors6;
  } else if (authors.length === 3) {
    var _input_authors7 = "" + authors[0].toUpperCase() + ", " + authors[1].toUpperCase() + " and " + authors[2].toUpperCase() + ", eds. ";
    return _input_authors7;
  } else if (authors.length > 3) {
    var _input_authors8 = "" + authors[0].toUpperCase() + " et al., eds. ";
    return _input_authors8;
  } else {
    // Do nothing - as the user may have a better idea.
    return input_authors;
  }
}

// removes underscores from the values - makes them look pretty when
// displaying the references
function removeUnderscores(string) {
  var split_string = string.split("_");
  var returned_string = split_string.join(" ");
  return returned_string;
}

function appendDuplicates(references) {
  var original_references = references;

  var alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

  if (!references) {
    console.log("[ORT.JS] Error processing the references:", references);
  } else {
    console.log("[ORT.JS] References have been obtained.", references);

    // First, get the references as though there have
    // been inserted into the textarea

    for (var _i = 0; _i < references.length; _i++) {
      if (references[_i].authors && !references[_i].authors_of_chapter) {
        var new_authors = processAuthors(references[_i].authors);
        references[_i].authors = new_authors;
      } else if (references[_i].authors_of_chapter && !references[_i].authors) {
        var new_authors_of_chapter = processAuthors(references[_i].authors_of_chapter);
        references[_i].authors_of_chapter = new_authors_of_chapter;
      }
    }

    for (var i = 0; i < references.length; i++) {
      if (i !== 0) {
        if (references[i].authors === references[i - 1].authors && !references[i].authors_of_chapter && !references[i - 1].authors_of_chapter || references[i].authors === references[i - 1].authors_of_chapter && !references[i].authors_of_chapter && !references[i - 1].authors || references[i].authors_of_chapter === references[i - 1].authors && references[i].authors && !references[i - 1].authors_of_chapter || references[i].authors_of_chapter === references[i - 1].authors_of_chapter && !references[i].authors && !references[i].authors) {
          if (references[i].date_published === references[i - 1].date_published) {
            if (!references[i - 1].suffix) {
              references[i - 1].suffix = alphabet[0];
              references[i].suffix = alphabet[1];
            } else {
              // Get the next element in the array, and use that
              // on the current reference.
              var letter = alphabet[alphabet.indexOf(references[i - 1].suffix) + 1];
              if (!letter || letter === -1) {
                console.log("[ORT.JS] Letter does not exist.", letter);
              } else {
                console.log("[ORT.JS] Letter exists, assigning it to a reference", letter);
                references[i].suffix = letter;
              }
            }
          }
        }
      }
    }

    // Next one appends the suffix to the year
    for (var i = 0; i < references.length; i++) {
      console.log("\n\n");
      console.log("[CALCULATED REFERENCE]", references[i]);
      console.log(references[i].suffix);
      console.log(i);
      if (!references[i].suffix) {
        console.log("Does not have a suffix. Moving on...");
      } else {
        // Append the suffix to the year, and remove the
        // suffix property from the year.
        console.log(references[i].suffix);
        references[i].date_published = references[i].date_published + references[i].suffix;
        console.log("[ORT.JS] Finished appending the suffix to the year:", references[i].date_published);
      }
    }

    // Returns the references, once they have been completed.
    // Even if there are no duplicates, this function still processes the
    // authors (though only for the authors section).
    return references;
  }
}

// Register the service worker here, after this script has finished loading
// to prevent any errors occuring.
