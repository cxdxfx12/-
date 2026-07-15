// 组件类型
export type ComponentType = 'chart' | 'text' | 'image' | 'card' | 'table' | 'filter';

// 图表类型
export type ChartType =
  | 'line'
  | 'bar'
  | 'stackedBar'
  | 'horizontalBar'
  | 'pie'
  | 'doughnut'
  | 'scatter'
  | 'area'
  | 'stackedArea'
  | 'radar'
  | 'gauge'
  | 'funnel'
  | 'treemap'
  | 'heatmap'
  | 'waterfall';

// 页面尺寸
export type PageSize = 'A4' | '16:9' | '4:3' | 'custom';

// 基础组件接口
export interface BaseComponent {
  id: string;
  type: ComponentType;
  pageId: string; // 归属页面ID
  x: number;
  y: number;
  width: number;
  height: number;
  style?: ComponentStyle;
}

// 组件样式
export interface ComponentStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
}

// 图表组件
export interface ChartComponent extends BaseComponent {
  type: 'chart';
  chartType: ChartType;
  title: string;
  dataSetId?: string;
  xField?: string;
  yField?: string;
  config: ChartConfig;
}

// 字体配置（复合切片）
export interface FontConfig {
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

// 边框配置
export interface BorderConfig {
  show?: boolean;
  color?: string;
  width?: number;
  radius?: number;
}

// 阴影配置
export interface ShadowConfig {
  show?: boolean;
  color?: string;
  blur?: number;
  spread?: number;
  offsetX?: number;
  offsetY?: number;
}

// 背景配置
export interface BackgroundConfig {
  show?: boolean;
  color?: string;
  transparency?: number; // 0-100
}

// 图例配置
export interface LegendConfig {
  show?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  fontSize?: number;
  color?: string;
}

// 数据标签配置
export interface DataLabelConfig {
  show?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'inside';
  fontSize?: number;
  color?: string;
  formatter?: string;
}

// 坐标轴配置
export interface AxisConfig {
  show?: boolean;
  title?: string;
  fontSize?: number;
  color?: string;
  showTitle?: boolean;
}

// 网格线配置
export interface GridLineConfig {
  show?: boolean;
  color?: string;
  width?: number;
  type?: 'solid' | 'dashed' | 'dotted';
}

// 图表配置
export interface ChartConfig {
  title?: string;
  xAxis?: string;
  yAxis?: string;
  series?: string[];
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;

  // 标题样式
  titleFont?: FontConfig;
  // 背景设置
  background?: BackgroundConfig;
  // 边框设置
  border?: BorderConfig;
  // 阴影设置
  shadow?: ShadowConfig;
  // 图例设置
  legend?: LegendConfig;
  // 数据标签
  dataLabel?: DataLabelConfig;
  // X轴
  xAxisConfig?: AxisConfig;
  // Y轴
  yAxisConfig?: AxisConfig;
  // 网格线
  gridLine?: GridLineConfig;
  // 组件透明度
  transparency?: number; // 0-100
}

// 文本组件
export interface TextComponent extends BaseComponent {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  lineHeight?: number;
  letterSpacing?: number;
  // 背景设置
  background?: BackgroundConfig;
  // 边框设置
  border?: BorderConfig;
  // 阴影设置
  shadow?: ShadowConfig;
  // 透明度
  transparency?: number;
}

// 指标卡组件
export interface CardComponent extends BaseComponent {
  type: 'card';
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  // 标题字体样式
  titleFont?: FontConfig;
  // 数值字体样式
  valueFont?: FontConfig;
  // 背景渐变
  background?: BackgroundConfig & { gradient?: string; gradientEnd?: string };
  // 边框设置
  border?: BorderConfig;
  // 阴影设置
  shadow?: ShadowConfig;
  // 透明度
  transparency?: number;
}

// 图片组件
export interface ImageComponent extends BaseComponent {
  type: 'image';
  src: string;
  alt?: string;
}

// 表格组件
export interface TableComponent extends BaseComponent {
  type: 'table';
  columns: string[];
  data: Record<string, unknown>[];
  dataSetId?: string;
  pagination?: {
    pageSize?: number;
    showSizeChanger?: boolean;
  } | false;
}

// 筛选器组件
export interface FilterComponent extends BaseComponent {
  type: 'filter';
  filterType: 'dropdown' | 'dateRange' | 'slider';
  label: string;
  dataSetId?: string;
  field?: string;
  values?: string[];
  /** 当前筛选值（受控） */
  value?: string | number;
}

// 所有组件类型联合
export type Component = ChartComponent | TextComponent | CardComponent | ImageComponent | TableComponent | FilterComponent;

// 报告页面
export interface ReportPage {
  id: string;
  name: string;
}

// 报告对象
export interface Report {
  id: string;
  title: string;
  pageSize: PageSize;
  customWidth?: number;
  customHeight?: number;
  pages: ReportPage[];
  components: Component[];
  createdAt: string;
  updatedAt: string;
}

// 数据字段类型
export type FieldType = 'number' | 'string' | 'date' | 'percentage' | 'category';

// 数据字段信息
export interface DataField {
  name: string;
  type: FieldType;
  sampleValues?: (string | number)[];
  nullCount?: number;
  uniqueCount?: number;
}

// 数据集
export interface DataSet {
  id: string;
  name: string;
  fields: DataField[];
  data: Record<string, unknown>[];
  rowCount: number;
  source: 'paste' | 'csv' | 'excel';
}

// 图表推荐结果
export interface ChartRecommendation {
  chartType: ChartType;
  confidence: number;
  xAxis?: string;
  yAxis?: string;
  reason: string;
}

// 模板
export interface Template {
  id: string;
  name: string;
  category: 'sales' | 'finance' | 'operation' | 'custom';
  description: string;
  thumbnail?: string;
  config: Partial<Report>;
}

// 历史记录
export interface HistoryRecord {
  id: string;
  reportId: string;
  reportName: string;
  filePath: string;
  lastOpened: string;
}

// 用户设置
export interface UserSettings {
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  autoSave: boolean;
  autoSaveInterval: number;
  defaultExportPath: string;
  recentFiles: HistoryRecord[];
}