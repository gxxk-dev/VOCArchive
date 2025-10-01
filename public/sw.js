// 导入静态配置
importScripts('/sw-config.js');

// Service Worker版本标识
const SW_VERSION = 'v2.7.0';
console.log(`[SW] Service Worker 版本: ${SW_VERSION} 已加载`);

// 使用配置中的缓存名称或默认值
const CACHE_NAME = self.CACHE_CONFIG?.cacheName || 'vocarchive-cache-v2';
const REDIRECT_CACHE_NAME = 'vocarchive-redirects-v1';
const METADATA_CACHE_NAME = 'vocarchive-metadata-v1';

// 输出配置加载状态
console.log('[SW] 配置加载状态:', {
  EXTERNAL_HOSTS: self.EXTERNAL_HOSTS || [],
  CACHE_CONFIG: self.CACHE_CONFIG || {},
  ASSET_EXTENSIONS: self.ASSET_EXTENSIONS || []
});

console.log('[SW] Service Worker 配置已加载，外部主机数量:', (self.EXTERNAL_HOSTS || []).length);

// 文件大小元数据管理
async function storeFileMetadata(url, size, mimeType = null) {
  try {
    const metadataCache = await caches.open(METADATA_CACHE_NAME);
    const metadata = {
      url,
      size,
      mimeType,
      cachedAt: Date.now()
    };

    const metadataResponse = new Response(JSON.stringify(metadata), {
      headers: { 'Content-Type': 'application/json' }
    });

    await metadataCache.put(url, metadataResponse);
    console.log(`[SW] 存储文件元数据: ${url} = ${size} bytes`);
  } catch (error) {
    console.error(`[SW] 存储文件元数据失败: ${url}`, error);
  }
}

async function getFileMetadata(url) {
  try {
    const metadataCache = await caches.open(METADATA_CACHE_NAME);
    const metadataResponse = await metadataCache.match(url);

    if (metadataResponse) {
      const metadata = await metadataResponse.json();
      return metadata;
    }
  } catch (error) {
    console.error(`[SW] 获取文件元数据失败: ${url}`, error);
  }
  return null;
}

// 缓存策略配置
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Service Worker 消息处理
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    const { type, url } = event.data;

    switch (type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'list_cache':
        handleListCache(event);
        break;
      case 'clear_cache':
        handleClearCache(event);
        break;
      case 'delete_cache_item':
        handleDeleteCacheItem(event, url);
        break;
      case 'get_cache_stats':
        handleGetCacheStats(event);
        break;
      case 'check_cache_size':
        manageCacheSize();
        break;
      case 'get_sw_config':
        handleGetSWConfig(event);
        break;
    }
  }
});

