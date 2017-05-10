# Offline Referencing Tool using Web Technologies

## Project Unit Code: CDA600

## Project tutor: Nick Whitelegg

## Licence: See LICENCE.md


### Folder Structure
Currently, the project is broken into:
- server
  - server.js
  - get_references.js
  - get_user_id.js
  - delete_folder.js
- client
  - 

Both a "server" and a "client" are needed in order to make sure that referencing is handled correctly.

## Setup
You need to:
  - Install MongoDB binary
  - `npm install`, which should bring down all of the necessary components
    - The packages `babel-cli, babel-preset-es2015, whatwg-fetch, uuid, dexie` will need to be downloaded onto your machine
    - You may need to follow their installation instructions in order to
      create a working configuration.
    - e.g. for MongoDB, `sudo npm install -g mongodb; sudo npm link mongodb` was used to set up the MongoDB Node.js driver.
    - You will need to have valid HTTPS certificates in order to make use of Service Worker. Therefore, you may need to purchase, aquire or generate some self-signed certificates.
    - To use the Offline Referencing Tool on a local development server, you can
      generate self-signed certificates using [simplehttp2server](https://github.com/GoogleChrome/simplehttp2server/releases).
      On the first run of the program, it will generate two files: `key.pem` and `cert.pem`. These files are already preconfigured for use with the Offline Referencing Tool.
  - You may need to change the IP_ADDR, PORT and URL_ADDR for the hosting environment of your choice.
    
  - In order to run the server, type: `node server.js`. This will start the server, 
    and the website can be browsed from there.

## File Structure
As there is little to no file structure, the files belong to each component:
- Server
  - get_user_id.js, used when the user first browses the site
  - delete_folder.js, used to delete the folder from the server side and to
    return a HTTP status code
  - get_references.js, used to return the folder from the server side.
  - index.html, which is returned to the user if they request the root "/" or "index.html" from server.js, and contains the core framework for the application
  - test_web_services.html, a rudimentary page that offers a small testing platform. Separate code may be needed in order to test the web services.
  - server.js, the main server-side script that runs the offline referencing tool, and processess any requests that are made from the client-side to the server-side

- Client
  - dexie.js, used for IndexedDB manipulation
  - ort.css, for the basic style of the site
  - ort.js, the compiled version of ort_es6.js
  - ort_es6.js, which handles the client-side functionality, including registering the Service Worker, handling IndexedDB, and other duties
  - ort_service_worker.js, this is the Service Worker which is registered if the user has a supported browser

