# DataViz Desktop - 开发概要

> 设计：杭州喵喵至家网络有限公司
> 版本：V1.0.0 (开发中)
> 最后更新：2026-07-15

## 一、项目概述

DataViz Desktop 是一款本地运行的数据可视化报告制作软件，类似 PowerBI。用户通过粘贴数据或上传文件导入数据，然后通过拖拽方式制作包含图表、文本、指标卡的数据分析页面。

## 二、技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 框架 | React | ^19.2.7 |
| 语言 | TypeScript | ~6.0.2 |
| 构建 | Vite | ^8.1.1 |
| UI组件库 | Ant Design | ^6.5.1 |
| 图标 | @ant-design/icons | ^6.3.2 |
| 图表引擎 | ECharts + echarts-for-react | ^6.1.0 / ^3.0.6 |
| 状态管理 | Zustand | ^5.0.14 |
| 路由 | react-router-dom | ^7.18.1 |
| HTTP | axios | ^1.18.1 |
| Excel解析 | xlsx (SheetJS) | ^0.18.5 |
| 截图导出 | html2canvas | ^1.4.1 |
| ECharts辅助 | tslib | ^2.8.1 |
| Lint | oxlint | ^1.71.0 |
| 桌面框架 | Electron | ^28.0.0 |
| 打包 | electron-builder | ^24.9.1 |
| 后端 | Python Flask + Pandas | (前端已本地解析替代) |

## 三、目录结构

```
DataVizDesktop/
├── electron/
│   └── main.js               # Electron 主进程
├── frontend/
│   └── src/
│       ├── api/
│       │   └── index.ts              # API 封装（预留后端接口）
│       ├── components/
│       │   ├── Canvas.tsx            # 画布组件（渲染/拖拽8方向/调整大小8方向/对齐辅助线）
│       │   ├── Canvas.module.css
│       │   ├── ChartRenderer.tsx     # 图表渲染器（15种ECharts图表）
│       │   ├── ComponentPanel.tsx    # 左侧组件面板（图表/文本/表格/图片/筛选器 + 数据源）
│       │   ├── ComponentPanel.module.css
│       │   ├── DataImportModal.tsx   # 数据导入弹窗（粘贴/上传）
│       │   ├── ErrorBoundary.tsx     # React 错误边界（防止白屏）
│       │   ├── FilterRenderer.tsx    # 筛选器渲染器（下拉/日期范围/滑块）
│       │   ├── PropertyPanel.tsx     # 右侧属性面板（PowerBI风格双Tab）
│       │   ├── PropertyPanel.module.css
│       │   ├── TableRenderer.tsx     # 表格渲染器（数据集绑定/排序/分页）
│       │   ├── TemplateModal.tsx     # 报告模板选择弹窗（6种预置模板）
│       │   ├── TemplateModal.module.css
│       │   └── TextEditor.tsx        # 文本框双击编辑组件
│       ├── constants/
│       │   └── index.ts              # 共享常量（图表名称、默认尺寸、颜色、字段配置等）
│       ├── pages/
│       │   ├── Home.tsx              # 首页（新建/打开报告/最近文件）
│       │   ├── Home.module.css
│       │   ├── DashboardEditor.tsx   # 主编辑器页面（撤销/重做/复制/粘贴/层级调整/模板）
│       │   ├── DashboardEditor.module.css
│       │   ├── DataInput.tsx         # 数据输入页（支持 CSV/Excel/粘贴）
│       │   └── DataInput.module.css
│       ├── store/
│       │   └── index.ts              # Zustand 全局状态（撤销/重做/复制/粘贴/层级调整/持久化）
│       ├── types/
│       │   └── index.ts              # TypeScript 类型定义
│       ├── utils/
│       │   └── dataParser.ts         # 前端本地数据解析器（含 Excel 解析）
│       ├── App.tsx                   # 应用入口（路由配置 + ErrorBoundary）
│       ├── App.css
│       ├── main.tsx                  # React 入口
│       └── index.css
├── package.json                      # 根配置（Electron + build 脚本）
└── dist/                             # 打包输出目录
    └── DataViz Desktop-1.0.0-arm64.dmg
```

## 四、核心模块说明

### 4.1 主编辑器 DashboardEditor

**文件**：`pages/DashboardEditor.tsx`