// 列出缓存内容
async function handleListCache(event) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    console.log(`[SW] 处理缓存列表请求，找到 ${requests.length} 个缓存项`);

    const cacheItems = await Promise.all(
      requests.map(async (request) => {
        const response = await cache.match(request);
        if (response) {
          let size = 0;

          // 首先尝试从元数据缓存获取文件大小
          const metadata = await getFileMetadata(request.url);
          if (metadata && metadata.size > 0) {
            size = metadata.size;
            console.log(`[SW] 从元数据获取大小: ${request.url} = ${size} bytes`);
          } else if (metadata && metadata.size === -1) {
            // 对于元数据中标记为未知的文件，尝试从缓存响应头获取
            try {
              const actualSizeHeader = response.headers.get('x-actual-size');
              if (actualSizeHeader) {
                size = Number(actualSizeHeader);
                console.log(`[SW] 从缓存响应头获取大小: ${request.url} = ${size} bytes`);
                // 更新元数据
                await storeFileMetadata(request.url, size, response.headers.get('content-type'));
              } else {
                size = -1; // 保持未知状态
                console.log(`[SW] 文件大小仍然未知: ${request.url}`);
              }
            } catch (headerError) {
              size = -1;
              console.log(`[SW] 无法从响应头获取大小: ${request.url}`);
            }
          } else {
            // 如果没有元数据，尝试传统方法获取文件大小
            try {
              console.log(`[SW] 检查缓存项: ${request.url}, 响应类型: ${response.type}`);

              if (response.type === 'opaque') {
                // 对于opaque响应，检查是否有自定义大小头部
                const actualSizeHeader = response.headers.get('x-actual-size');
                if (actualSizeHeader) {
                  size = Number(actualSizeHeader);
                  console.log(`[SW] 从opaque响应头获取大小: ${request.url} = ${size} bytes`);
                  // 存储元数据以便下次使用
                  await storeFileMetadata(request.url, size, response.headers.get('content-type'));
                } else {
                  size = -1; // 使用-1表示未知大小
                  console.log(`[SW] opaque响应无法获取大小: ${request.url}`);
                }
              } else {
                // 对于普通响应，尝试从headers获取
                const contentLength = response.headers.get('content-length');
                if (contentLength) {
                  size = Number(contentLength);
                  console.log(`[SW] 从headers获取大小: ${request.url} = ${size} bytes (content-length)`);
                } else {
                  // 如果没有content-length，获取blob大小
                  const blob = await response.clone().blob();
                  size = blob.size;
                  console.log(`[SW] 从blob获取大小: ${request.url} = ${size} bytes (blob.size)`);
                }
              }
            } catch (error) {
              console.error(`[SW] 无法获取文件大小: ${request.url}`, error);
              size = -1; // 使用-1表示未知大小
            }
          }

          const host = new URL(request.url).hostname;
          const item = {
            url: request.url,
            size: size,
            host: host,
            type: getFileType(request.url)
          };

          console.log(`[SW] 缓存项信息:`, item);
          return item;
        }
        return null;
      })
    );

    const validCacheItems = cacheItems.filter(item => item !== null);

    console.log(`[SW] 返回缓存列表: ${validCacheItems.length} 项，总大小: ${validCacheItems.reduce((sum, item) => sum + (item.size > 0 ? item.size : 0), 0)} bytes`);

    event.source.postMessage({
      type: 'cache_list',
      payload: validCacheItems,
    });
  } catch (error) {
    console.error('Error listing cache:', error);
    event.source.postMessage({
      type: 'cache_error',
      error: error.message
    });
  }
}

// 清理缓存
async function handleClearCache(event) {
  try {
    await Promise.all([
      caches.delete(CACHE_NAME),
      caches.delete(REDIRECT_CACHE_NAME),
      caches.delete(METADATA_CACHE_NAME)
    ]);
    console.log('All caches cleared including metadata.');
    event.source.postMessage({
      type: 'cache_cleared'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    event.source.postMessage({
      type: 'cache_error',
      error: error.message
    });
  }
}

// 删除特定缓存项
async function handleDeleteCacheItem(event, url) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const metadataCache = await caches.open(METADATA_CACHE_NAME);

    await Promise.all([
      cache.delete(url),
      metadataCache.delete(url)
    ]);

    console.log(`Cache item and metadata deleted: ${url}`);
    event.source.postMessage({
      type: 'cache_item_deleted',
      url: url
    });
  } catch (error) {
    console.error(`Error deleting cache item ${url}:`, error);
    event.source.postMessage({
      type: 'cache_error',
      error: error.message
    });
  }
}

// 获取缓存统计
async function handleGetCacheStats(event) {
  try {
    const cacheNames = await caches.keys();
    const stats = await Promise.all(
      cacheNames
        .filter(name => name !== METADATA_CACHE_NAME) // 排除元数据缓存
        .map(async (cacheName) => {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();

          let totalSize = 0;
          let fileCount = 0;
          const hostStats = {};

          for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
              let size = 0;

              // 首先尝试从元数据获取文件大小
              const metadata = await getFileMetadata(request.url);
              if (metadata && metadata.size > 0) {
                size = metadata.size;
              } else if (metadata && metadata.size === -1) {
                // 对于未知大小的文件，使用占位符（不计入总大小）
                size = 0;
              } else {
                // 获取文件大小（处理opaque响应）
                try {
                  if (response.type === 'opaque') {
                    // 对于opaque响应，无法获取实际大小
                    size = 0;
                  } else {
                    // 对于普通响应，尝试从headers获取
                    const contentLength = response.headers.get('content-length');
                    if (contentLength) {
                      size = Number(contentLength);
                    } else {
                      // 如果没有content-length，获取blob大小
                      const blob = await response.clone().blob();
                      size = blob.size;
                    }
                  }
                } catch (error) {
                  console.warn(`[SW] 统计时无法获取文件大小: ${request.url}`, error);
                  size = 0;
                }
              }

              const host = new URL(request.url).hostname;

              totalSize += size;
              fileCount++;

              if (!hostStats[host]) {
                hostStats[host] = { count: 0, size: 0 };
              }
              hostStats[host].count++;
              hostStats[host].size += size;
            }
          }

          return {
            cacheName,
            totalSize,
            fileCount,
            hostStats
          };
        })
    );

    console.log(`[SW] 缓存统计完成:`, stats);

    event.source.postMessage({
      type: 'cache_stats',
      stats: stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    event.source.postMessage({
      type: 'cache_error',
      error: error.message
    });
  }
}

