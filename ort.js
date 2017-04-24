console.log("--------------------------------------------------");
var SERVER_URL = "https://localhost:8080/"

// Create a new database for the folders,
// if it doesn't already exist
var db = new Dexie("folder_database");

// Next, create the database with the set version
db.version(1).stores({
  TextStore: "++id, folder_name"
}).upgrade(function (){
  // Do something if the IDB needs updating.
  console.log("[ORT.JS] Database is being upgraded.");
})

window.addEventListener('load', function () {
  try {
    var user_id = localStorage.getItem("user_id");
    if (!user_id) {
      fetch(SERVER_URL + "api/get_user_id").then(function(response){
        console.log("[ORT.JS] Response Received, converting to JSON...");
        return response.json();
      }).then(function(data){
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
        
      }).catch(function(error){
        console.log("[ORT.JS] Error! Something went wrong during the fetch:", error);
      });
    } else {
      console.log("[ORT.JS] Looks like the User ID has already been set.");
    }

    // Update the sidebar of folder information
    update_folder_names();
  } catch (e) {
    console.log("[ORT.JS] Looks like localStorage is not supported.");
    console.log(e);
    document.write("<h1>ERROR: localStorage is not supported by this browser.</h1><p>This service requires the lastest browsers to use. Please try using:</p><ul><li>Mozilla Firefox</li><li>Google Chrome</li><li>Chromium</li></ul>");
  }
});

function update_folder_names () {
  // In this function, we need to find any existing folders and display their
  // names on the left-hand side of the folder creator.
  console.log("[ORT.JS] Finding Existing folders and Displaying them to the user");
  
  // 1. Find the available folders
  db.TextStore.toArray(function(results){
    console.log("[ORT.JS] Result of Search: ", results);
    if (results.length === 0) {
      console.log("[ORT.JS] No folder names to display.");
    } else {
      console.log("[ORT.JS] Displaying each of the folder names");
      let folder_names_list = document.getElementById("folder-names-list");
      let folder_create_button = document.getElementById("folder-create-button");

      console.log("[ORT.JS] Length of results:", results.length);
      // Next, remove all of the li buttons
      folder_names_list.innerHTML = "";
      folder_names_list.appendChild(folder_create_button);
      
      // Next, add each of the names of the folders as children on the left
      for (let i = 0; i < results.length; i++) {
        let folder_name = results[i].folder_name;
        console.log("[ORT.JS] Folder name being created:", folder_name);
        let newLi = document.createElement("li");
        let newLiContent = document.createTextNode(folder_name);
        newLi.appendChild(newLiContent);
        // Give it the appropriate CSS class
        newLi.className = "folder-name";
        console.log("[ORT.JS] New element being inserted into the DOM:", newLi);

        // Give the element an event listener
        newLi.addEventListener("click", function () {
          // Trigger a separate function that displays the folder's contents
          display_folder_contents(newLi.innerText);
        });

        // Insert the element into the DOM
        folder_names_list.insertBefore(newLi, folder_create_button);
      }
    }
  });
}

