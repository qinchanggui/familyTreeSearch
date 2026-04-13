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

// 世代颜色（全局统一）
export const GENERATION_COLORS = [
  '#8B2500', '#993820', '#8C3020', '#A84830', '#8B3A25',
  '#9B4830', '#8A3528', '#A85540', '#944535', '#B06848',
  '#8C4838', '#9A5848', '#884535', '#A86050', '#955040',
  '#B07858', '#A06848', '#986050', '#8C5040', '#B88868',
  '#A88070',
] as const;

