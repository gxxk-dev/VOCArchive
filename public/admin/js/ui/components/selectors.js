/**
 * 选择器事件处理模块 - 极简版
 * 所有 HTML 生成已移至 SSR (src/app/pages/components/admin/form/selectors.tsx)
 * 此文件只保留客户端事件处理和过滤功能
 */

// ==============================
// 事件处理
// ==============================

/**
 * 快速选择器变化事件处理
 * 当用户在快速选择器中选择项目时，自动填充到目标输入框
 */
document.addEventListener('change', (e) => {
  if (e.target.classList.contains('quick-select')) {
    const selectedValue = e.target.value;
    const targetInputId = e.target.dataset.targetInput;
    const targetInput = document.getElementById(targetInputId);

    if (targetInput && selectedValue) {
      targetInput.value = selectedValue;

      // 触发自定义事件
      const customEvent = new CustomEvent('quick-select:change', {
        detail: { selectedValue, targetInputId }
      });
      document.dispatchEvent(customEvent);
    }
  }
});

/**
 * 过滤复选框函数（已在 editor-client.js 中定义）
 * 这里提供一个全局别名以保持向后兼容
 */
window.filterCheckboxes = window.filterCheckboxes || function(input, itemSelector) {
  const searchTerm = input.value.toLowerCase();
  const items = document.querySelectorAll(itemSelector);

  items.forEach(item => {
    const name = (item.dataset.name || '').toLowerCase();
    item.style.display = name.includes(searchTerm) ? '' : 'none';
  });
};

/**
 * 向后兼容的过滤函数别名
 */
window.filterTags = function(searchTerm) {
  const input = document.querySelector('.tags-selector input[type="text"]');
  if (input) {
    input.value = searchTerm;
    window.filterCheckboxes(input, '.tags-item');
  }
};

window.filterCategories = function(searchTerm) {
  const input = document.querySelector('.categories-selector input[type="text"]');
  if (input) {
    input.value = searchTerm;
    window.filterCheckboxes(input, '.categories-item');
  }
};

window.filterExternalObjects = function(searchTerm) {
  const input = document.querySelector('.external-objects-filter');
  if (input) {
    input.value = searchTerm;
    window.filterCheckboxes(input, '.external-object-item');
  }
};

// ==============================
// 工具函数
// ==============================

/**
 * 获取已选中的复选框值
 * @param {string} name - 复选框的 name 属性
 * @returns {Array} 选中的值数组
 */
export function getSelectedCheckboxValues(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * 设置复选框选中状态
 * @param {string} name - 复选框的 name 属性
 * @param {Array} values - 要选中的值数组
 */
export function setCheckboxValues(name, values) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]`);
  checkboxes.forEach(cb => {
    cb.checked = values.includes(cb.value);
  });
}

// ==============================
// 初始化
// ==============================

console.log('Selectors event handlers loaded (SSR mode)');
