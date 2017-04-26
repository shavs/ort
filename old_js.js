// A read-only array of the alphabet
// Used to append
const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

function processReferences (references) {

  for (let q = 0; q < references.length; q++) {
    let reference = references[q];
    if (reference.authors) {
      let newAuthors = processAuthors(reference.authors);
      references[q].authors = newAuthors;
    } else if (reference.authors_of_book) {
      let newAuthors = processAuthors(reference.authors_of_book);
      references[q].authors_of_book = newAuthors;
    } else if (reference.authors_of_chapter) {
      let newAuthors = processAuthors(reference.authors_of_chapter);
      references[q].authors_of_chapter = newAuthors;
    } else {
      // Do nothing; leave this as is
    }
  }

// Now that the proper authors have been created,
// now we need to check for any duplicates
  var matching_years = [];
  var array_position = [];
  for (a = 0; a < references.length; a++) {
    for (b = 0; b < references.length; b++) {
      var reference = reference[a];
      var duplicate_reference = reference[b];
      
      if (JSON.stringify(reference[a]) === JSON.stringify(reference[b])) {
        // Ignore it, it is the same reference
      } else if (reference.authors === duplicate_reference.authors || reference.authors === duplicate_reference.authors_of_chapter || reference.authors === duplicate_reference.authors_of_book || reference.authors_of_chapter === duplicate_reference.authors || reference.authors_of_chapter === duplicate_reference.authors_of_chapter || reference.authors_of_chapter === duplicate_reference.authors_of_book || reference.authors_of_book === duplicate_reference.authors || reference.authors_of_book === duplicate_reference.authors_of_chapter || reference.authors_of_book === duplicate_reference.authors_of_book) {
        // If the authors match, check the published year
        if (reference.date_published === duplicate_reference.date_published) {
          matching_years.push(reference.date_published);
        }
        
      } else {
        
      }
    }
    
  }
  
  
  for (var i = 0; i < references.length; i++) {
    var reference = references[i];

    let d = 0;
    while ( d !== references.length) {
      // Get the first reference, check it against this reference
      for (b = 0; b < references[b]; b++) {
        var duplicate_reference = references[b];
        if (JSON.stringify(reference) === JSON.stringify(duplicate_reference)) {
          console.log("[ORT.JS] This reference is exactly the same as each other", reference, duplicate_reference);
        } else if (reference.authors === duplicate_reference.authors || reference.authors === duplicate_reference.authors_of_chapter || reference.authors === duplicate_reference.authors_of_book || reference.authors_of_chapter === duplicate_reference.authors || reference.authors_of_chapter === duplicate_reference.authors_of_chapter || reference.authors_of_chapter === duplicate_reference.authors_of_book || reference.authors_of_book === duplicate_reference.authors || reference.authors_of_book === duplicate_reference.authors_of_chapter || reference.authors_of_book === duplicate_reference.authors_of_book) {
          console.log("\n\n\n[ORT.JS] - A matching author was found - checking the date_published...");
          if (reference.date_published === duplicate_reference.date_published) {
            console.log("[ORT.JS] The reference has a matching year - now we need to append the year.", reference, duplicate_reference);
            // Now, we need to add the year to it
            matching_years.push(reference.);
          } else if (!reference.date_published || !duplicate_reference.date_published) {
            console.log("[ORT.JS] The reference does not have a published date.");
            matching_years.push("");
          } else {
            // Nothing
          }
        } else {
          // Nothing
        }
      }
      d++;
    }
  }

}

