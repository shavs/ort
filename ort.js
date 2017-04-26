/*jshint esversion: 6 */
console.log("--------------------------------------------------");
var SERVER_URL = "https://localhost:8080/";

// Check if the browser supports IndexedDB
// Also needed to check if IDB is available within Private Mode / Incognito
// https://github.com/dfahlander/Dexie.js/issues/312


// Create a new database for the folders,
// if it doesn't already exist
var db = new Dexie("folder_database");

// Next, create the database with the set version
db.version(1).stores({
  TextStore: "++id, folder_name"
}).upgrade(function (version){
  // Do something if the IDB needs updating.
  console.log("[ORT.JS] Database is being upgraded.");
});

var result;
db.open().catch(function (error){
  result = "enabled";
  document.body.innerHTML = "";
  document.body.innerHTML = "<h1>ERROR: IndexedDB is not supported in this browser OR this browser is in Private Mode / Incognito.</h1><p>This service requires the lastest browsers to use. Please try using:</p><ul><li>Mozilla Firefox</li><li>Google Chrome</li><li>Chromium</li></ul><p>outside of Private Browsing mode.</p><p>" + error + "</p>";
});
console.log("[ORT.JS] Result of IDB test: ", result);

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
    document.body.innerHTML = "";
    document.body.innerHTML = "<h1>ERROR: localStorage is not supported by this browser.</h1><p>This service requires the lastest browsers to use. Please try using:</p><ul><li>Mozilla Firefox</li><li>Google Chrome</li><li>Chromium</li></ul>";
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
      let folder_names_list = document.getElementById("folder-names-list");
      let folder_create_button = document.getElementById("folder-create-button");

      console.log("[ORT.JS] Length of results:", results.length);
      // Next, remove all of the li buttons
      folder_names_list.innerHTML = "";
      folder_names_list.appendChild(folder_create_button);
      
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

          // Create the heading element with the folder title inside:
          let newFT = document.createElement("h3");
          newFT.innerText = "" + folder_name + "";
          folder_display.appendChild(newFT);

          // Give a paragraph tag for some folder controls
          let newBT = document.createElement("h4");
          newBT.innerText = "Folder Controls";
          folder_display.appendChild(newBT);
          
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

          // Append the "export references" button
          let newDelBtn = document.createElement("button");
          newDelBtn.type="button";
          newDelBtn.innerText = "Delete this folder";
          newDelBtn.addEventListener("click", function () {
            // Exports the folder - needs only the folder name
            delete_folder(folder_name);
          });
          folder_display.appendChild(newDelBtn);

          
          if (references.length === 0 || !references) {
            console.log("[ORT.JS] No references to display:", references, references.length);
            document.querySelector(".error-no-references").innerText = "No references available for " + folder_name + ".\n\n Please create a reference using the button below.";
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
              newRefTitle.innerText = "Reference " + (i + 1) + " - type: " + removeUnderscores(references[i].type) + "";
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
                //edit_reference(folder_name, delval);
              //});
              //newDiv.appendChild(newEditButton);

              // For each property that the reference has
    
              // First, create a table

              var newTable = document.createElement("table");
              
              var keys = Object.keys(references[i]);
              keys.sort();

              for (var p = 0; p < keys.length; p++) {
                // Create the table row
                var k = keys[p];
                if (k !== "type") {
                  var newTableRow = document.createElement("tr");
                  let k_n = k.charAt(0).toUpperCase() + k.slice(1);
                  let key_name = removeUnderscores(k_n);
                  let newTH = document.createElement("th");
                  newTH.innerText = "" + key_name + "";
                  newTableRow.appendChild(newTH);
                  let newTD = document.createElement("td");
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

        // Reset the value of the select to the "blank" option
        document.getElementById("reference-type").options[0].selected = true;
        
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
        
        if (reference_type === "book" || reference_type === "chapter" || reference_type === "conference" || reference_type === "journal" || reference_type === "blog"  || reference_type === "image" || reference_type === "film" || reference_type === "newspaper_magazine" || reference_type === "online_report"|| reference_type === "tv" || reference_type === "website") {
          console.log("[ORT.JS] Reference is a website.");

          for (let c = 0; c < reference_form.childNodes.length; c++) {
            let child = reference_form.childNodes[c];
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

      
    } else if (reference_form_type === "conference") {
    
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

      let newDate = document.createElement("input");
      newDate.type = "text";
      newDate.placeholder = "Date and place of Conference - Formatted nn-nn MMM, YYYY.";
      newDate.name = "date_of_conference";
      reference_form.appendChild(newDate);

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
    
    } else if (reference_form_type === "journal") {
      // Authors
      // Year of Publication
      // Title of Article
      // Title of Journal
      // Volume and Part number
      // pages

      let newAuth = document.createElement("input");
      newAuth.type = "text";
      newAuth.placeholder = "Please enter the authors, formatted correctly. Authors / Editors of the chapter";
      newAuth.name = "authors";
      reference_form.appendChild(newAuth);

      let newYP = document.createElement("input");
      newYP.type = "text";
      newYP.maxlength = "4";
      newYP.minlength = "4";
      newYP.placeholder = "yyyy - Date Published";
      newYP.name = "date_published";
      reference_form.appendChild(newYP);

      let newArtTitle = document.createElement("input");
      newArtTitle.type = "text";
      newArtTitle.placeholder = "Title of Article";
      newArtTitle.name = "article_title";
      reference_form.appendChild(newArtTitle);

      let newTitle = document.createElement("input");
      newTitle.type = "text";
      newTitle.placeholder = "Title of Journal";
      newTitle.name = "journal_title";
      reference_form.appendChild(newTitle);

      let newVolNum = document.createElement("input");
      newVolNum.type = "text";
      newVolNum.placeholder = "Volume Number (issue or part number)";
      newVolNum.name = "volume_number";
      reference_form.appendChild(newVolNum);
      
      let newPages = document.createElement("input");
      newPages.type = "text";
      newPages.placeholder = "Pages (formatted as: \"n-n\", where n is a number)";
      newPages.name = "pages";
      reference_form.appendChild(newPages);
    
    } else if (reference_form_type === "blog") {

      // Authors
      // Year published
      // Title of the entry
      // Title of blog
      // Full date of blog entry
      // Viewed date of blog entry
      // URL

      let newAuth = document.createElement("input");
      newAuth.type = "text";
      newAuth.placeholder = "Please enter the authors, formatted correctly";
      newAuth.name = "authors";
      reference_form.appendChild(newAuth);
      
      let newBlogEntryTitle = document.createElement("input");
      newBlogEntryTitle.type = "text";
      newBlogEntryTitle.placeholder = "Title of Blog Entry";
      newBlogEntryTitle.name = "title_of_entry";
      reference_form.appendChild(newBlogEntryTitle);

      let newBlogTitle = document.createElement("input");
      newBlogTitle.type = "text";
      newBlogTitle.placeholder = "Title of Blog";
      newBlogTitle.name = "title_of_blog";
      reference_form.appendChild(newBlogTitle);
      
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

      let newDAF = document.createElement("input");
      newDAF.type = "text";
      newDAF.maxlength = "10";
      newDAF.placeholder = "yyyy-mm-dd";
      newDAF.name = "date_published_full";
      reference_form.appendChild(newDAF);
      
      let newURL = document.createElement("input");
      newURL.type = "url";
      newURL.placeholder = "URL";
      newURL.name = "url";
      reference_form.appendChild(newURL);

    
    } else if (reference_form_type === "image") {
      // Originators / Authors - authors
      // Date Published - date_published
      // Title image - title 
      // Date Viewed - date_accessed
      // URL - url

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
      newTitle.placeholder = "Title of image";
      newTitle.name = "title";
      reference_form.appendChild(newTitle);

      let newDA = document.createElement("input");
      newDA.type = "text";
      newDA.maxlength = "10";
      newDA.placeholder = "yyyy-mm-dd";
      newDA.name = "date_accessed";
      reference_form.appendChild(newDA);

      let newURL = document.createElement("input");
      newURL.type = "url";
      newURL.placeholder = "URL";
      newURL.name = "url";
      reference_form.appendChild(newURL);
    
    } else if (reference_form_type === "film") {
      // Title - title
      // Year
      // Material designation (already filled in with [film])
      // Subsidiary Originator - originator
      // Production Details
      let newTitle = document.createElement("input");
      newTitle.type = "text";
      newTitle.placeholder = "Title of film or video";
      newTitle.name = "title";
      reference_form.appendChild(newTitle);

      let newYP = document.createElement("input");
      newYP.type = "text";
      newYP.maxlength = "4";
      newYP.minlength = "4";
      newYP.placeholder = "yyyy - Date Published";
      newYP.name = "date_published";
      reference_form.appendChild(newYP);

      let mat_des = document.createElement("input");
      mat_des.type = "text";
      mat_des.placeholder = "Material Designation (for a film, enter [film] ).";
      mat_des.value = "[film]";
      mat_des.name = "material_designation";
      reference_form.appendChild(mat_des);

      let newSubO = document.createElement("input");
      newSubO.type = "text";
      newSubO.name = "subsidiary_originator";
      newSubO.placeholder = "Subsidiary originator";
      reference_form.appendChild(newSubO);

      let newProdDetails = document.createElement("input");
      newProdDetails.type = "text";
      newProdDetails.name = "production_details";
      newProdDetails.placeholder = "Production Details";
      reference_form.appendChild(newProdDetails);
      
    } else if (reference_form_type === "newspaper_magazine") {
      
    } else if (reference_form_type === "online_report") {
      
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
          
          if (references[f].type === "website") {
            
            var string = "" + processAuthors(references[f].authors) + ", " + references[f].date_published + ". " + references[f].title + " [viewed " + processDate(references[f].date_accessed) + "]. Available from: " + references[f].url;
            newExportCtn.value = newExportCtn.value + string + "\n\n";
            
            // Next reference!
          } else if (references[f].type === "book") {
            
            let string = "" + processAuthors(references[f].authors) + ", " + references[f].date_published + ". " + references[f].title + ". " + processEdition(references[f].edition) + "" + references[f].place_of_publication + ": " + references[f].publisher;
            newExportCtn.value = newExportCtn.value + string + "\n\n";
            
            // Next reference!
          } else if (references[f].type === "chapter") {
            
            let string = "" + processAuthors(references[f].authors_of_chapter) + ", " + references[f].date_published + ". " + references[f].chapter_title + ". In: " + processEditors(references[f].authors_of_book) + "" + references[f].title + ". " + processEdition(references[f].edition) + "" + references[f].place_of_publication + ": " + references[f].publisher + ", " + references[f].pages;
            newExportCtn.value = newExportCtn.value + string + "\n\n";
            
            // Next Reference!
          } else if (references[f].type === "conference") {
                                                                                                                                                                                                                        // TODO Missing whether there is an editors part or not. Just needs to count.
            let string = "" + processAuthors(references[f].authors_of_chapter) + ", " + references[f].date_published + ". " + references[f].chapter_title + ". In: " + processEditors(references[f].authors_of_book) + "" + processEdition(references[f].edition) + "" + references[f].place_of_publication + ": " + references[f].publisher + ", " + references[f].pages;
            newExportCtn.value = newExportCtn.value + string + "\n\n";
            
            // Next reference!
          } else if (references[f].type === "journal") {
            
            let string = "" + processAuthors(references[f].authors) + ", " + references[f].date_published + ". " + references[f].article_title + ". " + references[f].journal_title + ", " + references[f].volume_number + ", " + references[f].pages;
            newExportCtn.value = newExportCtn.value + string + "\n\n";
            
            // Next reference!
          } else if (references[f].type === "blog") {
            
            let string = "" + processAuthors(references[f].authors) + ", " + references[f].date_published + ". " + references[f].title_of_entry + ". In: " + references[f].title_of_blog + ". " + processDate(references[f].date_published_full) + " [viewed " + processDate(references[f].date_accessed) + "]. Available from: " + references[f].url;
            newExportCtn.value = newExportCtn.value + string + "\n\n";
            
          } else if (references[f].type === "image") {
             
            // Originators / Authors - authors
            // Date Published - date_published
            // Title image - title 
            // Date Viewed - date_accessed
            // URL - url
            
            let string = "" + processAuthors(references[f].authors) + ", " + references[f].date_published + " [digital image] [viewed " + processDate(reference[f].date_accessed) + "]. Available from: " + references[f].url;
            newExportCtn.value = newExportCtn.value + string + "\n\n";
            
            // Next reference
          } else if (references[f].type === "film") {

            let string = "" + references[f].title + ", " + references[f].date_published + ". " + references[f].material_designation + " " + references[f].subsidiary_originator + " " + references[f].production_details;
            newExportCtn.value = newExportCtn.value + string + "\n\n";
            
            // Next reference
          } else if (references[f].type === "newspaper_magazine") {
          
          
            // Next reference
          } else if (references[f].type === "online_report") {
            
            
            
            // Next reference
          } else if (references[f].type === "tv") {


            
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
          let textareas = document.querySelectorAll("textarea");
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
document.getElementById("folder-create-button").addEventListener('click', function (){
  // A rewrite using the .dialog-hide class
  var folder_create_dialog = document.getElementById("folder-create-folder-dialog");
  // Remove the class from the folder create dialog
  folder_create_dialog.classList.remove("dialog-hide");

  // Remove the value that the folder name creation has
  document.getElementById("folder-create-name").value="";

  
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
      db.TextStore
        .where("folder_name").equalsIgnoreCase(folder_create_name.value.trim())
        .toArray(function(results){
          if (results.length === 0) {
            // Folder name has not been created before
            db.TextStore.add({
              user_id : UUID,
              folder_name : folder_create_name.value.trim(),
              folder_style : folder_create_style.value.trim(),
              references : []
            });
            
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

function delete_folder (folder_name) {
  if (!folder_name) {
    console.log("[ORT.JS] No folder name given.", folder_name);
  } else {
    console.log("[ORT.JS] Folder name found.", folder_name);

    // Check information before deleting
    try {
      var UUID = localStorage.getItem("user_id");
      console.log("[ORT.JS] Got User ID, now checking for folder name...");
      // Search the DB to see if there is another result that is the same
      db.TextStore
        .where("folder_name").equals(folder_name)
        .toArray(function(results){
          if (results.length === 0) {
            console.log("[ORT.JS] Error - no matching folder name", folder_name, results);
          } else if (results.length === 1) {
            console.log("[ORT.JS] Matching folder name: ", folder_name, results);
            // Now, we can delete the folder / collection
             db.TextStore.where("folder_name")
              .equals(folder_name)
              .delete()
              .then( function(){
                console.log("[ORT.JS] Deleted the folder named:", folder_name);
                update_folder_names();
                update_folder_names();
                // Hide the folder-display - it isn't showing anything
                // useful to the user
                let folder_display = document.getElementById("folder-display");
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

Array.prototype.allArrayValuesSame = function() {
  for (var i = 1; i < this.length; i++) {
    if(this[i] !== this[0]) {
      return false;
    }
  }
  return true;
};

function processDate (date) {
  if (date.length !== 10) {
    return false;
  } else {
    // parse the date
    let d = new Date(date);
    // array of months
    let month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var string = "" + d.getDate() + " " + month[d.getMonth()] + " " + d.getFullYear() + "";
    console.log("[ORT.JS] Constructed Date: ", string);
    return string;
  }
}

function processAuthors (input_authors) {
  // Format the authors correctly
  // 1. Split the string where there is (" / ")
  // 2. Capitalise the parts of the array that are not " / "
  // 3. Join the whole string together again
  // 4. reassign the authors part.
  var split_authors = input_authors.split(" / ");
  var authors = [];
  for (let i = 0; i < split_authors.length; i++) {
    if (split_authors[i] !== " / " && split_authors[i] !== "") {
      authors.push(split_authors[i].trim());
    }
  }
  
  if (authors.length === 1) {
    let input_authors = "" + authors[0].toUpperCase() + "";
    return input_authors;
  } else if (authors.length === 2) {
    let input_authors = "" + authors[0].toUpperCase() + " and " + authors[1].toUpperCase() + "";
    return input_authors;
  } else if (authors.length === 3) {
    let input_authors = "" + authors[0].toUpperCase() + ", " + authors[1].toUpperCase() + " and " + authors[2].toUpperCase() + "";
    return input_authors;
  } else if (authors.length > 3) {
    let input_authors = "" + authors[0].toUpperCase() + " et al.";
    return input_authors;
  } else {
    // Do nothing - as the user may have a better idea.
    return input_authors;
  }
}

// Appends the edition with the period needed,
// if the edition exists.
function processEdition (edition) {
  if (edition !== "") {
    return edition + ". ";
  } else {
    return edition;
  }
}

// Appends ", ed." or ", eds." to the end of
// the book editors. Needed for the conference papers and the chapters
// in an edited book.

function  processEditors(input_authors) {
  var split_authors = input_authors.split(" / ");
  var authors = [];
  for (let i = 0; i < split_authors.length; i++) {
    if (split_authors[i] !== " / " && split_authors[i] !== "") {
      authors.push(split_authors[i]);
    }
  }
  
  if (authors.length === 1) {
    let input_authors = "" + authors[0].toUpperCase() + ", ed. ";
    return input_authors;
  } else if (authors.length === 2) {
    let input_authors = "" + authors[0].toUpperCase() + " and " + authors[1].toUpperCase() + ", eds. ";
    return input_authors;
  } else if (authors.length === 3) {
    let input_authors = "" + authors[0].toUpperCase() + ", " + authors[1].toUpperCase() + " and " + authors[2].toUpperCase() + ", eds. ";
    return input_authors;
  } else if (authors.length > 3) {
    let input_authors = "" + authors[0].toUpperCase() + " et al., eds. ";
    return input_authors;
  } else {
    // Do nothing - as the user may have a better idea.
    return input_authors;
  }
}

// removes underscores from the values - makes them look pretty when
// displaying the references
function removeUnderscores (string) {
  var split_string = string.split("_");
  let returned_string = split_string.join(" ");
  return returned_string;
}

// Register the service worker here, after this script has finished loading
// to prevent any errors occuring.
if ("serviceWorker" in navigator && result === "enabled" ) {
  window.addEventListener("load", function() {
    navigator.serviceWorker.register("/ort_service_worker.js").then(function(registration) {
      // Registration was successful
      console.log("[ORT.JS] ServiceWorker registration successful with scope: ", registration.scope);
    }, function(err) {
      // registration failed :(
      console.log("[ORT.JS] ServiceWorker registration failed:", err);
    });
  });
}

