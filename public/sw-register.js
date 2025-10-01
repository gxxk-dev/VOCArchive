// Service Worker 注册和管理脚本

(function() {
  'use strict';

  // 检查 Service Worker 支持
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker 不被支持');
    return;
  }

  // Service Worker 状态管理
  let swRegistration = null;
  let swUpdateAvailable = false;

  // 注册 Service Worker
  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      swRegistration = registration;
      console.log('Service Worker 注册成功:', registration);

      // 监听更新
      registration.addEventListener('updatefound', () => {
        console.log('Service Worker 更新发现');
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log('Service Worker 状态变化:', newWorker.state);

            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 有新版本可用
              swUpdateAvailable = true;
              showUpdateNotification();
            }
          });
        }
      });

      // 监听控制器变化
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker 控制器变化');
        // 页面已被新的 Service Worker 控制
        if (swUpdateAvailable) {
          window.location.reload();
        }
      });

      // 设置消息监听器
      setupMessageListener();

      // 定期检查缓存大小
      startCacheManagement();

    } catch (error) {
      console.error('Service Worker 注册失败:', error);
    }
  }

  // 显示更新通知
  function showUpdateNotification() {
    // 创建更新提示
    const notification = document.createElement('div');
    notification.className = 'sw-update-notification';
    notification.innerHTML = `
      <div class="sw-update-content">
        <span class="sw-update-text">有新版本可用</span>
        <button class="sw-update-btn" onclick="updateServiceWorker()">更新</button>
        <button class="sw-update-dismiss" onclick="dismissUpdateNotification()">稍后</button>
      </div>
    `;

    // 添加样式
    if (!document.getElementById('sw-update-styles')) {
      const styles = document.createElement('style');
      styles.id = 'sw-update-styles';
      styles.textContent = `
        .sw-update-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #2196F3;
          color: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          font-family: sans-serif;
          max-width: 300px;
        }
        .sw-update-content {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sw-update-text {
          flex: 1;
          margin-right: 8px;
        }
        .sw-update-btn, .sw-update-dismiss {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .sw-update-btn:hover, .sw-update-dismiss:hover {
          background: rgba(255,255,255,0.3);
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // 全局函数定义
    window.updateServiceWorker = function() {
      if (swRegistration && swRegistration.waiting) {
        swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        dismissUpdateNotification();
      }
    };

    window.dismissUpdateNotification = function() {
      if (notification && notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    };
  }

  // 设置消息监听器
  function setupMessageListener() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload, error } = event.data;

      switch (type) {
        case 'cache_list':
          handleCacheList(payload);
          break;
        case 'cache_cleared':
          console.log('缓存已清理');
          if (window.onCacheCleared) {
            window.onCacheCleared();
          }
          break;
        case 'cache_stats':
          handleCacheStats(payload);
          break;
        case 'cache_error':
          console.error('缓存操作错误:', error);
          break;
      }
    });
  }

  // 处理缓存列表
  function handleCacheList(cacheItems) {
    window.swCacheItems = cacheItems;
    if (window.onCacheListReceived) {
      window.onCacheListReceived(cacheItems);
    }
  }

  // 处理缓存统计
  function handleCacheStats(stats) {
    window.swCacheStats = stats;
    if (window.onCacheStatsReceived) {
      window.onCacheStatsReceived(stats);
    }
  }

  // 缓存管理
  function startCacheManagement() {
    // 每30分钟检查一次缓存大小
    setInterval(() => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'check_cache_size'
        });
      }
    }, 30 * 60 * 1000);

    // 页面加载时检查一次
    setTimeout(() => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'check_cache_size'
        });
      }
    }, 2000);
  }

  // Service Worker API 函数
  window.swAPI = {
    // 获取缓存列表
    getCacheList: function() {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'list_cache'
        });
      }
    },

    // 清理所有缓存
    clearCache: function() {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'clear_cache'
        });
      }
    },

    // 删除特定缓存项
    deleteCacheItem: function(url) {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'delete_cache_item',
          url: url
        });
      }
    },

    // 获取缓存统计
    getCacheStats: function() {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'get_cache_stats'
        });
      }
    },

    // 检查是否有更新
    checkForUpdate: function() {
      if (swRegistration) {
        return swRegistration.update();
      }
    },

    // 获取注册状态
    getRegistration: function() {
      return swRegistration;
    },

    // 是否有更新可用
    isUpdateAvailable: function() {
      return swUpdateAvailable;
    }
  };

  // 页面加载完成后注册 Service Worker
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerServiceWorker);
  } else {
    registerServiceWorker();
  }

  // 页面可见性变化时检查更新
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && swRegistration) {
      swRegistration.update();
    }
  });

  console.log('Service Worker 注册脚本已加载');
})();