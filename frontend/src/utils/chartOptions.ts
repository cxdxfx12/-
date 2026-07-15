/**
 * 图表 ECharts 配置生成 - 纯函数（ChartRenderer 和 HTML 导出共用）
 */
import type { ChartComponent, DataSet } from '../types';
import { DEFAULT_COLOR_PALETTE, CHART_WITH_ITEM_TRIGGER } from '../constants';

// ========== 数据计算 ==========

export interface ChartData {
  categories: string[];
  values: number[];
  hasData: boolean;
}

export function computeChartData(
  chartType: string,
  component: ChartComponent,
  dataSet: DataSet | null
): ChartData {
  const isGauge = chartType === 'gauge';
  const hasFields = isGauge
    ? !!(dataSet && component.yField)
    : !!(dataSet && component.xField && component.yField);

  if (hasFields && dataSet) {
    if (isGauge) {
      const values = dataSet.data.map((row) => {
        const val = row[component.yField as string];
        if (typeof val === 'number') return val;
        const num = Number(String(val || '0').replace(/[%,¥￥$\s]/g, ''));
        return isNaN(num) ? 0 : num;
      });
      return { categories: [], values, hasData: true };
    }
    const categories = dataSet.data.map((row) => String(row[component.xField as string] || ''));
    const values = dataSet.data.map((row) => {
      const val = row[component.yField as string];
      if (typeof val === 'number') return val;
      const num = Number(String(val || '0').replace(/[%,¥￥$\s]/g, ''));
      return isNaN(num) ? 0 : num;
    });
    return { categories, values, hasData: true };
  }
  return {
    categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
    values: [120, 200, 150, 80, 70, 110],
    hasData: false,
  };
}

// ========== ECharts Option 生成 ==========

export function buildBaseOption(component: ChartComponent, chartType: string) {
  const cfg = component.config;
  const tf = cfg.titleFont || {};
  const legendCfg = cfg.legend || {};
  const legendShow = legendCfg.show ?? cfg.showLegend ?? true;
  const legendPosition = legendCfg.position || 'bottom';

  return {
    title: {
      text: cfg.title || component.title,
      left: tf.align || 'center',
      top: 10,
      textStyle: {
        fontSize: tf.fontSize || 14,
        fontWeight: tf.bold ? 'bold' : 'normal',
        fontStyle: tf.italic ? 'italic' : 'normal',
        textDecoration: tf.underline ? 'underline' : 'none',
        color: tf.color || '#333333',
      },
    },
    tooltip: {
      trigger: CHART_WITH_ITEM_TRIGGER.includes(chartType as any) ? 'item' : 'axis',
    } as any,
    legend: {
      show: legendShow,
      ...(legendPosition === 'top' && { top: 10 }),
      ...(legendPosition === 'bottom' && { bottom: 10 }),
      ...(legendPosition === 'left' && { left: 10, orient: 'vertical' as const }),
      ...(legendPosition === 'right' && { right: 10, orient: 'vertical' as const }),
      textStyle: {
        fontSize: legendCfg.fontSize || 12,
        color: legendCfg.color || '#666666',
      },
    },
    grid: {
      left: legendPosition === 'left' ? '15%' : '10%',
      right: legendPosition === 'right' ? '15%' : '10%',
      top: '15%',
      bottom: legendPosition === 'bottom' ? '20%' : '15%',
      containLabel: true,
    },
  };
}

