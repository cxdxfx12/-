import type { ChartType, PageSize } from '../types';

/** 页面尺寸对应的画布尺寸（px） */
export const PAGE_SIZE_DIMENSIONS: Record<PageSize, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  'A4': { width: 1190, height: 1684 },
  'custom': { width: 1920, height: 1080 },
};

/** 图表名称映射 */
export const CHART_NAMES: Record<ChartType, string> = {
  line: '折线图',
  bar: '柱状图',
  stackedBar: '堆叠柱状图',
  horizontalBar: '条形图',
  pie: '饼图',
  doughnut: '环形图',
  scatter: '散点图',
  area: '面积图',
  stackedArea: '堆叠面积图',
  radar: '雷达图',
  gauge: '仪表盘',
  funnel: '漏斗图',
  treemap: '树状图',
  heatmap: '热力图',
  waterfall: '瀑布图',
};

/** 图表默认尺寸 */
export const CHART_DEFAULT_SIZES: Record<ChartType, { w: number; h: number }> = {
  line: { w: 800, h: 450 },
  bar: { w: 800, h: 450 },
  stackedBar: { w: 800, h: 450 },
  horizontalBar: { w: 800, h: 450 },
  pie: { w: 500, h: 450 },
  doughnut: { w: 500, h: 450 },
  scatter: { w: 600, h: 450 },
  area: { w: 800, h: 450 },
  stackedArea: { w: 800, h: 450 },
  radar: { w: 500, h: 450 },
  gauge: { w: 400, h: 400 },
  funnel: { w: 500, h: 450 },
  treemap: { w: 600, h: 450 },
  heatmap: { w: 700, h: 450 },
  waterfall: { w: 700, h: 450 },
};

/** 默认颜色色板 */
export const DEFAULT_COLOR_PALETTE = [
  '#1890ff', '#52c41a', '#faad14', '#722ed1',
  '#eb2f96', '#13c2c2', '#fa8c16', '#2f54eb',
];

/** 图表类型字段分组 */
export type ChartFieldGroup = 'A' | 'B' | 'C' | 'D' | 'E';

interface FieldConfig {
  xLabel: string;
  yLabel: string;
  xPlaceholder: string;
  yPlaceholder: string;
}

/** 图表类型字段配置 */
export const CHART_FIELD_CONFIG: Partial<Record<ChartType, FieldConfig>> = {
  line: { xLabel: 'X轴 (分类)', yLabel: 'Y轴 (数值)', xPlaceholder: '选择分类字段', yPlaceholder: '选择数值字段' },
  bar: { xLabel: 'X轴 (分类)', yLabel: 'Y轴 (数值)', xPlaceholder: '选择分类字段', yPlaceholder: '选择数值字段' },
  stackedBar: { xLabel: 'X轴 (分类)', yLabel: 'Y轴 (数值)', xPlaceholder: '选择分类字段', yPlaceholder: '选择数值字段' },
  horizontalBar: { xLabel: 'X轴 (分类)', yLabel: 'Y轴 (数值)', xPlaceholder: '选择分类字段', yPlaceholder: '选择数值字段' },
  area: { xLabel: 'X轴 (分类)', yLabel: 'Y轴 (数值)', xPlaceholder: '选择分类字段', yPlaceholder: '选择数值字段' },
  stackedArea: { xLabel: 'X轴 (分类)', yLabel: 'Y轴 (数值)', xPlaceholder: '选择分类字段', yPlaceholder: '选择数值字段' },
  waterfall: { xLabel: 'X轴 (分类)', yLabel: 'Y轴 (数值)', xPlaceholder: '选择分类字段', yPlaceholder: '选择数值字段' },
  pie: { xLabel: '分类字段', yLabel: '数值字段', xPlaceholder: '选择分类字段', yPlaceholder: '选择数值字段' },
  doughnut: { xLabel: '分类字段', yLabel: '数值字段', xPlaceholder: '选择分类字段', yPlaceholder: '选择数值字段' },
  funnel: { xLabel: '分类字段', yLabel: '数值字段', xPlaceholder: '选择分类字段', yPlaceholder: '选择数值字段' },
  radar: { xLabel: '分类字段', yLabel: '数值字段', xPlaceholder: '选择分类字段', yPlaceholder: '选择数值字段' },
  treemap: { xLabel: '分类字段', yLabel: '数值字段', xPlaceholder: '选择分类字段', yPlaceholder: '选择数值字段' },
  scatter: { xLabel: 'X轴 (数值)', yLabel: 'Y轴 (数值)', xPlaceholder: '选择X轴数值字段', yPlaceholder: '选择Y轴数值字段' },
  gauge: { xLabel: '', yLabel: '数值字段', xPlaceholder: '', yPlaceholder: '选择数值字段' },
  heatmap: { xLabel: 'X轴字段', yLabel: 'Y轴字段', xPlaceholder: '选择X轴字段', yPlaceholder: '选择Y轴字段' },
};

