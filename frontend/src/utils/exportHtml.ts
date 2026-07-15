/**
 * HTML 导出 - 生成包含真实图表的独立 HTML 文件
 */
import type { Report, Component, ChartComponent, TextComponent, CardComponent, TableComponent, ImageComponent, DataSet } from '../types';
import { computeChartData, buildChartOption } from './chartOptions';

/** HTML 转义 */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 将组件样式转为内联 CSS */
function componentInlineStyle(c: Component): string {
  const s = c as any;
  const styles: string[] = [];
  styles.push(`position:absolute`);
  styles.push(`left:${c.x}px`);
  styles.push(`top:${c.y}px`);
  styles.push(`width:${c.width}px`);
  styles.push(`height:${c.height}px`);

  // 背景
  const bg = s.background || s.config?.background;
  if (bg?.show !== false && bg?.color) {
    const alpha = bg.transparency ? 1 - bg.transparency / 100 : 1;
    styles.push(`background:${bg.color}`);
    if (alpha < 1) styles.push(`opacity:${alpha}`);
  } else if (bg?.show === false) {
    styles.push(`background:transparent`);
  } else {
    styles.push(`background:#fff`);
  }

  // 边框
  const border = s.border || s.config?.border;
  if (border?.show !== false) {
    styles.push(`border:${border?.width ?? 1}px solid ${border?.color || '#e0e0e0'}`);
    styles.push(`border-radius:${border?.radius ?? 6}px`);
  }

  // 阴影
  const shadow = s.shadow || s.config?.shadow;
  if (shadow?.show !== false && shadow) {
    styles.push(`box-shadow:${shadow.offsetX || 0}px ${shadow.offsetY || 0}px ${shadow.blur || 8}px ${shadow.spread || 0}px ${shadow.color || 'rgba(0,0,0,0.08)'}`);
  } else {
    styles.push(`box-shadow:0 1px 4px rgba(0,0,0,0.06)`);
  }

  styles.push(`overflow:hidden`);
  return styles.join(';');
}

/** 渲染图表组件为 ECharts 容器 */
function renderChartHtml(component: ChartComponent, dataSets: DataSet[], chartIndex: number): string {
  const dataSet = component.dataSetId ? dataSets.find(ds => ds.id === component.dataSetId) ?? null : null;
  const chartData = computeChartData(component.chartType, component, dataSet);
  const option = buildChartOption(component, chartData);
  const style = componentInlineStyle(component);
  const title = component.title || component.chartType;

  return `
<div style="${style}" class="chart-container">
  <div id="chart-${chartIndex}" style="width:100%;height:100%;" data-option='${JSON.stringify(option)}'></div>
</div>`;
}

/** 渲染文本组件 */
function renderTextHtml(component: TextComponent): string {
  const style = componentInlineStyle(component);
  const textStyle = [
    `font-size:${component.fontSize}px`,
    `font-family:${component.fontFamily || 'Microsoft YaHei'}`,
    `font-weight:${component.fontWeight || 'normal'}`,
    `text-align:${component.textAlign || 'left'}`,
    `color:${component.color || '#333'}`,
    `padding:8px 12px`,
    `white-space:pre-wrap`,
    `word-break:break-word`,
  ].join(';');

  return `
<div style="${style}">
  <div style="${textStyle}">${esc(component.content || '')}</div>
</div>`;
}

/** 渲染指标卡 */
function renderCardHtml(component: CardComponent): string {
  const style = componentInlineStyle(component);
  // 渐变背景
  let bgStyle = '';
  const bg = (component as any).background;
  if (bg?.gradient) {
    bgStyle = `background:linear-gradient(135deg, ${bg.gradient}, ${bg.gradientEnd || bg.gradient});`;
  }

  return `
<div style="${style};${bgStyle}display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;">
  <div style="font-size:14px;color:#999;margin-bottom:8px;">${esc(component.title || '指标')}</div>
  <div style="font-size:${(component as any).valueFont?.fontSize || 36}px;font-weight:bold;color:${(component as any).valueFont?.color || '#1890ff'};">
    ${esc(String(component.value || '0'))}
    ${component.unit ? `<span style="font-size:16px;color:#999;">${esc(component.unit)}</span>` : ''}
  </div>
  ${component.trendValue ? `<div style="font-size:12px;color:${component.trend === 'up' ? '#52c41a' : component.trend === 'down' ? '#f5222d' : '#999'};margin-top:4px;">${esc(component.trendValue)}</div>` : ''}
</div>`;
}

/** 渲染表格组件 */
function renderTableHtml(component: TableComponent, dataSets: DataSet[]): string {
  const style = componentInlineStyle(component);
  let columns = component.columns;
  let rows = component.data;

  // 如果有数据集绑定，使用数据集
  if (component.dataSetId) {
    const ds = dataSets.find(d => d.id === component.dataSetId);
    if (ds) {
      columns = ds.fields.map(f => f.name);
      rows = ds.data.slice(0, 100) as Record<string, unknown>[];
    }
  }

  const headerRow = columns.map(c => `<th style="padding:8px 12px;border-bottom:2px solid #e8e8e8;text-align:left;font-weight:600;color:#333;white-space:nowrap;">${esc(c)}</th>`).join('');
  const bodyRows = rows.slice(0, 50).map((row, ri) => {
    const cells = columns.map(c => `<td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#666;white-space:nowrap;">${esc(String(row[c] ?? ''))}</td>`).join('');
    return `<tr style="background:${ri % 2 === 0 ? '#fafafa' : '#fff'};">${cells}</tr>`;
  }).join('');

  return `
<div style="${style};display:flex;flex-direction:column;overflow:auto;">
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr>${headerRow}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  ${rows.length > 50 ? `<div style="text-align:center;color:#999;padding:8px;">... 共 ${rows.length} 行，仅显示前 50 行</div>` : ''}
</div>`;
}

