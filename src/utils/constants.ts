// 动画和延时相关常量
export const ANIMATION_DELAYS = {
  SCROLL_TO_MATCH: 100, // 滚动到匹配项的延时
  HIGHLIGHT_DURATION: 2000, // 高亮显示持续时间
  SEARCH_DEBOUNCE: 300, // 搜索防抖延时
} as const;

// UI相关常量
export const UI_CONFIG = {
  SEARCH_INPUT_WIDTH: 'w-full sm:w-64',
  FILTER_PANEL_WIDTH: 'w-72 sm:w-80',
  MAX_SEARCH_RESULTS_DISPLAY: 50, // 最多显示的搜索结果数量
} as const;

