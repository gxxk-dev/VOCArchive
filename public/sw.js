const CACHE_NAME = 'vocarchive-assets-v1';
const ASSET_HOST = 'assets.vocarchive.com';
const CACHEABLE_EXTENSIONS = ['.mp4', '.flac', '.mp3'];

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Check if the request is for the target asset host and has a cacheable file extension
  if (url.hostname === ASSET_HOST && CACHEABLE_EXTENSIONS.some(ext => url.pathname.endsWith(ext))) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          // Return from cache if found
          if (response) {
            return response;
          }

          // Otherwise, fetch from network, cache, and return
          return fetch(event.request).then((networkResponse) => {
            // Check if we received a valid response
            if (networkResponse && networkResponse.status === 200) {
                // NOTE: A response can be consumed only once.
                // We need to clone it to put one copy in cache and serve the other one.
                cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
  } else {
    // For non-matching requests, just pass them through to the network.
    // This is the default behavior, but it's good to be explicit.
    return;
  }
});