- 顶部工具栏：标题编辑、快捷添加按钮（图表/文本/指标卡/表格/图片/筛选器）、缩放、预览/编辑、打开/保存/导出/模板
- 撤销/重做按钮：支持 Ctrl+Z / Ctrl+Y 快捷键
- 复制/粘贴按钮：支持 Ctrl+C / Ctrl+V 快捷键
- 层级调整按钮：上移一层 / 下移一层 / 置顶 / 置底
- 保存：下载为 `.dataviz.json` 文件 + localStorage 持久化
- 导出：PNG（html2canvas截图下载）+ PDF（浏览器打印）
- 打开文件：选择 .dataviz.json 文件恢复报告
- 报告模板：模板按钮打开 TemplateModal，选择预置模板快速创建报告
- 左侧组件面板：15种图表分3组 + 文本 + KPI + 表格 + 图片 + 筛选器 + 数据源
- 中间画布：组件渲染、拖拽移动、调整大小（8方向）、对齐辅助线
- 右侧属性面板：格式/字段双Tab，卡片式分组
- 页面标签栏：多页面Tab切换、新增/删除页面

### 4.2 画布 Canvas

**文件**：`components/Canvas.tsx`

核心功能：
- 组件渲染：根据 type 渲染不同组件（chart/text/card/image/table/filter）
- 拖拽移动：鼠标按下拖动，考虑 scrollLeft/scrollTop 和 zoom，缩放时精准定位
- 调整大小：8个方向（nw/ne/sw/se/n/s/w/e），每个方向独立处理
- 拖放添加：接收左侧组件拖入，自动计算落点位置（考虑滚动偏移）
- 组件样式：`buildComponentStyle()` 动态生成背景/边框/阴影/透明度样式
- 对齐辅助线：拖拽时自动检测与其他组件及画布中心的对齐关系，显示红色辅助线
- 历史快照：拖拽/缩放开始前调用 `beginHistorySnapshot()` 记录撤销点

### 4.3 图表渲染器 ChartRenderer

**文件**：`components/ChartRenderer.tsx`

支持15种图表类型，所有图表都支持：
- 绑定真实数据集（dataSetId + xField + yField）
- 自定义颜色色板（默认8色调色板）
- 标题字体样式（大小、粗细、斜体、下划线、颜色、对齐）
- 图例（显示/位置/字号/颜色）
- 数据标签（显示/位置/字号/颜色）
- 网格线（显示/颜色/粗细/线型）
- 坐标轴（显示/标题/字号/颜色）

图表类型：
- 基础图表：折线图、柱状图、饼图、环形图
- 高级图表：堆叠柱状图、条形图、面积图、堆叠面积图、雷达图、散点图
- 其他图表：仪表盘、漏斗图、热力图、瀑布图、树状图

性能优化：baseOption 和 option 均使用 useMemo，依赖精简避免无效重渲染。

**图表更新机制**：ReactECharts 使用动态 `key` 属性（包含 `component.id` + `dataSetId` + `xField` + `yField` + `dataVersion`），当字段绑定或数据集内容变化时强制重新挂载图表实例，确保图表始终显示最新数据。

### 4.4 属性面板 PropertyPanel

**文件**：`components/PropertyPanel.tsx`

PowerBI风格设计，双Tab结构，根据组件类型显示不同配置：

**格式Tab**（图表组件，卡片列表）：
1. 常规：宽度、高度、X位置、Y位置、透明度
2. 视觉对象类型：图表类型选择（分组下拉）
3. 标题：标题文本 + 复合字体切片
4. 背景：背景色、透明度
5. 边框：边框色、粗细、圆角
6. 阴影：阴影色、模糊度、X/Y偏移
7. 图例：显示、位置、字号、颜色
8. 数据标签：显示、位置、字号、颜色
9. 坐标轴：X轴/Y轴 显示与标题
10. 网格线：显示、颜色、粗细、线型
11. 数据颜色：8色调色板，可添加自定义颜色

**特殊组件属性**：
- 文本组件：文本内容、字体/字号/粗细/颜色/对齐
- 指标卡：标题/数值/单位、渐变背景色
- 表格组件：数据源选择
- 图片组件：图片URL + 替代文本 + 预览
- 筛选器组件：标签文本、筛选类型（下拉/日期/滑块）、数据源、绑定字段

**字段Tab**：
- 数据源选择
- 数据字段绑定（按图表类型分5组显示不同字段配置）

### 4.5 组件面板 ComponentPanel

**文件**：`components/ComponentPanel.tsx`

- 15种图表分3组折叠展示
- 文本组件、KPI指标卡、数据表格、图片组件、筛选器
- 双击或拖拽添加组件
- 数据源区域：显示数据集列表 + "添加数据"按钮
- DataImportModal：粘贴数据/上传文件导入