// Function that is triggered when a folder has been clicked.
function display_folder_contents (folder_name) {
  // Check if the folder_name was a valid value
  if (!folder_name) {
    // Folder name was not valid
    console.log("[ORT.JS] Folder name was invalid.", folder_name);
  } else {
    // folder name was valid, check if it exists within IndexedDB
    console.log("[ORT.JS] Folder name was valid:", folder_name);
    console.log("[ORT.JS] Checking folder is in IndexedDB");
    db.TextStore
      .where("folder_name").equals(folder_name)
      .toArray(function(results){
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
          let createErrorPar = document.createElement("p");
          createErrorPar.classList.add("error-no-references");
          folder_display.appendChild(createErrorPar);
          
          // Append the "create reference" button
          let newRefButton = document.createElement("button");
          newRefButton.type = "button";
          newRefButton.innerText = "Add a new Reference";
          newRefButton.addEventListener("click", function(){
            // Needs the folder name
            add_reference(folder_name);
          });
          folder_display.appendChild(newRefButton);

          // Append the "export references" button
          let newExpBtn = document.createElement("button");
          newExpBtn.type="button";
          newExpBtn.innerText = "Export References as Plain Text";
          newExpBtn.addEventListener("click", function () {
            // Exports the folder - needs only the folder name
            export_references(folder_name);
          });
          folder_display.appendChild(newExpBtn);

          
          if (references.length === 0 || !references) {
            console.log("[ORT.JS] No references to display:", references, references.length);
            document.querySelector(".error-no-references").innerText = "No references available. Please create a reference using the button below.";
          } else {
            // If there are any references to display
            console.log("[ORT.JS] There are references to display:", references, references.length);

            // First, store any neccessary HTML as a let
            document.querySelector(".error-no-references").innerText = "";

            // Next, for each reference that exists
            for (i = 0; i < references.length; i++) {
              console.log("[ORT.JS] Reference:", references[i], i);
              // create a new div container
              let newDiv = document.createElement("div");
              newDiv.className = "reference";
              // Create a small title for each of the references
              newRefTitle = document.createElement("h4");
              newRefTitle.innerText = "Reference " + (i + 1);
              newDiv.appendChild(newRefTitle);

              // Append a delete button

              let delval = i;
              newDeleteButton = document.createElement("button");
              newDeleteButton.type = "button";
              newDeleteButton.innerText = "Delete this Reference";
              newDeleteButton.addEventListener("click", function(){
                delete_reference(folder_name, delval);
              });
              newDiv.appendChild(newDeleteButton);

              // Append an edit button
              //newEditButton = document.createElement("button");
              //newEditButton.type = "button";
              //newEditButton.innerText = "Edit this Reference";
              //newEditButton.addEventListener("click", function(){
                //edit_reference();
              //});
              //newDiv.appendChild(newEditButton);

              // For each property that the reference has
              var keys = Object.keys(references[i]);
              keys.sort();

              for (var p = 0; p < keys.length; p++) {
                let k = keys[p];
                
                newPar = document.createElement("p");
                newPar.className = "reference_info";
                newPar.innerText = "" + k.charAt(0).toUpperCase() + k.slice(1) + ": " + references[i][k];

                // Append the new property to the document element
                console.log("[ORT.JS] New Element Created:", newPar, newPar.innerText);
                newDiv.appendChild(newPar);
              }
              // Append the new reference div to the document
              document.getElementById("folder-display").appendChild(newDiv);
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
function add_reference (folder_name) {
  if (!folder_name) {
    console.log("[ORT.JS] No folder name specified:", folder_name);
  } else {
    // Folder name
    // Query the DB for the folder name, then display a form for the user
    console.log("[ORT.JS] Folder name is: ", folder_name);
    console.log("[ORT.JS] Checking if folder name is valid with IDB...");
    db.TextStore.where("folder_name").equals(folder_name).toArray(function(results){
      if (results.length === 0 || !results) {
        console.log("[ORT.JS] Error - no folder name exists when searching for the existing folder.", folder_name, results);
      } else if (results.length === 1) {
        console.log("[ORT.JS] Success - a single folder exists for the folder name found", folder_name, results);

        // Now that we have the folder, we need to
        // display the form that allows reference adding to the folder.

        document.getElementById("folder-create-reference-dialog").classList.remove("dialog-hide");
        document.getElementById("folder-create-folder-dialog").classList.add("dialog-hide");
        document.getElementById("folder-display").classList.add("dialog-hide");
        
        // Get the button, remove it, then add a new button with an additional event listener
        var save_reference_button = document.getElementById("folder-create-reference-dialog").querySelector("button");
        
        document.getElementById("folder-create-reference-dialog").removeChild(save_reference_button);

        newSaveRefBtn = document.createElement("button");
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
    db.TextStore.where("folder_name").equals(folder_name).toArray(function(results){
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
        
        if (reference_type === "website") {
          console.log("[ORT.JS] Reference is a website.");

          for (let c = 0; c < reference_form.childNodes.length; c++) {
            let child = reference_form.childNodes[c];
            console.log("[ORT.JS] Found Child: ", child);
            
            // We only need input tags
            if (child.tagName.toLowerCase() === "input") {
              console.log("[ORT.JS] Found the tag", child.tagName.toLowerCase);
              // Append the property name and the value of the named property
              ref_info[child.name] = child.value;
              // One check that might be needed is if any of the values are
              // empty
            }
          }

          // Get the reference type, and append it to the object.
          ref_info["type"] = document.getElementById("reference-type").value;
          Object.keys(ref_info).sort();
          
        } else if (reference_type === "book") {
          console.log("[ORT.JS] Reference is a website.");

          for (let c = 0; c < reference_form.childNodes.length; c++) {
            let child = reference_form.childNodes[c];
            console.log("[ORT.JS] Found Child: ", child);
            
            // We only need input tags
            if (child.tagName.toLowerCase() === "input") {
              console.log("[ORT.JS] Found the tag", child.tagName.toLowerCase);
              // Append the property name and the value of the named property
              ref_info[child.name] = child.value;
              // One check that might be needed is if any of the values are
              // empty
            }
          }

          // Get the reference type, and append it to the object.
          ref_info["type"] = document.getElementById("reference-type").value;
          Object.keys(ref_info).sort();

          // TODO

        } else if (reference_type === "chapter") {
          console.log("[ORT.JS] Reference is a chapter.");

          for (let c = 0; c < reference_form.childNodes.length; c++) {
            let child = reference_form.childNodes[c];
            console.log("[ORT.JS] Found Child: ", child);
            
            // We only need input tags
            if (child.tagName.toLowerCase() === "input") {
              console.log("[ORT.JS] Found the tag", child.tagName.toLowerCase);
              // Append the property name and the value of the named property
              ref_info[child.name] = child.value;
              // One check that might be needed is if any of the values are
              // empty
            }
          }

          // Get the reference type, and append it to the object.
          ref_info["type"] = document.getElementById("reference-type").value;
          Object.keys(ref_info).sort();
        } else if (reference_type === "tv") {
          console.log("[ORT.JS] Reference is a TV Programme.");
          
        } else if (reference_type === "manual") {
          console.log("[ORT.JS] Manual reference selected.");
          
        } else {
          console.log("[ORT.JS] No reference type found. Don't do anything.", reference_type);
        }

        console.log("[ORT.JS]", ref_info);

        // Put the results into the folder
        results[0].references.push(ref_info);
        
        console.log("[ORT.JS] This is going to replace the current folder", results);

        // add the reference to the folder
        db.TextStore.put(results[0]);

        // Remove the contents of the form
        var reference_form = document.getElementById("reference-form");
        reference_form.innerHTML = "";

        // Display the contents of the folder to the user again

        display_folder_contents(folder_name);
      } else {
        console.log("[ORT.JS] Either more than one folder was found, or there wan another error with the results", folder_name, results, results.length);
      }
    });
  }
}

// Event listener that waits and generates the appropriate fields for the references
document.getElementById("reference-type").addEventListener("click", function () {
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
      
      let newAuth = document.createElement("input");
      newAuth.type = "text";
      newAuth.placeholder = "Please enter the authors, formatted correctly";
      newAuth.name = "authors";
      reference_form.appendChild(newAuth);

      let newURL = document.createElement("input");
      newURL.type = "url";
      newURL.placeholder = "URL";
      newURL.name = "url";
      reference_form.appendChild(newURL);

      let newTitle = document.createElement("input");
      newTitle.type = "text";
      newTitle.placeholder = "Title of Website";
      newTitle.name = "title";
      reference_form.appendChild(newTitle);

      let newPV = document.createElement("p");
      newPV.innerText = "Date Published";
      newPV.classList.add("ref_par");
      reference_form.appendChild(newPV);
      
      let newYP = document.createElement("input");
      newYP.type = "text";
      newYP.maxlength = "4";
      newYP.minlength = "4";
      newYP.placeholder = "yyyy - Date Published";
      newYP.name = "date_published";
      reference_form.appendChild(newYP);

      let newPA = document.createElement("p");
      newPA.innerText = "Date Accessed";
      newPA.classList.add("ref_par");
      reference_form.appendChild(newPA);
      
      let newDA = document.createElement("input");
      newDA.type = "text";
      newDA.maxlength = "10";
      newDA.placeholder = "yyyy-mm-dd";
      newDA.name = "date_accessed";
      reference_form.appendChild(newDA);

    } else if (reference_form_type === "book") {
      console.log("[ORT.JS] Reference was a book, creating book form...");

      let newAuth = document.createElement("input");
      newAuth.type = "text";
      newAuth.placeholder = "Please enter the authors, formatted correctly";
      newAuth.name = "authors";
      reference_form.appendChild(newAuth);

      let newYP = document.createElement("input");
      newYP.type = "text";
      newYP.maxlength = "4";
      newYP.minlength = "4";
      newYP.placeholder = "yyyy - Date Published";
      newYP.name = "date_published";
      reference_form.appendChild(newYP);

      let newTitle = document.createElement("input");
      newTitle.type = "text";
      newTitle.placeholder = "Title of Book";
      newTitle.name = "title";
      reference_form.appendChild(newTitle);

      let newEd = document.createElement("input");
      newEd.type = "text";
      newEd.placeholder = "Edition (leave blank if not applicable)";
      newEd.name = "edition";
      reference_form.appendChild(newEd);

      let newPlace = document.createElement("input");
      newPlace.type = "text";
      newPlace.placeholder = "Place of Publication";
      newPlace.name = "place_of_publication";
      reference_form.appendChild(newPlace);

      let newPub = document.createElement("input");
      newPub.type = "text";
      newPub.placeholder = "Publisher";
      newPub.name = "publisher";
      reference_form.appendChild(newPub);

    } else if (reference_form_type === "chapter"){
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
      
      let newAuth = document.createElement("input");
      newAuth.type = "text";
      newAuth.placeholder = "Please enter the authors, formatted correctly. Authors / Editors of the chapter";
      newAuth.name = "authors_of_chapter";
      reference_form.appendChild(newAuth);

      let newYP = document.createElement("input");
      newYP.type = "text";
      newYP.maxlength = "4";
      newYP.minlength = "4";
      newYP.placeholder = "yyyy - Date Published";
      newYP.name = "date_published";
      reference_form.appendChild(newYP);

      let newChapTitle = document.createElement("input");
      newChapTitle.type = "text";
      newChapTitle.placeholder = "Title of Chapter/Essay";
      newChapTitle.name = "chapter_title";
      reference_form.appendChild(newChapTitle);

      let newEdBook = document.createElement("input");
      newEdBook.type = "text";
      newEdBook.placeholder = "Authors of the book / Editors of the book";
      newEdBook.name = "authors_of_book";
      reference_form.appendChild(newEdBook);

      let newTitle = document.createElement("input");
      newTitle.type = "text";
      newTitle.placeholder = "Title of Book";
      newTitle.name = "title";
      reference_form.appendChild(newTitle);
      
      let newEd = document.createElement("input");
      newEd.type = "text";
      newEd.placeholder = "Edition (leave blank if not applicable)";
      newEd.name = "edition";
      reference_form.appendChild(newEd);

      let newPlace = document.createElement("input");
      newPlace.type = "text";
      newPlace.placeholder = "Place of Publication";
      newPlace.name = "place_of_publication";
      reference_form.appendChild(newPlace);

      let newPub = document.createElement("input");
      newPub.type = "text";
      newPub.placeholder = "Publisher";
      newPub.name = "publisher";
      reference_form.appendChild(newPub);

      let newPages = document.createElement("input");
      newPages.type = "text";
      newPages.placeholder = "Pages (formatted as: \"pp.n-n\", where n is a number)";
      newPages.name = "pages";
      reference_form.appendChild(newPages);

      
      
    } else if (reference_form_type === "tv") {
      console.log("[ORT.JS] Reference was a TV Broadcast. Creating TV Broadcast form.");
      // Title
      // Date
      // Time
      // Channel
      
      
      
    } else if (reference_form_type === "manual") {
      // Manual

      let newP = document.createElement("p");
      newP.innerText = "The input needs to be in a JSON format, with key-value input.";
      newP.classList.add("ref_par");
      reference_form.appendChild(newP);
      
      let newInp = document.createElement("input");
      newInp.type = "text";
      newInp.placeholder = "Please enter the reference manually.";
      newInp.name = "manual";
      reference_form.appendChild(newInp);
      
    } else {
      console.log("[ORT.JS] Reference type has not been encountered before:", reference_form_type);
    }
  }
});

// Function that will remove a reference from a folder
function delete_reference (folder_name, reference_info) {
  if (!folder_name) {
    console.log("[ORT.JS] Attempted deletion - missing folder name or reference_info", folder_name, reference_info);
  } else {
    // Check that the folder name is correct
    db.TextStore.where("folder_name").equals(folder_name).toArray(function(results){
      if (results.length === 0 || !results) {
        console.log("[ORT.JS] Failure - no folder exists with this name:", folder_name, results);
      } else if (results.length === 1 && results[0].folder_name === folder_name) {
        var references = results[0].references;
        console.log("[ORT.JS] Attempting to delete the reference.",reference_info);
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
function export_references (folder_name)  {
  if (!folder_name) {
    console.log("[ORT.JS] Attempted export - missing folder name", folder_name);
  } else {
    console.log("[ORT.JS] Export - folder name is OK, checking if the folder exists...");
    db.TextStore.where("folder_name").equals(folder_name).toArray(function(results) {
      if (results.length === 0 || !results){
        console.log("[ORT.JS] Failure to search when exporting - no results found.", results);
      } else if (results.length === 1 && results[0].folder_name === folder_name) {
        console.log("[ORT.JS] Found the correct folder to export:", folder_name, results);
        // Now that we have the right folder to export, we can go ahead
        // and get the contents of the references
        var references = results[0].references;
        // Create the element that they are going to sit in
        var newExportCtn = document.createElement("textarea");
        newExportCtn.placeholder="If there is nothing inside of this container, please re-export the folder!";
        newExportCtn.style.width = "80%";
        newExportCtn.style.height = "25vh";
        newExportCtn.style.display = "block";
        // Got the references
        for (let f = 0; f < references.length; f++) {
          console.log(references[f]);
          if (references[f].type === "website") {
            console.log("[ORT.JS] Website found, processing...");
            // Now, format the string correctly

            // Format the authors correctly
            // 1. Split the string where there is (" and ")
            // 2. Capitalise the parts of the array that are not " and "
            // 3. Join the whole string together again
            // 4. reassign the authors part.
            var split_authors = references[f].authors.split(" and ");
            for (let i = 0; i < split_authors.length; i++) {
              if (split_authors[i] !== " and ") {
                split_authors[i] = split_authors[i].toUpperCase();
              }
            }
            references[f].authors = split_authors.join(" and ");
            
            var string = "" + references[f].authors + ", " + references[f].date_published + ". " + references[f].title + " [viewed " + processDate(references[f].date_accessed) + "]. Available from: " + references[f].url;
            console.log("[ORT.JS] Constructed Reference:", string);
            // Insert into the textarea
            newExportCtn.value = newExportCtn.value + string + "\n\n";
            // Next reference!
          } else if (references[f].type === "book") {
            console.log("[ORT.JS] Book found, processing...");
            // Check if the edition is not blank
            if (references[f].edition !== "") {
              references[f].edition = references[f].edition + ". ";
            }

            // TODO
            
            var string = "" + references[f].authors.toUpperCase() + ", " + references[f].date_published + ". " + references[f].title + ". " + references[f].edition + "" + references[f].place_of_publication + ": " + references[f].publisher;
            newExportCtn.value = newExportCtn.value + string + "\n\n";
            // Next reference!
          } else if (references[f].type === "chapter") {
            console.log("[ORT.JS] Chapter of edited book found, processing...");

            // Check if the edition is not blank
            if (references[f].edition !== "") {
              references[f].edition = references[f].edition + ". ";
            }

            // TODO
            var string = "" + references[f].authors_of_chapter.toUpperCase() + ", " + references[f].date_published + ". " + references[f].chapter_title + ". In: " + references[f].authors_of_book.toUpperCase() + ", " + references[f].edition + "" + references[f].place_of_publication + ": " + references[f].publisher + ", " + references[f].pages;
            newExportCtn.value = newExportCtn.value + string + "\n\n";
            // Next Reference!
          } else if (references[f].type === "tv") {
            console.log("[ORT.JS] TV Programme found, processing...");
          } else {
            console.log("[ORT.JS] Reference has never been encountered before.");
          }
          // Append the new reference to the value of the textarea,
          // with a paragraph in between
        }
        // Append the new textarea to the folder-display
        document.getElementById("folder-display").appendChild(newExportCtn);
      } else {
        console.log("[ORT.JS] Unknown error when exporting:", folder_name, results);
      }
    });
  }
}

// Event Listener: Loops through each of the sections,
// and hides them to display the "folder create" button on the left of the menu
document.getElementById("folder-create-button").addEventListener('click', function (){
  // A rewrite using the .dialog-hide class
  var folder_create_dialog = document.getElementById("folder-create-folder-dialog");
  // Remove the class from the folder create dialog
  folder_create_dialog.classList.remove("dialog-hide");

  // Add the class to the other two elements
  document.getElementById("folder-display").classList.add("dialog-hide");
  document.getElementById("folder-create-reference-dialog").classList.add("dialog-hide");
});

// Event listener for the folder creation button
document.getElementById("folder-create-form-button").addEventListener("click", function () {
  var folder_create_name = document.getElementById("folder-create-name");
  var folder_create_style = document.getElementById("folder-create-style");
  if (!folder_create_name.value || !folder_create_style.value) {
    console.log("[ORT.JS] Either the folder name was blank, or the style was blank.", folder_create_name.value, folder_create_style.value);
  } else {
    console.log("[ORT.JS] Folder Name and Folder Style:", folder_create_name.value, folder_create_style.value);
    // Next, create the folder in IndexedDB and create the next items for it
    // Try to get the UUID
    try {
      var UUID = localStorage.getItem("user_id");
      console.log("[ORT.JS] Got User ID, now checking for folder name...");
      // Search the DB to see if there is another result that is the same
      db.TextStore
        .where("folder_name").equalsIgnoreCase(folder_create_name.value)
        .toArray(function(results){
          if (results.length === 0) {
            // Folder name has not been created before
            db.TextStore.add({
              user_id : UUID,
              folder_name : folder_create_name.value,
              folder_style : folder_create_style.value,
              references : []
            });
            
            // Next, regenerate that list.
            update_folder_names();
            // Once the names are generated, "click" the right element to
            // display it's contents
            display_folder_contents(folder_create_name.value);

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


// This is an "added bonus" - it checks all elements of an array for the
// same value - if they match, the success. If they don't, then there
// are some issues

Array.prototype.allArrayValuesSame = function() {
  for(var i = 1; i < this.length; i++) {
    if(this[i] !== this[0]) {
      return false;
    }
  }
  return true;
}

function processDate (date) {
  if (date.length !== 10) {
    return false;
  } else {
    // parse the date
    let d = new Date(date);
    // array of months
    let month = new Array();
    month[0] = "January";
    month[1] = "February";
    month[2] = "March";
    month[3] = "April";
    month[4] = "May";
    month[5] = "June";
    month[6] = "July";
    month[7] = "August";
    month[8] = "September";
    month[9] = "October";
    month[10] = "November";
    month[11] = "December";
    var string = "" + d.getDate() + " " + month[d.getMonth()] + " " + d.getFullYear() + "";
    console.log("[ORT.JS] Constructed Date: ", string);
    return string;
  }
}
