'use strict';

// ort_service_worker.js
// Provides the Service Worker functionality to the reference
// creation tool.

console.log("[ORT_SW] File loaded.");

var files = ['./', './index.html', './ort.css', './node_modules/whatwg-fetch/fetch.js', './node_modules/dexie/dist/dexie.js', './ort.js', './ort_service_worker.js'];

// Names of the caches (the first one is used for the normal cache, the other
// is used for the transition from one runtime to another).
// Helps to avoid constantly redownloading the same resources if there is an
// "upgrade" event.
var name = 'ORT-3';
var run_time = 'runtime';

// Installs the service worker into the browser and will cache all listed 
// resources in the array above.
self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(name).then(function (cache) {
    return cache.addAll(files);
  }).then(self.skipWaiting()));
});

// Activate events aid in cleaning up the previous cache
// Otherwise, they are useless, and don't really serve any other purpose
self.addEventListener('activate', function (event) {
  var currentCaches = [name, run_time];
  event.waitUntil(caches.keys().then(function (cacheNames) {
    return cacheNames.filter(function (cacheName) {
      return !currentCaches.includes(cacheName);
    });
  }).then(function (cachesToDelete) {
    return Promise.all(cachesToDelete.map(function (cacheToDelete) {
      return caches.delete(cacheToDelete);
    }));
  }).then(function () {
    return self.clients.claim();
  }));
});


// Fetch listener for network requests
// If there are any other calls for resources that are not in
// the cache, then the Service Worker will fetch them anyway, as a fallback.
self.addEventListener('fetch', function (event) {
  // Skip cross-origin requests (not neccessary)
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches.open(run_time).then(function (cache) {
        return fetch(event.request).then(function (response) {
          // A copy is used because if the response is cached, there is nothing
          // else to return, and therefore will cause issues in the browser.
          return cache.put(event.request, response.clone()).then(function () {
            return response;
          });
        });
      });
    }));
  }
});