// 处理外部资产请求（专用于assets.vocarchive.com）
async function handleAssetRequest(request, url) {
  console.log(`[SW] 处理外部资产请求: ${url.href}`);

  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log(`[SW] 从缓存返回: ${url.href}`);
    return cachedResponse;
  }

  try {
    console.log(`[SW] 网络请求外部资产: ${url.href}`);

    const networkResponse = await fetch(request, {
      method: 'GET',
      mode: 'no-cors',
      credentials: 'omit'
    });

    console.log(`[SW] 外部资产响应类型: ${networkResponse.type}, 状态: ${networkResponse.status}`);

    if (networkResponse.type === 'opaque' || networkResponse.ok) {
      // 对于opaque响应，通过流式读取计算实际大小
      if (networkResponse.type === 'opaque') {
        console.log(`[SW] 准备缓存opaque响应: ${url.href}`);

        let actualSize = 0;
        let contentType = null;

        try {
          // 创建一个可读流来计算实际下载的字节数
          const responseClone = networkResponse.clone();
          const reader = responseClone.body?.getReader();

          if (reader) {
            const chunks = [];

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              if (value) {
                chunks.push(value);
                actualSize += value.length;
              }
            }

            console.log(`[SW] 通过流式计算获得实际大小: ${url.href} = ${actualSize} bytes`);

            // 重新构建响应并合并所有chunks
            let offset = 0;
            const buffer = new Uint8Array(actualSize);
            for (const chunk of chunks) {
              buffer.set(chunk, offset);
              offset += chunk.length;
            }

            const rebuiltResponse = new Response(buffer, {
              status: 200,
              statusText: 'OK',
              headers: {
                'Content-Type': contentType || 'application/octet-stream',
                'x-actual-size': actualSize.toString(),
                'x-cached-at': Date.now().toString()
              }
            });

            await cache.put(request, rebuiltResponse.clone());
            console.log(`[SW] ✅ opaque响应已缓存（实际大小: ${actualSize} bytes）: ${url.href}`);

            // 存储准确的元数据
            await storeFileMetadata(url.href, actualSize, contentType);

            // 返回原始响应给用户
            return networkResponse;
          }
        } catch (streamError) {
          console.error(`[SW] 流式计算失败: ${streamError.message}`);
          // 降级到原来的处理方式
          await cache.put(request, networkResponse.clone());
          await storeFileMetadata(url.href, -1, contentType);
        }
      } else {
        // 对于普通响应的处理保持不变
        const responseToCache = networkResponse.clone();
        const headers = new Headers(responseToCache.headers);
        headers.set('x-cached-at', Date.now().toString());

        // 获取文件大小和类型
        let fileSize = 0;
        const contentType = headers.get('content-type');
        const contentLength = headers.get('content-length');

        if (contentLength) {
          fileSize = Number(contentLength);
        } else {
          try {
            const blob = await responseToCache.clone().blob();
            fileSize = blob.size;
          } catch (blobError) {
            console.warn(`[SW] 无法获取普通响应blob大小: ${blobError.message}`);
          }
        }

        const cachedResponse = new Response(await responseToCache.clone().blob(), {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        });

        await cache.put(request, cachedResponse);
        console.log(`[SW] ✅ 普通响应已缓存: ${url.href} (${fileSize} bytes)`);

        // 存储元数据
        await storeFileMetadata(url.href, fileSize, contentType);
      }
    } else {
      console.log(`[SW] 响应不符合缓存条件: ${url.href} (类型: ${networkResponse.type}, 状态: ${networkResponse.status})`);
    }

    return networkResponse;
  } catch (error) {
    console.error(`[SW] 外部资产请求失败: ${error.message}`);

    // 如果网络失败，尝试返回缓存版本
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response('Asset Load Failed', { status: 503 });
  }
}

