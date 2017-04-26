// ort_service_worker.js
// Provides the Service Worker functionality to the reference
// creation tool.

console.log("[ORT_SW] File loaded.");

var name_of_cache = 'ORT-1';

var files = [
  './',
  './index.html',
  './ort.css',
  './dexie.js',
  './ort.js',
  './ort_service_worker.js'
];

self.addEventListener('install', function(event){
  console.log('[ORT_SW] - installation');
  event.waitUntil(
    caches.open(name_of_cache).then(function(cache){
      console.log('[ORT_SW] caching files');
      return cache.addAll(files);
    })
  );
});

self.addEventListener('activate', function(event){
  console.log('[ORT_SW] activated');

  // Cache preening is needed here - delete all available cache values
  // except from the current cache value.
  var CacheWhiteList = ['new-cache-5'];

  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (CacheWhiteList.indexOf(key) === -1) {
          console.log('[ORT_SW] Deleting cache key: ', key);          
          return caches.delete(key);
        }
       })
      );
    })
  );
});

self.addEventListener('fetch', function(event){
  console.log('[ORT_SW] intercepted a fetch event', event.request.url);
  
  event.respondWith(
    caches.match(event.request).then(function(response){
      if ( response ){
        console.log('[ORT_SW] Found in cache', event.request.url);
        return response;
      }
      // if the response is not in the cache, request it and cache it
      var clone = event.request.clone();
      fetch(clone)
        .then(function(response){
          if (!response){
            console.log('[ORT_SW] There was no response from the fetch request.');
          }
          
          var response_clone = response.clone();
          
          caches.open(name_of_cache).then(function(cache){
            cache.put(event.request, response_clone);
            console.log('[ORT_SW] New information has been cached', event.request.url);
            return response;
          });
        });
    })
    .catch(function(error){
      console.log('[ORT_SW] error fetching and caching new information: ', error);
    })
  );
});