### 4.6 状态管理 Store

**文件**：`store/index.ts`

Zustand 全局状态，包含：

```typescript
interface AppState {
  currentReport: Report | null;
  selectedComponentId: string | null;
  currentPageId: string | null;
  dataSets: DataSet[];
  templates: Template[];
  settings: UserSettings;
  isSaved: boolean;
  editMode: 'edit' | 'preview';
  // 撤销/重做
  history: Report[];
  future: Report[];
  // 复制/粘贴
  clipboard: Component | null;
  // 数据版本号（数据集变更时递增，用于强制图表刷新）
  dataVersion: number;
  actions: { /* ... */ }
}
```

**撤销/重做机制**：
- `pushHistory(set, get)`：在 mutation 前保存当前报告快照（JSON深拷贝），最多保留50条历史
- `undo()`：从 history 栈弹出上一个快照，当前报告推入 future 栈
- `redo()`：从 future 栈弹出，恢复至当前报告
- 拖拽/缩放优化：`beginHistorySnapshot()` 在操作开始时记录一次，操作过程中不重复记录

**复制/粘贴机制**：
- `copyComponent(id)`：将组件深拷贝到 clipboard
- `pasteComponent()`：从 clipboard 克隆组件，偏移 +30px，生成新ID

**层级调整**：
- `moveComponentUp/Down(id)`：交换组件在 components 数组中的位置
- `moveComponentToTop/Bottom(id)`：将组件移到数组末尾/开头

**数据版本**：
- `dataVersion` 计数器：`addDataSet`/`removeDataSet` 时递增
- ChartRenderer 的 key 包含 dataVersion，确保数据集变更时图表强制刷新

**持久化机制**：
- 报告存储：localStorage `dataviz_reports`（保存时自动写入）
- 数据集存储：localStorage `dataviz_datasets`（保存时同步写入）
- 设置存储：localStorage `dataviz_settings`（更新时实时写入）
- 自动保存：通过 Zustand subscribe 监听 `isSaved` 变化，延迟自动保存（默认30秒）
- 启动时：从 localStorage 加载数据集和设置

### 4.7 数据解析器 dataParser

**文件**：`utils/dataParser.ts`

前端本地解析，无需后端依赖：
- 支持粘贴数据（TSV/CSV自动识别分隔符）
- 支持上传 CSV/TSV 文件
- **支持上传 Excel 文件**（.xlsx/.xls，使用 SheetJS 库）
- 新增 `parseExcelFile()` 函数，使用 XLSX.read() 解析二进制 Excel 数据
- 自动识别字段类型（number/string/date/percentage/category）
- 生成数据集对象（DataSet）

### 4.8 表格渲染器 TableRenderer

**文件**：`components/TableRenderer.tsx`

- 基于 Ant Design Table 组件
- 支持数据集绑定：选择 dataSetId 后自动使用数据集字段作为列，数据作为行
- 自动列映射：优先使用组件配置的 columns，否则使用数据集 fields
- 排序功能：数字列数值排序，文本列字典序排序
- 分页功能：默认每页10条，可配置 pageSize 和 showSizeChanger
- 无数据集时使用组件内置 data 和 columns

### 4.9 筛选器渲染器 FilterRenderer

**文件**：`components/FilterRenderer.tsx`

支持三种筛选类型：
- 下拉选择（dropdown）：Select 下拉框，支持绑定数据集字段自动生成选项
- 日期范围（dateRange）：DatePicker.RangePicker 日期范围选择器
- 滑块（slider）：Slider 数值滑块（0-100）

### 4.10 报告模板 TemplateModal

**文件**：`components/TemplateModal.tsx`

6种预置报告模板，一键创建完整报告：
- 销售分析看板：销售额趋势、区域分布、产品占比等
- 财务报表：收入/利润/现金流指标卡、瀑布图、支出结构
- 运营分析：DAU/留存率/转化漏斗/用户画像
- 项目管理：项目进度、工时统计、Sprint进度
- 电商看板：GMV/转化率/复购率、品类分布、渠道对比
- 空白画布：从零开始创建自定义报告

模板包含预配置的组件布局（图表 + 指标卡），选择后直接加载到编辑器中。

### 4.11 共享常量 constants

**文件**：`constants/index.ts`