export function buildChartOption(
  component: ChartComponent,
  chartData: ChartData
): any {
  const chartType = component.chartType;
  const baseOption = buildBaseOption(component, chartType);
  const cfg = component.config;
  const colorPalette = cfg.colors || DEFAULT_COLOR_PALETTE;
  const gridCfg = cfg.gridLine || {};
  const gridShow = gridCfg.show ?? cfg.showGrid ?? true;
  const gridColor = gridCfg.color || '#f0f0f0';
  const gridWidth = gridCfg.width || 1;
  const gridType = gridCfg.type || 'solid';
  const dlCfg = cfg.dataLabel || {};
  const xCfg = cfg.xAxisConfig || {};
  const yCfg = cfg.yAxisConfig || {};

  switch (chartType) {
    case 'line':
      return {
        ...baseOption,
        xAxis: {
          type: 'category', data: chartData.categories,
          show: xCfg.show ?? true, name: xCfg.showTitle ? xCfg.title : '',
          axisLabel: { fontSize: xCfg.fontSize || 12, color: xCfg.color || '#666' },
        },
        yAxis: {
          type: 'value',
          show: yCfg.show ?? true, name: yCfg.showTitle ? yCfg.title : '',
          axisLabel: { fontSize: yCfg.fontSize || 12, color: yCfg.color || '#666' },
          splitLine: { show: gridShow, lineStyle: { color: gridColor, width: gridWidth, type: gridType } },
        },
        series: [{
          name: component.yField || '数值', data: chartData.values, type: 'line', smooth: true,
          itemStyle: { color: colorPalette[0] },
          label: { show: dlCfg.show ?? false, position: dlCfg.position || 'top', fontSize: dlCfg.fontSize || 12, color: dlCfg.color || '#333' },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(24, 144, 255, 0.3)' }, { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }] } },
        }],
      };

    case 'bar':
      return {
        ...baseOption,
        xAxis: {
          type: 'category', data: chartData.categories,
          show: xCfg.show ?? true, name: xCfg.showTitle ? xCfg.title : '',
          axisLabel: { fontSize: xCfg.fontSize || 12, color: xCfg.color || '#666' },
        },
        yAxis: {
          type: 'value',
          show: yCfg.show ?? true, name: yCfg.showTitle ? yCfg.title : '',
          axisLabel: { fontSize: yCfg.fontSize || 12, color: yCfg.color || '#666' },
          splitLine: { show: gridShow, lineStyle: { color: gridColor, width: gridWidth, type: gridType } },
        },
        series: [{
          name: component.yField || '数值', data: chartData.values, type: 'bar', barMaxWidth: 40,
          label: { show: dlCfg.show ?? false, position: dlCfg.position || 'top', fontSize: dlCfg.fontSize || 12, color: dlCfg.color || '#333' },
          itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: colorPalette[0] }, { offset: 1, color: '#69c0ff' }] }, borderRadius: [4, 4, 0, 0] },
        }],
      };

    case 'stackedBar':
      return {
        ...baseOption,
        xAxis: {
          type: 'category', data: chartData.categories,
          show: xCfg.show ?? true, name: xCfg.showTitle ? xCfg.title : '',
          axisLabel: { fontSize: xCfg.fontSize || 12, color: xCfg.color || '#666' },
        },
        yAxis: {
          type: 'value',
          show: yCfg.show ?? true, name: yCfg.showTitle ? yCfg.title : '',
          axisLabel: { fontSize: yCfg.fontSize || 12, color: yCfg.color || '#666' },
          splitLine: { show: gridShow, lineStyle: { color: gridColor, width: gridWidth, type: gridType } },
        },
        series: [
          { name: '第一组', type: 'bar', stack: 'total', data: chartData.values, itemStyle: { color: colorPalette[0] }, label: { show: dlCfg.show ?? false, position: 'inside', fontSize: dlCfg.fontSize || 12 } },
          { name: '第二组', type: 'bar', stack: 'total', data: chartData.values.map(v => Math.round(v * 0.7)), itemStyle: { color: colorPalette[1] }, label: { show: dlCfg.show ?? false, position: 'inside', fontSize: dlCfg.fontSize || 12 } },
          { name: '第三组', type: 'bar', stack: 'total', data: chartData.values.map(v => Math.round(v * 0.4)), itemStyle: { color: colorPalette[2] }, label: { show: dlCfg.show ?? false, position: 'inside', fontSize: dlCfg.fontSize || 12 } },
        ],
      };

    case 'horizontalBar':
      return {
        ...baseOption,
        xAxis: {
          type: 'value',
          show: xCfg.show ?? true, name: xCfg.showTitle ? xCfg.title : '',
          axisLabel: { fontSize: xCfg.fontSize || 12, color: xCfg.color || '#666' },
          splitLine: { show: gridShow, lineStyle: { color: gridColor, width: gridWidth, type: gridType } },
        },
        yAxis: {
          type: 'category', data: chartData.categories,
          show: yCfg.show ?? true, name: yCfg.showTitle ? yCfg.title : '',
          axisLabel: { fontSize: yCfg.fontSize || 12, color: yCfg.color || '#666' },
        },
        series: [{
          name: component.yField || '数值', type: 'bar', data: chartData.values, barMaxWidth: 20,
          label: { show: dlCfg.show ?? false, position: 'right', fontSize: dlCfg.fontSize || 12, color: dlCfg.color || '#333' },
          itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: colorPalette[1] || '#52c41a' }, { offset: 1, color: '#95de64' }] }, borderRadius: [0, 4, 4, 0] },
        }],
      };

    case 'pie': {
      const pieData = chartData.categories.map((name, i) => ({ name, value: chartData.values[i] }));
      return {
        ...baseOption,
        series: [{
          type: 'pie', radius: '65%', center: ['50%', '52%'],
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: dlCfg.show ?? true, formatter: '{b}: {d}%', fontSize: dlCfg.fontSize || 12, color: dlCfg.color || '#333', position: dlCfg.position === 'inside' ? 'inside' : 'outside' },
          emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
          data: pieData,
        }],
        color: colorPalette,
      };
    }

    case 'doughnut': {
      const doughnutData = chartData.categories.map((name, i) => ({ name, value: chartData.values[i] }));
      return {
        ...baseOption,
        series: [{
          type: 'pie', radius: ['45%', '70%'], center: ['50%', '52%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { show: dlCfg.show ?? true, formatter: '{b}\n{d}%', fontSize: dlCfg.fontSize || 12, color: dlCfg.color || '#333' },
          labelLine: { show: true, length: 10, length2: 20 },
          data: doughnutData,
        }],
        color: colorPalette,
      };
    }

    case 'scatter': {
      const scatterData = chartData.values.map((v, i) => [i, v]);
      return {
        ...baseOption,
        xAxis: {
          type: 'value', name: xCfg.showTitle ? xCfg.title : component.xField,
          show: xCfg.show ?? true,
          axisLabel: { fontSize: xCfg.fontSize || 12, color: xCfg.color || '#666' },
          splitLine: { show: gridShow, lineStyle: { color: gridColor, width: gridWidth, type: gridType } },
        },
        yAxis: {
          type: 'value', name: yCfg.showTitle ? yCfg.title : component.yField,
          show: yCfg.show ?? true,
          axisLabel: { fontSize: yCfg.fontSize || 12, color: yCfg.color || '#666' },
          splitLine: { show: gridShow, lineStyle: { color: gridColor, width: gridWidth, type: gridType } },
        },
        series: [{
          type: 'scatter', symbolSize: 12, data: scatterData,
          label: { show: dlCfg.show ?? false, position: 'top', fontSize: dlCfg.fontSize || 12, color: dlCfg.color || '#333' },
          itemStyle: { color: { type: 'radial', x: 0.4, y: 0.3, r: 0.8, colorStops: [{ offset: 0, color: '#69c0ff' }, { offset: 1, color: colorPalette[0] }] }, shadowBlur: 10, shadowColor: 'rgba(24, 144, 255, 0.5)' },
        }],
      };
    }

    case 'area':
      return {
        ...baseOption,
        xAxis: {
          type: 'category', data: chartData.categories, boundaryGap: false,
          show: xCfg.show ?? true, name: xCfg.showTitle ? xCfg.title : '',
          axisLabel: { fontSize: xCfg.fontSize || 12, color: xCfg.color || '#666' },
        },
        yAxis: {
          type: 'value',
          show: yCfg.show ?? true, name: yCfg.showTitle ? yCfg.title : '',
          axisLabel: { fontSize: yCfg.fontSize || 12, color: yCfg.color || '#666' },
          splitLine: { show: gridShow, lineStyle: { color: gridColor, width: gridWidth, type: gridType } },
        },
        series: [{
          name: component.yField || '数值', data: chartData.values, type: 'line', smooth: true,
          lineStyle: { width: 2, color: colorPalette[4] || '#2f54eb' },
          label: { show: dlCfg.show ?? false, position: 'top', fontSize: dlCfg.fontSize || 12, color: dlCfg.color || '#333' },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(47, 84, 235, 0.5)' }, { offset: 1, color: 'rgba(47, 84, 235, 0.05)' }] } },
        }],
      };

    case 'stackedArea':
      return {
        ...baseOption,
        xAxis: {
          type: 'category', data: chartData.categories, boundaryGap: false,
          show: xCfg.show ?? true, name: xCfg.showTitle ? xCfg.title : '',
          axisLabel: { fontSize: xCfg.fontSize || 12, color: xCfg.color || '#666' },
        },
        yAxis: {
          type: 'value',
          show: yCfg.show ?? true, name: yCfg.showTitle ? yCfg.title : '',
          axisLabel: { fontSize: yCfg.fontSize || 12, color: yCfg.color || '#666' },
          splitLine: { show: gridShow, lineStyle: { color: gridColor, width: gridWidth, type: gridType } },
        },
        series: [
          { name: '产品A', type: 'line', stack: 'Total', areaStyle: { opacity: 0.8 }, smooth: true, data: chartData.values, itemStyle: { color: colorPalette[0] }, label: { show: dlCfg.show ?? false, fontSize: dlCfg.fontSize || 12 } },
          { name: '产品B', type: 'line', stack: 'Total', areaStyle: { opacity: 0.8 }, smooth: true, data: chartData.values.map(v => Math.round(v * 0.6)), itemStyle: { color: colorPalette[1] }, label: { show: dlCfg.show ?? false, fontSize: dlCfg.fontSize || 12 } },
          { name: '产品C', type: 'line', stack: 'Total', areaStyle: { opacity: 0.8 }, smooth: true, data: chartData.values.map(v => Math.round(v * 0.3)), itemStyle: { color: colorPalette[2] }, label: { show: dlCfg.show ?? false, fontSize: dlCfg.fontSize || 12 } },
        ],
      };

    case 'radar': {
      const radarIndicators = chartData.categories.map(name => ({ name, max: Math.max(...chartData.values) * 1.2 }));
      return {
        ...baseOption,
        radar: {
          indicator: radarIndicators, shape: 'polygon', splitNumber: 4,
          axisName: { color: '#666' },
          splitArea: { areaStyle: { color: ['rgba(24, 144, 255, 0.05)', 'rgba(24, 144, 255, 0.1)'] } },
        },
        series: [{
          type: 'radar',
          data: [{ value: chartData.values, name: component.yField || '数值', areaStyle: { color: 'rgba(24, 144, 255, 0.3)' }, lineStyle: { color: colorPalette[0], width: 2 }, itemStyle: { color: colorPalette[0] }, label: { show: dlCfg.show ?? false, fontSize: dlCfg.fontSize || 12, color: dlCfg.color || '#333' } }],
        }],
      };
    }

    case 'gauge': {
      const gaugeTotal = chartData.hasData ? chartData.values.reduce((a, b) => a + b, 0) : 0;
      const gaugeMax = chartData.hasData ? Math.ceil(Math.max(...chartData.values, 1) * 1.5) : 100;
      const gaugeName = component.yField || '指标';
      const gaugePercent = chartData.hasData ? Math.round((gaugeTotal / gaugeMax) * 100) : 0;

      return {
        ...baseOption,
        tooltip: { formatter: `{b}: {c} (${gaugePercent}%)` },
        series: [{
          type: 'gauge', center: ['50%', '58%'], radius: '88%', startAngle: 210, endAngle: -30,
          min: 0, max: gaugeMax,
          progress: { show: true, width: 14, roundCap: true, itemStyle: { color: colorPalette[0] } },
          axisLine: { lineStyle: { width: 14, color: [[0.3, '#f5222d'], [0.7, '#faad14'], [1, '#52c41a']] } },
          pointer: { icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z', length: '60%', width: 10, offsetCenter: [0, '-60%'], itemStyle: { color: 'auto' } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          anchor: { show: true, showAbove: true, size: 16, itemStyle: { borderWidth: 6, borderColor: colorPalette[0] } },
          title: { show: true, offsetCenter: [0, '28%'], fontSize: 14, color: '#666' },
          detail: {
            valueAnimation: true, fontSize: 28, fontWeight: 'bold', offsetCenter: [0, '50%'],
            formatter: `{value|{value}}\n{percent|${gaugePercent}%}`,
            rich: { value: { fontSize: 28, fontWeight: 'bold', color: '#333', padding: [0, 0, 4, 0] }, percent: { fontSize: 14, color: '#999' } },
          },
          data: [{ value: gaugeTotal, name: gaugeName }],
        }],
      };
    }

    case 'funnel': {
      const funnelData = chartData.hasData
        ? chartData.categories.map((name, i) => ({ name, value: chartData.values[i] || 0 }))
        : [{ value: 100, name: '访问' }, { value: 80, name: '浏览' }, { value: 60, name: '咨询' }, { value: 40, name: '下单' }, { value: 20, name: '成交' }];
      const funnelMax = chartData.hasData ? Math.max(...chartData.values) : 100;
      return {
        ...baseOption,
        series: [{
          type: 'funnel', left: '10%', top: 60, bottom: 40, width: '80%',
          min: 0, max: funnelMax, minSize: '20%', maxSize: '100%', sort: 'descending', gap: 2,
          label: { show: dlCfg.show ?? true, position: 'inside', fontWeight: 'bold', fontSize: dlCfg.fontSize || 12, color: dlCfg.color || '#fff' },
          labelLine: { show: false },
          itemStyle: { borderColor: '#fff', borderWidth: 1 },
          emphasis: { label: { fontSize: 16 } },
          data: funnelData,
        }],
        color: colorPalette,
      };
    }

    case 'treemap': {
      const treemapData = chartData.hasData
        ? chartData.categories.map((name, i) => ({ name, value: chartData.values[i] || 0 }))
        : [{ name: '华东', value: 300 }, { name: '华南', value: 200 }, { name: '华北', value: 150 }, { name: '西南', value: 120 }, { name: '西北', value: 80 }];
      return {
        ...baseOption,
        tooltip: { formatter: '{b}: {c}' },
        series: [{
          type: 'treemap', top: 40, left: '10%', right: '10%', bottom: 30, roam: false, nodeClick: false,
          breadcrumb: { show: false },
          label: { show: true, fontWeight: 'bold', color: '#fff', fontSize: (dlCfg.fontSize || 12) },
          upperLabel: { show: true, height: 24 },
          levels: [{ itemStyle: { borderWidth: 0, gapWidth: 2 } }, { itemStyle: { gapWidth: 1 } }],
          data: treemapData,
        }],
        color: colorPalette,
      };
    }

    case 'heatmap': {
      const heatCats = chartData.hasData ? chartData.categories : ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      const heatVals = chartData.hasData ? chartData.values : [1, 3, 5, 7, 9, 2, 4];
      const heatData: (string | number)[][] = [];
      for (let i = 0; i < heatCats.length; i++) { heatData.push([heatCats[i], heatCats[i], heatVals[i] || 0]); }
      const heatMax = chartData.hasData ? Math.max(...heatVals, 1) : 10;
      return {
        ...baseOption,
        grid: { ...baseOption.grid, top: '20%', bottom: '25%' },
        xAxis: { type: 'category', data: heatCats, splitArea: { show: true }, show: xCfg.show ?? true, name: xCfg.showTitle ? xCfg.title : '', axisLabel: { fontSize: xCfg.fontSize || 12, color: xCfg.color || '#666' } },
        yAxis: { type: 'category', data: heatCats, splitArea: { show: true }, show: yCfg.show ?? true, name: yCfg.showTitle ? yCfg.title : '', axisLabel: { fontSize: yCfg.fontSize || 12, color: yCfg.color || '#666' } },
        visualMap: { min: 0, max: heatMax, calculable: true, orient: 'horizontal', left: 'center', bottom: 5, inRange: { color: ['#e6f7ff', '#91d5ff', colorPalette[0], '#0050b3'] } },
        series: [{ name: component.yField || '数值', type: 'heatmap', data: heatData, label: { show: dlCfg.show ?? false, fontSize: dlCfg.fontSize || 12, color: dlCfg.color || '#333' }, emphasis: { itemStyle: { borderColor: '#333', borderWidth: 1 } } }],
      };
    }

    case 'waterfall': {
      const wfCategories = chartData.hasData ? chartData.categories : ['初始', '上涨', '下跌', '上涨', '上涨', '下跌', '最终'];
      const wfValues = chartData.hasData ? chartData.values : [100, 30, -20, 40, 20, -15, 155];
      const wfPlaceHolder: (number | string)[] = [];
      const wfIncrease: (number | string)[] = [];
      const wfDecrease: (number | string)[] = [];
      let running = wfValues[0] || 0;
      wfPlaceHolder.push(0); wfIncrease.push(wfValues[0] || 0); wfDecrease.push('-');
      for (let i = 1; i < wfValues.length - 1; i++) {
        if (wfValues[i] >= 0) {
          wfPlaceHolder.push(running); wfIncrease.push(wfValues[i]); wfDecrease.push('-'); running += wfValues[i];
        } else {
          wfPlaceHolder.push(running + wfValues[i]); wfIncrease.push('-'); wfDecrease.push(Math.abs(wfValues[i])); running += wfValues[i];
        }
      }
      wfPlaceHolder.push(0); wfIncrease.push(wfValues[wfValues.length - 1] || 0); wfDecrease.push('-');
      return {
        ...baseOption,
        xAxis: { type: 'category', data: wfCategories, show: xCfg.show ?? true, name: xCfg.showTitle ? xCfg.title : '', axisLabel: { fontSize: xCfg.fontSize || 12, color: xCfg.color || '#666' } },
        yAxis: { type: 'value', show: yCfg.show ?? true, name: yCfg.showTitle ? yCfg.title : '', axisLabel: { fontSize: yCfg.fontSize || 12, color: yCfg.color || '#666' }, splitLine: { show: gridShow, lineStyle: { color: gridColor, width: gridWidth, type: gridType } } },
        series: [
          { name: '占位', type: 'bar', stack: 'total', itemStyle: { borderColor: 'transparent', color: 'transparent' }, data: wfPlaceHolder },
          { name: '增长', type: 'bar', stack: 'total', itemStyle: { color: colorPalette[1] || '#52c41a' }, data: wfIncrease, label: { show: dlCfg.show ?? false, position: 'top', fontSize: dlCfg.fontSize || 12 } },
          { name: '下降', type: 'bar', stack: 'total', itemStyle: { color: '#f5222d' }, data: wfDecrease, label: { show: dlCfg.show ?? false, position: 'bottom', fontSize: dlCfg.fontSize || 12 } },
        ],
      };
    }

    default:
      return baseOption;
  }
}
