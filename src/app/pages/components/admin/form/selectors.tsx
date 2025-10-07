// 管理后台选择器组件 - SSR 渲染
// 替代原有的客户端 HTML 字符串生成

import { jsx } from 'hono/jsx'

/**
 * UUID 快速选择器
 * 用于快速选择对象并填充到目标输入框
 */
export interface UuidSelectorProps {
  type: string
  data: Array<{ uuid: string; name: string; [key: string]: any }>
  selectedValue?: string
  targetInputId: string
  label: string
}

export const UuidSelector = ({ type, data, selectedValue, targetInputId, label }: UuidSelectorProps) => {
  if (!data || data.length === 0) return null

  return (
    <div class="quick-select-container">
      <span class="quick-select-hint">{label}</span>
      <div class="md3-select-field quick-select-field">
        <select
          id={`${type}-quick-select`}
          class="quick-select"
          data-target-input={targetInputId}
        >
          <option value="">选择...</option>
          {data.map(item => (
            <option value={item.uuid} selected={item.uuid === selectedValue ? true : undefined}>
              {item.name}
            </option>
          ))}
        </select>
        <div class="md3-state-layer"></div>
      </div>
    </div>
  )
}

/**
 * 多选选择器
 * 用于标签、分类、外部对象等多选场景
 */
export interface MultiSelectorProps {
  type: string
  data: Array<{ uuid: string; name: string; [key: string]: any }>
  selectedItems: Array<{ uuid: string; [key: string]: any }>
  label: string
  placeholder: string
}

export const MultiSelector = ({ type, data, selectedItems, label, placeholder }: MultiSelectorProps) => {
  if (!data || data.length === 0) {
    return <p>暂无可用{label}</p>
  }

  const selectedIds = selectedItems.map(item => item.uuid)

  return (
    <div class={`${type}-selector`}>
      <input
        type="text"
        class="filter-input"
        placeholder={placeholder}
        oninput={`filterCheckboxes(this, '.${type}-item')`}
      />
      <div class={`${type}-list`}>
        {data.map(item => (
          <label class={`${type}-item`} data-name={item.name.toLowerCase()}>
            <input
              type="checkbox"
              name={`selected_${type}`}
              value={item.uuid}
              checked={selectedIds.includes(item.uuid) ? true : undefined}
            />
            <span class={selectedIds.includes(item.uuid) ? `${type}-chip selected` : `${type}-chip`}>
              {item.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

/**
 * 分层多选选择器（用于分类等有父子关系的数据）
 */
export interface HierarchicalMultiSelectorProps {
  type: string
  data: Array<{ uuid: string; name: string; children?: any[]; [key: string]: any }>
  selectedItems: Array<{ uuid: string; [key: string]: any }>
  label: string
  placeholder: string
}

export const HierarchicalMultiSelector = ({ type, data, selectedItems, label, placeholder }: HierarchicalMultiSelectorProps) => {
  if (!data || data.length === 0) {
    return <p>暂无可用{label}</p>
  }

  const selectedIds = selectedItems.map(item => item.uuid)

  // 递归渲染分层项
  const renderHierarchicalItems = (items: any[], level: number = 0): any => {
    return items.map(item => {
      const indent = '\u3000'.repeat(level) // 全角空格缩进
      const hasChildren = item.children && item.children.length > 0

      return (
        <>
          <label class={`${type}-item indent-level-${Math.min(level, 10)}`} data-name={item.name.toLowerCase()}>
            <input
              type="checkbox"
              name={`selected_${type}`}
              value={item.uuid}
              checked={selectedIds.includes(item.uuid) ? true : undefined}
            />
            <span class={selectedIds.includes(item.uuid) ? `${type}-chip selected` : `${type}-chip`}>
              {indent}{item.name}
            </span>
          </label>
          {hasChildren && renderHierarchicalItems(item.children, level + 1)}
        </>
      )
    })
  }

  return (
    <div class={`${type}-selector`}>
      <input
        type="text"
        class="filter-input"
        placeholder={placeholder}
        oninput={`filterCheckboxes(this, '.${type}-item')`}
      />
      <div class={`${type}-list`}>
        {renderHierarchicalItems(data)}
      </div>
    </div>
  )
}
