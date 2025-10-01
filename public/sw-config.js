// Service Worker 静态配置
const EXTERNAL_HOSTS = ['assets.vocarchive.com'];
const ASSET_HOSTS = EXTERNAL_HOSTS; // 兼容性别名
const ASSET_HOST = EXTERNAL_HOSTS[0] || 'assets.vocarchive.com'; // 兼容性支持

// 代理配置 - 用于解决 CORS 问题
const PROXY_CONFIG = {
  enabled: true,
  proxyPath: '/proxy/assets/',
  // 需要代理的外部主机
  externalHosts: EXTERNAL_HOSTS
};

// 缓存配置
const CACHE_CONFIG = {
  version: 'v2',
  cacheName: 'vocarchive-cache-v2',
  // 媒体文件缓存时间：7天
  mediaMaxAge: 7 * 24 * 60 * 60 * 1000,
  // API 缓存时间：1小时
  apiMaxAge: 60 * 60 * 1000,
  // 最大缓存大小：500MB
  maxCacheSize: 500 * 1024 * 1024
};

// 支持的文件类型
const CACHEABLE_EXTENSIONS = ['.mp3', '.flac', '.mp4', '.wav', '.m4a', '.ogg'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const ASSET_EXTENSIONS = [...CACHEABLE_EXTENSIONS, ...IMAGE_EXTENSIONS];

// 导出配置供 Service Worker 使用
if (typeof self !== 'undefined') {
  self.EXTERNAL_HOSTS = EXTERNAL_HOSTS;
  self.ASSET_HOSTS = ASSET_HOSTS;
  self.ASSET_HOST = ASSET_HOST;
  self.PROXY_CONFIG = PROXY_CONFIG;
  self.CACHE_CONFIG = CACHE_CONFIG;
  self.CACHEABLE_EXTENSIONS = CACHEABLE_EXTENSIONS;
  self.IMAGE_EXTENSIONS = IMAGE_EXTENSIONS;
  self.ASSET_EXTENSIONS = ASSET_EXTENSIONS;
}

// 调试信息
console.log('SW Config loaded (static):', {
  externalHosts: EXTERNAL_HOSTS,
  proxyConfig: PROXY_CONFIG,
  cacheConfig: CACHE_CONFIG
});