/** 坐标轴图表类型（需要显示坐标轴配卡片） */
export const CHART_WITH_AXES: ChartType[] = [
  'line', 'bar', 'stackedBar', 'horizontalBar', 'area', 'stackedArea',
  'scatter', 'waterfall', 'heatmap',
];

/** 饼图类图表类型（tooltip 用 item trigger） */
export const CHART_WITH_ITEM_TRIGGER: ChartType[] = [
  'pie', 'doughnut', 'gauge', 'funnel',
];

/** 字体选项 */
export const FONT_OPTIONS = [
  // 中文字体
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '苹方', value: 'PingFang SC' },
  { label: '思源黑体', value: 'Noto Sans SC' },
  { label: '黑体', value: 'SimHei' },
  { label: '宋体', value: 'SimSun' },
  { label: '楷体', value: 'KaiTi' },
  { label: '仿宋', value: 'FangSong' },
  { label: '华文细黑', value: 'STHeiti Light' },
  { label: '华文黑体', value: 'STHeiti' },
  { label: '冬青黑体', value: 'Hiragino Sans GB' },
  // 西文无衬线
  { label: 'Segoe UI', value: 'Segoe UI' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Helvetica Neue', value: 'Helvetica Neue' },
  { label: 'Calibri', value: 'Calibri' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Lato', value: 'Lato' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Tahoma', value: 'Tahoma' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS' },
  { label: 'Gill Sans', value: 'Gill Sans' },
  // 西文衬线
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Cambria', value: 'Cambria' },
  { label: 'Garamond', value: 'Garamond' },
  { label: 'Palatino', value: 'Palatino' },
  { label: 'Baskerville', value: 'Baskerville' },
  // 等宽字体
  { label: 'Consolas', value: 'Consolas' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Monaco', value: 'Monaco' },
  { label: 'Source Code Pro', value: 'Source Code Pro' },
  // 展示字体
  { label: 'Impact', value: 'Impact' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS' },
  { label: 'Dancing Script', value: 'Dancing Script' },
  { label: 'Pacifico', value: 'Pacifico' },
];

/** 常用字号预设 */
export const FONT_SIZE_PRESETS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];

/** 图表类型分组选项（用于下拉框） */
export const CHART_TYPE_OPTIONS = [
  {
    label: '基础图表',
    options: [
      { label: '折线图', value: 'line' as ChartType },
      { label: '柱状图', value: 'bar' as ChartType },
      { label: '饼图', value: 'pie' as ChartType },
      { label: '环形图', value: 'doughnut' as ChartType },
    ],
  },
  {
    label: '高级图表',
    options: [
      { label: '堆叠柱状图', value: 'stackedBar' as ChartType },
      { label: '条形图', value: 'horizontalBar' as ChartType },
      { label: '面积图', value: 'area' as ChartType },
      { label: '堆叠面积图', value: 'stackedArea' as ChartType },
      { label: '雷达图', value: 'radar' as ChartType },
      { label: '散点图', value: 'scatter' as ChartType },
    ],
  },
  {
    label: '其他图表',
    options: [
      { label: '仪表盘', value: 'gauge' as ChartType },
      { label: '漏斗图', value: 'funnel' as ChartType },
      { label: '热力图', value: 'heatmap' as ChartType },
      { label: '瀑布图', value: 'waterfall' as ChartType },
      { label: '树状图', value: 'treemap' as ChartType },
    ],
  },
];