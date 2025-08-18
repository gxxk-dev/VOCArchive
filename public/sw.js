importScripts('/api/sw_config.js');

const CACHE_NAME = 'vocarchive-assets-v1';
const CACHEABLE_EXTENSIONS = ['.mp4', '.flac', '.mp3'];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    const { type, url } = event.data;

    switch (type) {
      case 'list_cache':
        handleListCache(event);
        break;
      case 'clear_cache':
        handleClearCache(event);
        break;
      case 'delete_cache_item':
        handleDeleteCacheItem(event, url);
        break;
    }
  }
});

async function handleListCache(event) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    const cacheItems = await Promise.all(
      requests.map(async (request) => {
        const response = await cache.match(request);
        if (response) {
          const size = response.headers.get('content-length') || 0;
          return {
            url: request.url,
            size: Number(size),
          };
        }
        return null;
      })
    );

    // Filter out any null items if a match wasn't found
    const validCacheItems = cacheItems.filter(item => item !== null);

    event.source.postMessage({
      type: 'cache_list',
      payload: validCacheItems,
    });
  } catch (error) {
    console.error('Error listing cache:', error);
  }
}

async function handleClearCache(event) {
  try {
    await caches.delete(CACHE_NAME);
    console.log('Cache cleared.');
    // Optionally, send a confirmation back to the client
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

async function handleDeleteCacheItem(event, url) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(url);
    console.log(`Cache item deleted: ${url}`);
    // Optionally, send a confirmation back to the client
  } catch (error) {
    console.error(`Error deleting cache item ${url}:`, error);
  }
}

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