消除代码重复，统一管理：
- `CHART_NAMES`：图表类型 → 中文名称映射
- `CHART_DEFAULT_SIZES`：图表类型 → 默认宽高
- `DEFAULT_COLOR_PALETTE`：8色默认色板
- `CHART_FIELD_CONFIG`：图表类型 → 字段配置（xLabel/yLabel等）
- `CHART_WITH_AXES`：有坐标轴的图表类型列表
- `CHART_WITH_ITEM_TRIGGER`：用 item trigger 的图表类型
- `FONT_OPTIONS`：字体选项列表
- `CHART_TYPE_OPTIONS`：图表类型分组选项

### 4.12 错误边界 ErrorBoundary

**文件**：`components/ErrorBoundary.tsx`

React 错误边界组件，包裹在 App.tsx 入口：
- 捕获子组件渲染错误
- 显示友好错误提示页面（Result 组件）
- 防止单个组件崩溃导致整个应用白屏

## 五、核心数据模型

**文件**：`types/index.ts`

```typescript
// 报告
interface Report {
  id: string;
  title: string;
  pageSize: PageSize; // 'A4' | '16:9' | '4:3' | 'custom'
  pages: ReportPage[];
  components: Component[];
  createdAt: string;
  updatedAt: string;
}

// 页面
interface ReportPage {
  id: string;
  name: string;
}

// 基础组件
interface BaseComponent {
  id: string;
  type: ComponentType; // 'chart' | 'text' | 'image' | 'card' | 'table' | 'filter'
  pageId: string;
  x: number; y: number; width: number; height: number;
  style?: ComponentStyle;
}

// 图表组件
interface ChartComponent extends BaseComponent {
  type: 'chart';
  chartType: ChartType; // 15种
  title: string;
  dataSetId?: string;
  xField?: string;
  yField?: string;
  config: ChartConfig; // 含标题/背景/边框/阴影/图例/数据标签/坐标轴/网格线配置
}

// 表格组件
interface TableComponent extends BaseComponent {
  type: 'table';
  columns: string[];
  data: Record<string, unknown>[];
  dataSetId?: string;
  pagination?: { pageSize?: number; showSizeChanger?: boolean } | false;
}

// 筛选器组件
interface FilterComponent extends BaseComponent {
  type: 'filter';
  filterType: 'dropdown' | 'dateRange' | 'slider';
  label: string;
  dataSetId?: string;
  field?: string;
  values?: string[];
  defaultValue?: string | [string, string] | number;
}

// 数据集
interface DataSet {
  id: string;
  name: string;
  fields: DataField[];
  data: Record<string, unknown>[];
  rowCount: number;
  source: 'paste' | 'csv' | 'excel';
}
```

## 六、已实现功能清单

### 编辑器功能
- [x] 新建/打开报告
- [x] 打开文件（加载 .dataviz.json）
- [x] 保存到文件（下载 .dataviz.json）
- [x] 导出 PNG（html2canvas 截图）
- [x] 导出 PDF（浏览器打印）
- [x] 导出 HTML（独立 HTML 文件，含 header/截图/footer）
- [x] 导出 PPT（pptxgenjs 生成 .pptx，含封面+内容页）
- [x] 多页面支持（Tab切换、新增、删除）
- [x] 拖拽添加组件
- [x] 双击添加组件
- [x] 组件拖拽移动（缩放时精准定位）
- [x] 组件调整大小（8方向：nw/ne/sw/se/n/s/w/e）
- [x] Delete键删除组件
- [x] Ctrl+S保存
- [x] 画布缩放（30%-200%）
- [x] 编辑/预览模式切换
- [x] 组件卡片式外观（外框+阴影+圆角）
- [x] localStorage 持久化 + 自动保存
- [x] 首页最近文件列表（从 localStorage 读取）
- [x] 撤销/重做（Ctrl+Z / Ctrl+Y，历史栈50条，拖拽优化）
- [x] 组件复制/粘贴（Ctrl+C / Ctrl+V，clipboard模式）
- [x] 组件层级调整（上移/下移/置顶/置底）
- [x] 组件对齐辅助线（拖拽时红实线显示对齐关系）
- [x] 报告模板（6种预置模板，一键创建完整报告）

### 图表
- [x] 15种图表类型
- [x] 数据绑定（数据集 + X/Y字段）
- [x] 自定义颜色色板
- [x] 标题样式（字体、大小、粗细、对齐）
- [x] 图例（位置、字号、颜色）
- [x] 数据标签
- [x] 坐标轴控制
- [x] 网格线控制

### 属性面板
- [x] 格式/字段双Tab
- [x] 卡片式分组（折叠/展开）
- [x] 复合字体切片
- [x] 背景/边框/阴影配置
- [x] 尺寸位置精确调整
- [x] 透明度控制
- [x] 图表类型切换