// 获取Service Worker配置状态
function handleGetSWConfig(event) {
  try {
    const config = {
      version: SW_VERSION,
      externalHosts: self.EXTERNAL_HOSTS || [],
      externalHostsCount: (self.EXTERNAL_HOSTS || []).length,
      hasCacheConfig: !!self.CACHE_CONFIG,
      assetExtensions: self.ASSET_EXTENSIONS || [],
      assetExtensionsCount: (self.ASSET_EXTENSIONS || []).length
    };

    console.log('[SW] 配置查询请求，当前配置:', config);

    event.source.postMessage({
      type: 'sw_config_response',
      config: config
    });
  } catch (error) {
    console.error('[SW] 获取配置状态失败:', error);
    event.source.postMessage({
      type: 'sw_config_error',
      error: error.message
    });
  }
}

// 安装事件
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  // 强制激活新的 Service Worker
  self.skipWaiting();
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');

  event.waitUntil(
    Promise.all([
      // 清理旧版本缓存
      cleanupOldCaches(),
      // 立即控制所有客户端
      self.clients.claim()
    ])
  );
});

// 清理旧版本缓存
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [CACHE_NAME, REDIRECT_CACHE_NAME];

  return Promise.all(
    cacheNames.map(cacheName => {
      if (!currentCaches.includes(cacheName)) {
        console.log('Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      }
    })
  );
}

// 主要的网络请求拦截
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 只处理 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 强制拦截所有assets.vocarchive.com的请求（用于调试）
  if (url.hostname === 'assets.vocarchive.com') {
    console.log(`[SW] 🔥 强制拦截 assets.vocarchive.com 请求: ${url.href}`);
    event.respondWith(handleAssetRequest(request, url));
    return;
  }

  // 添加调试日志 - 为所有请求记录
  const shouldCache = shouldCacheRequest(url);
  const isExternal = isExternalStorageHost(url.hostname);
  const hasAsset = hasAssetExtension(url.pathname);

  // 记录所有外部域名请求（不限制hostname）
  if (isExternal || url.hostname === 'assets.vocarchive.com' || shouldCache) {
    console.log(`[SW] 请求检查: ${url.href}`, {
      hostname: url.hostname,
      pathname: url.pathname,
      isExternal: isExternal,
      hasAsset: hasAsset,
      shouldCache: shouldCache,
      externalHosts: self.EXTERNAL_HOSTS || [],
      method: request.method,
      willIntercept: shouldCache || isExternal || hasAsset
    });
  }

  // 决定是否拦截请求
  const shouldIntercept = shouldCache || (isExternal && hasAsset);

  if (shouldIntercept) {
    console.log(`[SW] ✅ 拦截并处理请求: ${url.href}`);
    event.respondWith(handleCachedRequest(request, url));
  }
});

// 判断是否应该缓存请求
function shouldCacheRequest(url) {
  // 1. /api/get/file/* 重定向请求
  if (url.pathname.startsWith('/api/get/file/')) {
    return true;
  }

  // 2. 外部存储资源
  if (isExternalStorageHost(url.hostname)) {
    return hasAssetExtension(url.pathname);
  }

  // 3. 静态资源
  if (url.pathname.startsWith('/css/') ||
      url.pathname.startsWith('/js/') ||
      hasAssetExtension(url.pathname)) {
    return true;
  }

  return false;
}

// 检查是否为外部存储主机
function isExternalStorageHost(hostname) {
  const externalHosts = self.EXTERNAL_HOSTS || [];
  const result = externalHosts.includes(hostname);

  // 添加调试日志
  if (hostname.includes('assets.vocarchive.com') || hostname.includes('vocarchive')) {
    console.log(`[SW] 检查外部存储主机: ${hostname}`, {
      externalHosts: externalHosts,
      result: result,
      hostname: hostname
    });
  }

  return result;
}

// 检查是否为资源文件扩展名
function hasAssetExtension(pathname) {
  const assetExtensions = self.ASSET_EXTENSIONS || ['.mp3', '.flac', '.mp4', '.wav', '.m4a', '.ogg', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
  const result = assetExtensions.some(ext => pathname.toLowerCase().endsWith(ext));

  // 添加调试日志
  if (pathname.toLowerCase().includes('webp') || pathname.toLowerCase().includes('jpg') || pathname.toLowerCase().includes('png')) {
    console.log(`[SW] 检查文件扩展名: ${pathname}`, {
      assetExtensions: assetExtensions,
      result: result,
      pathname: pathname
    });
  }

  return result;
}

// 获取文件类型
function getFileType(url) {
  const path = new URL(url).pathname.toLowerCase();

  if (['.mp3', '.flac', '.wav', '.m4a', '.ogg'].some(ext => path.endsWith(ext))) {
    return 'audio';
  }
  if (['.mp4', '.webm', '.mov'].some(ext => path.endsWith(ext))) {
    return 'video';
  }
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].some(ext => path.endsWith(ext))) {
    return 'image';
  }
  if (['.css', '.js'].some(ext => path.endsWith(ext))) {
    return 'static';
  }
  return 'other';
}