/** 渲染图片组件 */
function renderImageHtml(component: ImageComponent): string {
  const style = componentInlineStyle(component);
  if (!component.src) {
    return `<div style="${style};display:flex;align-items:center;justify-content:center;color:#ccc;font-size:14px;">暂无图片</div>`;
  }
  return `
<div style="${style}">
  <img src="${esc(component.src)}" alt="${esc(component.alt || '')}" style="width:100%;height:100%;object-fit:contain;" onerror="this.parentElement.innerHTML='<div style=display:flex;align-items:center;justify-content:center;height:100%;color:#ccc;font-size:14px;>图片加载失败</div>'" />
</div>`;
}

/** 渲染单个组件为 HTML */
function renderComponentHtml(component: Component, dataSets: DataSet[], chartIndex: number): { html: string; nextIndex: number } {
  switch (component.type) {
    case 'chart':
      return { html: renderChartHtml(component as ChartComponent, dataSets, chartIndex), nextIndex: chartIndex + 1 };
    case 'text':
      return { html: renderTextHtml(component as TextComponent), nextIndex: chartIndex };
    case 'card':
      return { html: renderCardHtml(component as CardComponent), nextIndex: chartIndex };
    case 'table':
      return { html: renderTableHtml(component as TableComponent, dataSets), nextIndex: chartIndex };
    case 'image':
      return { html: renderImageHtml(component as ImageComponent), nextIndex: chartIndex };
    default:
      return { html: '', nextIndex: chartIndex };
  }
}

/** 生成完整 HTML 文档 */
export function generateHtmlExport(report: Report, dataSets: DataSet[]): string {
  const dims = PAGE_DIMS[report.pageSize] || PAGE_DIMS['16:9'];

  // 按页面分组组件
  const pages = report.pages || [];
  const allPagesHtml: string[] = [];
  let chartIndex = 0;

  for (const page of pages) {
    const pageComps = report.components.filter(c => c.pageId === page.id);
    const compsHtml = pageComps.map(c => {
      const result = renderComponentHtml(c, dataSets, chartIndex);
      chartIndex = result.nextIndex;
      return result.html;
    }).join('\n');

    allPagesHtml.push(`
    <div class="page-section">
      <div class="page-title">${esc(page.name)}</div>
      <div class="page-canvas" style="position:relative;width:${dims.width}px;height:${dims.height}px;background:#fff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
        ${compsHtml}
      </div>
    </div>`);
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(report.title || '报告')}</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Microsoft YaHei', 'PingFang SC', -apple-system, sans-serif;
      background: #f0f2f5; color: #333; padding: 40px 20px;
    }
    .report-container { max-width: 1960px; margin: 0 auto; }
    .report-header {
      text-align: center; margin-bottom: 32px; padding: 32px 24px;
      background: linear-gradient(135deg, #1890ff, #096dd9); border-radius: 12px;
      color: #fff; box-shadow: 0 4px 16px rgba(24,144,255,0.3);
    }
    .report-header h1 { font-size: 32px; margin-bottom: 12px; font-weight: 700; }
    .report-header .meta { font-size: 14px; opacity: 0.9; }
    .report-header .meta span { margin: 0 16px; }
    .page-section {
      background: #fff; border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      padding: 24px; margin-bottom: 32px;
    }
    .page-title {
      font-size: 20px; font-weight: 700; color: #1890ff;
      margin-bottom: 20px; padding-bottom: 12px;
      border-bottom: 2px solid #e8f0fe;
    }
    .page-canvas { margin: 0 auto; transform-origin: top left; }
    .report-footer {
      text-align: center; padding: 24px;
      font-size: 12px; color: #999;
    }
    .chart-container { background: #fff; }
    @media print {
      body { background: #fff; padding: 0; }
      .report-header { border-radius: 0; box-shadow: none; }
      .page-section { box-shadow: none; border-radius: 0; page-break-after: always; }
      .page-section:last-child { page-break-after: auto; }
      .page-canvas { border: none; }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="report-header">
      <h1>${esc(report.title || '报告')}</h1>
      <div class="meta">
        <span>📅 ${new Date().toLocaleString('zh-CN')}</span>
        <span>📄 ${pages.length} 页</span>
        <span>📐 ${report.pageSize || '16:9'}</span>
      </div>
    </div>
    ${allPagesHtml.join('\n')}
    <div class="report-footer">
      © ${new Date().getFullYear()} DataViz Desktop · 数据可视化报告设计器
    </div>
  </div>
  <script>
    (function() {
      // 初始化所有 ECharts 图表
      var containers = document.querySelectorAll('.chart-container [id^="chart-"]');
      containers.forEach(function(el) {
        try {
          var option = JSON.parse(el.getAttribute('data-option'));
          var chart = echarts.init(el);
          chart.setOption(option);
          // 响应式调整
          window.addEventListener('resize', function() { chart.resize(); });
        } catch(e) {
          el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;">图表加载失败</div>';
        }
      });
    })();
  <\/script>
</body>
</html>`;
}

/** 页面尺寸映射 */
const PAGE_DIMS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  'A4': { width: 1190, height: 1684 },
  'custom': { width: 1920, height: 1080 },
};
