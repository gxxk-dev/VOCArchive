// 管理后台编辑器客户端逻辑
// 极简实现 - 零 HTML 字符串生成

// 通用的从 template 添加行的函数
function addRowFromTemplate(templateId, containerId) {
  const template = document.getElementById(templateId);
  const container = document.getElementById(containerId);

  if (!template || !container) {
    console.error('Template or container not found:', { templateId, containerId });
    return;
  }

  // 使用浏览器原生 API 克隆模板
  const clone = template.content.cloneNode(true);
  container.appendChild(clone);
}

// 过滤复选框函数（用于选择器过滤）
function filterCheckboxes(input, itemSelector) {
  const searchTerm = input.value.toLowerCase();
  const items = document.querySelectorAll(itemSelector);

  items.forEach(item => {
    const name = (item.dataset.name || '').toLowerCase();
    item.style.display = name.includes(searchTerm) ? '' : 'none';
  });
}

// FormData 转 JSON
function formDataToJSON(formData) {
  const data = {};

  for (let [key, value] of formData.entries()) {
    // 处理数组字段（如 title_text[]）
    if (key.endsWith('[]')) {
      const cleanKey = key.slice(0, -2);
      if (!data[cleanKey]) data[cleanKey] = [];
      data[cleanKey].push(value);
    } else {
      data[key] = value;
    }
  }

  return data;
}

// 表单保存处理（发送 JSON）
async function handleFormSave(form, config) {
  const saveButton = document.getElementById('editor-save');
  if (!saveButton) return;

  try {
    // 禁用保存按钮
    saveButton.disabled = true;
    saveButton.textContent = '保存中...';

    const formData = new FormData(form);
    const data = formDataToJSON(formData);

    console.log('Form data before sending:', JSON.stringify(data, null, 2));
    console.log('Config:', config);

    // 确定 API 端点
    const endpoint = config.isNew
      ? `/api/input/${config.type}`
      : `/api/update/${config.type}`;

    console.log('API endpoint:', endpoint);

    // 添加 UUID（用于更新）
    if (!config.isNew) {
      data.uuid = config.uuid;
    }

    // 获取 token（从 URL 参数）
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // 构建请求头
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 发送 API 请求
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    console.log('Save successful:', result);

    // 通知父窗口保存成功
    window.parent.postMessage({
      type: 'editor-save-success',
      data: {
        action: config.isNew ? 'create' : 'update',
        type: config.type,
        uuid: config.uuid || result.uuid,
        result: result
      }
    }, '*');

  } catch (error) {
    console.error('Save failed:', error);
    alert(`保存失败: ${error.message}`);
  } finally {
    // 重置按钮状态
    saveButton.disabled = false;
    saveButton.textContent = '保存';
  }
}

// 表单取消处理
function handleFormCancel(config) {
  // 通知父窗口取消编辑
  window.parent.postMessage({
    type: 'editor-cancel',
    data: {
      type: config.type,
      uuid: config.uuid
    }
  }, '*');
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 读取配置
  const configElement = document.getElementById('editor-config');
  if (!configElement) {
    console.error('Editor config not found');
    return;
  }

  const config = JSON.parse(configElement.textContent);

  // 初始化主题
  try {
    const { initializeTheme } = await import('./ui/theme.js');
    initializeTheme();
  } catch (error) {
    console.error('Failed to initialize theme:', error);
  }

  // 设置保存和取消按钮的事件处理
  const form = document.getElementById('editor-form');
  const saveButton = document.getElementById('editor-save');
  const cancelButton = document.getElementById('editor-cancel');

  if (saveButton && form) {
    saveButton.addEventListener('click', async (e) => {
      e.preventDefault();
      await handleFormSave(form, config);
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener('click', (e) => {
      e.preventDefault();
      handleFormCancel(config);
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleFormSave(form, config);
    });
  }

  // 监听父窗口消息（主题切换）
  window.addEventListener('message', (event) => {
    if (event.data.type === 'theme-change') {
      document.documentElement.setAttribute('data-theme', event.data.theme);
    }
  });

  // 通知父窗口 iframe 就绪
  window.parent.postMessage({
    type: 'editor-iframe-ready',
    data: { type: config.type, uuid: config.uuid }
  }, '*');

  console.log('Editor iframe loaded, config:', config);
});

// 暴露给全局（用于 onclick 属性）
window.addRowFromTemplate = addRowFromTemplate;
window.filterCheckboxes = filterCheckboxes;