### 数据导入
- [x] 编辑器内直接导入数据
- [x] 粘贴数据导入
- [x] 上传 CSV 文件
- [x] 上传 Excel 文件（.xlsx/.xls）
- [x] 前端本地解析（无需后端）

### 文本组件
- [x] 双击编辑文本
- [x] 字体/字号/粗细/颜色/对齐
- [x] 可拖拽移动

### KPI指标卡
- [x] 渐变背景
- [x] 标题/数值字体配置
- [x] 可配置渐变颜色

### 表格组件
- [x] 数据集绑定，自动列映射
- [x] 数值/文本排序
- [x] 分页控制（每页条数、总数显示）

### 图片组件
- [x] 图片URL配置
- [x] 替代文本
- [x] 图片预览

### 筛选器组件
- [x] 下拉选择（Select）
- [x] 日期范围（DatePicker RangePicker）
- [x] 数值滑块（Slider）
- [x] 数据集字段绑定，自动生成选项

### 代码质量
- [x] TypeScript 严格模式，零编译错误
- [x] oxlint 零警告零错误
- [x] 共享常量文件消除重复代码
- [x] ErrorBoundary 错误边界
- [x] ChartRenderer useMemo 性能优化 + dataVersion 强制刷新
- [x] 所有 InputNumber 添加 step/precision
- [x] antd v6 API 适配（variant 代替 bordered）
- [x] 拖拽/缩放历史记录优化（beginHistorySnapshot 防高频污染）

## 七、开发约定

### 命名约定
- 组件文件：大驼峰 + `.tsx`（如 `PropertyPanel.tsx`）
- 样式文件：同名 + `.module.css`（CSS Modules）
- 类型文件：`types/index.ts` 集中管理
- 常量文件：`constants/index.ts` 共享常量
- 事件处理函数：`handle` + 动作名（如 `handleAddChart`）

### 样式约定
- 使用 CSS Modules，类名用小驼峰
- 组件面板、属性面板采用 filled 风格输入控件
- 颜色统一用主题色（主色 #1890ff）

### 状态管理约定
- 全局状态用 Zustand，统一在 `store/index.ts`
- 组件内部状态用 useState
- 状态更新通过 actions 对象的方法
- 持久化通过 localStorage 读写工具函数

### 组件编写约定
- 函数式组件 + TypeScript
- Props 接口定义在组件文件顶部
- 默认值通过解构赋值或 `??` 提供

## 八、图表类型字段分组

5组图表类型，每组显示不同的字段配置：

| 分组 | 图表类型 | 字段配置 |
|------|----------|----------|
| Group A | 折线/柱状/堆叠柱/条形/面积/堆叠面积/瀑布 | X轴(分类) + Y轴(数值) |
| Group B | 饼图/环形图/漏斗图/雷达图/树状图 | 分类字段 + 数值字段 |
| Group C | 散点图 | X轴(数值) + Y轴(数值) |
| Group D | 仪表盘 | 仅数值字段 |
| Group E | 热力图 | X轴 + Y轴 |

## 九、待开发功能

- [ ] 多页之间组件复制
- [ ] 后端 AI 图表推荐与配置生成（API 接口已定义，Python Flask 后端待实现）

## 十、已解决问题