// 处理缓存请求
async function handleCachedRequest(request, url) {
  const fileType = getFileType(url.href);

  // API 文件重定向使用特殊处理
  if (url.pathname.startsWith('/api/get/file/')) {
    return handleFileRedirectRequest(request);
  }

  // 媒体文件使用缓存优先策略
  if (fileType === 'audio' || fileType === 'video') {
    return cacheFirstStrategy(request);
  }

  // 图片使用缓存优先策略
  if (fileType === 'image') {
    return cacheFirstStrategy(request);
  }

  // 静态资源使用 stale-while-revalidate
  if (fileType === 'static') {
    return staleWhileRevalidateStrategy(request);
  }

  // 其他使用网络优先
  return networkFirstStrategy(request);
}

// 处理文件重定向请求
async function handleFileRedirectRequest(request) {
  try {
    console.log(`[SW] 处理文件重定向: ${request.url}`);

    // 首先检查重定向缓存
    const redirectCache = await caches.open(REDIRECT_CACHE_NAME);
    const cachedRedirect = await redirectCache.match(request);

    if (cachedRedirect && !isExpired(cachedRedirect, 60 * 60 * 1000)) { // 1小时过期
      const redirectUrl = cachedRedirect.headers.get('x-redirect-url');
      if (redirectUrl) {
        console.log(`[SW] 使用缓存的重定向: ${redirectUrl}`);
        // 直接从主缓存获取文件
        return cacheFirstStrategy(new Request(redirectUrl));
      }
    }

    // 获取重定向
    const response = await fetch(request);
    console.log(`[SW] 重定向响应: ${response.status}`);

    if (response.status === 302) {
      const redirectUrl = response.headers.get('location');
      if (redirectUrl) {
        console.log(`[SW] 重定向到: ${redirectUrl}`);

        // 缓存重定向信息
        const redirectResponse = new Response('', {
          status: 200,
          headers: {
            'x-redirect-url': redirectUrl,
            'x-cached-at': Date.now().toString()
          }
        });
        await redirectCache.put(request, redirectResponse);

        // 获取实际文件
        return cacheFirstStrategy(new Request(redirectUrl));
      }
    }

    // 如果不是302或没有location，直接返回原始响应
    return response;
  } catch (error) {
    console.error('[SW] 文件重定向处理失败:', error);

    // 不要返回503，而是尝试直接fetch原始请求
    try {
      return fetch(request);
    } catch (fetchError) {
      console.error('[SW] 原始请求也失败:', fetchError);
      return new Response('Service Worker Error', { status: 503 });
    }
  }
}

// 缓存优先策略
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // 检查是否过期（媒体文件7天，其他1天）
    const maxAge = getFileType(request.url) === 'audio' || getFileType(request.url) === 'video'
      ? 7 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

    if (!isExpired(cachedResponse, maxAge)) {
      return cachedResponse;
    }
  }

  try {
    // 对跨域请求使用正确的模式
    const url = new URL(request.url);
    const fetchOptions = {
      method: request.method,
      headers: request.headers,
      mode: isExternalStorageHost(url.hostname) ? 'no-cors' : 'same-origin', // 改为no-cors
      credentials: 'omit'
    };

    console.log(`[SW] 缓存优先策略处理: ${request.url}`, {
      hostname: url.hostname,
      isExternal: isExternalStorageHost(url.hostname),
      mode: fetchOptions.mode
    });

    const networkResponse = await fetch(request.url, fetchOptions);

    // no-cors模式返回opaque响应，无法检查status
    const isExternalRequest = isExternalStorageHost(url.hostname);
    const shouldCache = networkResponse && (
      networkResponse.status === 200 ||
      (isExternalRequest && networkResponse.type === 'opaque')
    );

    if (shouldCache) {
      // 克隆响应用于缓存
      const responseToCache = networkResponse.clone();

      // 添加缓存时间戳
      const headers = new Headers(responseToCache.headers);
      headers.set('x-cached-at', Date.now().toString());

      const cachedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });

      await cache.put(request, cachedResponse);
      console.log(`[SW] 已缓存: ${request.url} (类型: ${networkResponse.type})`);
    } else {
      console.log(`[SW] 未缓存: ${request.url} (状态: ${networkResponse.status}, 类型: ${networkResponse.type})`);
    }

    return networkResponse;
  } catch (error) {
    console.error('Network request failed:', error);

    // 如果网络失败，返回缓存版本（即使过期）
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response('Network Error', { status: 503 });
  }
}

