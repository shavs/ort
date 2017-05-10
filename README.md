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
  