1. **拖拽添加组件时落点位置**：已修复，所有坐标计算（拖拽移动、调整大小、drop）都加上 `scrollLeft`/`scrollTop`
2. **组件调整大小**：已支持8个方向（nw/ne/sw/se/n/s/w/e）
3. **数据解析**：已引入 xlsx 库，支持 Excel 文件解析
4. **报告持久化**：已实现 localStorage 持久化 + 自动保存订阅
5. **antd v6 API**：已全部使用 `variant="filled"`，无 `bordered` 用法
6. **addonAfter 弃用**：代码中无此用法，无需处理
7. **保存/导出功能**：已实现文件下载保存、PNG截图导出、PDF打印导出
8. **打开文件**：首页和编辑器均支持选择 .dataviz.json 文件恢复报告
9. **echarts-for-react 依赖**：已安装 tslib，配置 vite.config.ts optimizeDeps
10. **图表字段绑定后不更新**：已添加 dataVersion 计数器 + ReactECharts 动态 key，确保字段绑定和数据集变更时图表强制刷新
11. **撤销/重做历史污染**：拖拽/缩放操作使用 beginHistorySnapshot 在操作开始时记录一次，避免高频操作产生大量历史记录
12. **Electron 打包后 .app 白屏**：Vite 默认打包产物引用路径为绝对路径 `/assets/...`，Electron 通过 `loadFile` 加载 HTML 时从文件系统根目录查找资源失败。修复：在 `vite.config.ts` 中设置 `base: './'`，使打包产物使用相对路径 `./assets/...`，确保 Electron 可正确加载资源
13. **属性面板输入框失焦**：PropertyPanel 中 7 个切片组件（TextInputSlice/NumberSlice/SelectSlice/ColorSlice/ToggleSlice/SliderSlice/FontSlice）定义在组件内部，导致每次重渲染时 React 将其视为新组件类型，卸载旧 DOM 重新挂载。修复：将所有切片组件移到模块顶层，并添加 React.memo
14. **筛选器组件非受控**：FilterRenderer 使用 defaultValue 且无 onChange 回调，用户操作无法持久化。修复：改为受控组件，value 字段存储到 FilterComponent 类型，Canvas 传递 onChange 回调写入 store
15. **仪表盘始终显示 65%**：chartData 计算要求 xField && yField 同时存在，但仪表盘只需 yField，导致 hasData 永远为 false。修复：chartData 添加 gauge 特殊处理，只检查 yField；取值改为所有字段求和；自动计算上限（最大值×1.5）；重新设计视觉（无刻度现代风格、绝对值+百分比双行显示）
16. **仪表盘中心圆圈与文字重叠**：anchor 和 detail 的 offsetCenter 都是 [0, 0]，完全重叠。修复：detail 移到 [0, '40%']（中心下方），title 移到 [0, '25%']（中心上方），形成三层清晰布局
17. **模板扩充**：从 6 套扩展到 11 套，新增人力资源/市场营销/客户分析/供应链/社交媒体看板。销售分析看板扩展为 3 页（总览/区域分析/产品分析），财务报表扩展为 2 页（财务总览/利润与现金流），实现多页模板支持
18. **Electron 打包后首页白屏 / 路由不工作**：开发时使用 `BrowserRouter` 依赖 HTML5 History API，需要 web 服务器支持。Electron 打包后通过 `loadFile` 使用 `file://` 协议加载前端页面，`BrowserRouter` 路由完全失效，导致所有页面白屏。修复：将 `App.tsx` 中的 `BrowserRouter` 替换为 `HashRouter`。HashRouter 使用 URL hash（`#/path`）进行路由，完全兼容 `file://` 协议。
19. **Python 后端打包集成**：应用包含 Python Flask 后端服务，用 PyInstaller 打包为独立 `backend.exe`（约 44MB），通过 `extraResources` 配置内嵌到 Electron 应用中。修改 `electron/main.js`，在应用启动时 `spawn` 后端子进程（`process.resourcesPath/backend/backend.exe`），退出时 `kill`。开发模式下后端需手动启动。
20. **HTML/PPT 导出**：新增 HTML 和 PPT 两种导出格式。HTML 导出生成独立 HTML 文件（含 header/截图/footer 样式，支持打印）；PPT 导出使用 pptxgenjs 库生成 .pptx 文件，包含封面页和内容页（封面使用蓝色背景，内容页每页一幅截图）。导出菜单扩展为 4 项：PNG、PDF、HTML、PPT。

## 十一、启动方式

```bash
# 1. 安装前端依赖
cd frontend
npm install

# 2. 启动开发服务器（纯前端模式）
npm run dev
# 访问 http://localhost:5173
# 编辑器页：http://localhost:5173/editor

# 3. TypeScript 类型检查
npx tsc --noEmit

# 4. Lint 检查
npx oxlint

# 5. 前端构建
npx vite build

# === Electron 桌面应用 ===

# 6. 安装根目录依赖（Electron + electron-builder 等）
cd ..
npm install

# 7. 启动 Electron 开发模式（需先启动前端 dev server）
npm run dev

# 8. 打包 Windows exe
npm run build:frontend        # 先构建前端
pip install -r ../backend/requirements.txt pyinstaller  # 安装Python依赖
pyinstaller --onefile --name backend --distpath ../electron/backend ../backend/app.py  # 打包后端
npm run dist                  # 打包 NSIS 安装程序
# 输出：dist/DataViz Desktop Setup 1.0.0.exe

# 9. 打包 macOS .app
npm run build:frontend  # 先构建前端
npm run dist            # 打包 DMG
# 输出：dist/DataViz Desktop-1.0.0-arm64.dmg
```