// 网络优先策略
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      const responseToCache = networkResponse.clone();

      // 添加缓存时间戳
      const headers = new Headers(responseToCache.headers);
      headers.set('x-cached-at', Date.now().toString());

      const cachedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });

      await cache.put(request, cachedResponse);
    }

    return networkResponse;
  } catch (error) {
    console.error('Network request failed, trying cache:', error);

    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response('Network Error', { status: 503 });
  }
}

// Stale-while-revalidate 策略
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // 异步更新缓存
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();

      // 添加缓存时间戳
      const headers = new Headers(responseToCache.headers);
      headers.set('x-cached-at', Date.now().toString());

      return responseToCache.blob().then(blob => {
        const cachedResponse = new Response(blob, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        });

        return cache.put(request, cachedResponse);
      });
    }
  }).catch(error => {
    console.error('Background fetch failed:', error);
  });

  // 立即返回缓存版本（如果有）
  return cachedResponse || fetchPromise.then(() => cache.match(request));
}

// 检查响应是否过期
function isExpired(response, maxAge) {
  const cachedAt = response.headers.get('x-cached-at');
  if (!cachedAt) {
    return true; // 没有缓存时间戳，认为过期
  }

  const age = Date.now() - parseInt(cachedAt);
  return age > maxAge;
}

// 缓存大小管理
async function manageCacheSize() {
  const maxSize = self.CACHE_CONFIG?.maxCacheSize || 500 * 1024 * 1024; // 500MB

  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();

    let totalSize = 0;
    const cacheItems = [];

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        let size = 0;
        let cachedAt = 0;

        // 获取文件大小（处理opaque响应）
        try {
          if (response.type === 'opaque') {
            // 对于opaque响应，获取blob大小
            const blob = await response.clone().blob();
            size = blob.size;
            // opaque响应无法访问headers，使用当前时间作为缓存时间
            cachedAt = Date.now();
          } else {
            // 对于普通响应，尝试从headers获取
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              size = Number(contentLength);
            } else {
              // 如果没有content-length，获取blob大小
              const blob = await response.clone().blob();
              size = blob.size;
            }
            // 获取缓存时间戳
            cachedAt = Number(response.headers.get('x-cached-at') || Date.now());
          }
        } catch (error) {
          console.warn(`[SW] 缓存管理时无法获取文件大小: ${request.url}`, error);
          size = 0;
          cachedAt = Date.now();
        }

        totalSize += size;
        cacheItems.push({
          request,
          size,
          cachedAt,
          lastUsed: cachedAt // 可以扩展为真实的最后使用时间
        });
      }
    }

    console.log(`[SW] 缓存大小检查: ${totalSize} bytes (最大: ${maxSize} bytes)`);

    if (totalSize > maxSize) {
      // 按最后使用时间排序，删除最旧的项目
      cacheItems.sort((a, b) => a.lastUsed - b.lastUsed);

      let deletedSize = 0;
      const targetDeleteSize = totalSize - maxSize * 0.8; // 删除到80%容量

      for (const item of cacheItems) {
        if (deletedSize >= targetDeleteSize) break;

        await cache.delete(item.request);
        deletedSize += item.size;
        console.log(`Deleted cache item: ${item.request.url} (${item.size} bytes)`);
      }

      console.log(`Cache cleanup completed. Deleted ${deletedSize} bytes.`);
    }
  } catch (error) {
    console.error('Error managing cache size:', error);
  }
}

console.log('VOCArchive Service Worker v2 loaded with external storage support');

// 明确显示版本和配置状态
console.log(`🚀 Service Worker ${SW_VERSION} 完全加载！外部主机: ${(self.EXTERNAL_HOSTS || []).join(', ')}`);
console.log(`📋 资产扩展名支持: ${(self.ASSET_EXTENSIONS || []).length} 种类型`);