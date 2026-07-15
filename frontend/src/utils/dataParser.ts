/**
 * 前端本地数据解析器
 * 不依赖Python后端，纯前端实现数据解析和字段识别
 */
import type { DataSet, DataField, FieldType, ChartType, ChartRecommendation } from '../types';
import * as XLSX from 'xlsx';

// 生成唯一ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * 检测字段类型
 */
function detectFieldType(values: string[]): FieldType {
  const nonEmpty = values.filter((v) => v.trim() !== '');
  if (nonEmpty.length === 0) return 'string';

  // 检测是否为数值
  const numericCount = nonEmpty.filter((v) => {
    const num = Number(v.replace(/[%,¥￥$]/g, ''));
    return !isNaN(num) && isFinite(num);
  }).length;

  if (numericCount / nonEmpty.length > 0.8) {
    // 检测是否为百分比
    const percentCount = nonEmpty.filter((v) => /%$/.test(v.trim())).length;
    if (percentCount / nonEmpty.length > 0.5) {
      return 'percentage';
    }

    // 检测是否为日期 (先排除纯数值)
    const datePatterns = [
      /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/, // 2024-01-01
      /^\d{4}年\d{1,2}月\d{1,2}日?$/, // 2024年1月1日
      /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/, // 01-01-2024
    ];
    const dateCount = nonEmpty.filter((v) =>
      datePatterns.some((p) => p.test(v.trim()))
    ).length;

    if (dateCount / nonEmpty.length > 0.5) {
      return 'date';
    }

    return 'number';
  }

  // 检测是否为日期格式
  const datePatterns = [
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/,
    /^\d{4}年\d{1,2}月$/,
    /^\d{4}年\d{1,2}月\d{1,2}日?$/,
    /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/,
    /^\d{1,2}月$/,
    /^[Qq]\d$/,  // Q1, Q2
    /^\d{4}[Qq]\d$/, // 2024Q1
  ];
  const dateCount = nonEmpty.filter((v) =>
    datePatterns.some((p) => p.test(v.trim()))
  ).length;
  if (dateCount / nonEmpty.length > 0.5) {
    return 'date';
  }

  // 检测是否为分类字段（唯一值较少）
  const uniqueValues = new Set(nonEmpty);
  if (uniqueValues.size <= 10 || uniqueValues.size / nonEmpty.length < 0.3) {
    return 'category';
  }

  return 'string';
}

/**
 * 清理数值字符串
 */
function cleanNumericValue(value: string): number {
  return Number(value.replace(/[%,¥￥$\s]/g, ''));
}

/**
 * 解析文本数据
 */
export function parseDataLocal(rawData: string, source: 'paste' | 'csv' | 'excel'): DataSet {
  const lines = rawData.trim().split(/\r?\n/).filter((line) => line.trim() !== '');

  if (lines.length < 2) {
    throw new Error('数据至少需要包含表头和一行数据');
  }

  // 检测分隔符
  const firstLine = lines[0];
  let separator = '\t';
  if (firstLine.includes('\t')) {
    separator = '\t';
  } else if (firstLine.includes(',')) {
    separator = ',';
  } else if (firstLine.includes(';')) {
    separator = ';';
  } else if (firstLine.includes('  ')) {
    separator = '  '; // 两个空格
  }

  // 解析表头
  const headers = firstLine.split(separator).map((h) => h.trim());

  // 解析数据行
  const dataRows: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map((v) => v.trim());
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;

    const row: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    dataRows.push(row);
  }

  // 分析每个字段
  const fields: DataField[] = headers.map((header) => {
    const columnValues = dataRows.map((row) => String(row[header] || ''));
    const fieldType = detectFieldType(columnValues);

    // 提取示例值
    const sampleValues = columnValues
      .filter((v) => v.trim() !== '')
      .slice(0, 3);

    // 统计空值数
    const nullCount = columnValues.filter((v) => v.trim() === '').length;

    // 统计唯一值数
    const uniqueCount = new Set(columnValues.filter((v) => v.trim() !== '')).size;

    return {
      name: header,
      type: fieldType,
      sampleValues,
      nullCount,
      uniqueCount,
    };
  });

  // 生成数据集名称
  const now = new Date();
  const datasetName = `数据集_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

  return {
    id: generateId(),
    name: datasetName,
    fields,
    data: dataRows,
    rowCount: dataRows.length,
    source,
  };
}

/**
 * 解析 Excel 文件（.xlsx / .xls）
 * 使用 SheetJS 库在前端解析二进制 Excel 数据
 */
export async function parseExcelFile(file: File): Promise<DataSet> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // 取第一个工作表
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel 文件中没有找到工作表');
  }

  const worksheet = workbook.Sheets[sheetName];

  // 转换为二维数组，header: 1 表示第一行作为表头
  const jsonData = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 });

  if (jsonData.length < 2) {
    throw new Error('数据至少需要包含表头和一行数据');
  }

  // 过滤空行
  const rows = jsonData.filter((row) => row.some((cell) => cell !== undefined && cell !== null && String(cell).trim() !== ''));

  // 第一行是表头
  const headers = (rows[0] || []).map((h) => String(h ?? '').trim());

  // 数据行
  const dataRows: Record<string, unknown>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      row[header] = rows[i]?.[idx] ?? '';
    });
    dataRows.push(row);
  }

  // 分析字段
  const fields: DataField[] = headers.map((header) => {
    const columnValues = dataRows.map((row) => String(row[header] || ''));
    const fieldType = detectFieldType(columnValues);
    const sampleValues = columnValues.filter((v) => v.trim() !== '').slice(0, 3);
    const nullCount = columnValues.filter((v) => v.trim() === '').length;
    const uniqueCount = new Set(columnValues.filter((v) => v.trim() !== '')).size;

    return { name: header, type: fieldType, sampleValues, nullCount, uniqueCount };
  });

  const now = new Date();
  const datasetName = `数据集_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

  return {
    id: generateId(),
    name: datasetName,
    fields,
    data: dataRows,
    rowCount: dataRows.length,
    source: 'excel',
  };
}

/**
 * 根据字段推荐图表类型
 */
export function recommendChartLocal(fields: DataField[]): ChartRecommendation[] {
  const recommendations: ChartRecommendation[] = [];

  const numberFields = fields.filter((f) => f.type === 'number' || f.type === 'percentage');
  const categoryFields = fields.filter((f) => f.type === 'category' || f.type === 'string');
  const dateFields = fields.filter((f) => f.type === 'date');

  // 日期 + 数值 → 折线图
  if (dateFields.length > 0 && numberFields.length > 0) {
    recommendations.push({
      chartType: 'line',
      confidence: 0.9,
      xAxis: dateFields[0].name,
      yAxis: numberFields[0].name,
      reason: '日期字段适合展示趋势变化，推荐使用折线图',
    });
  }

  // 分类 + 数值 → 柱状图
  if (categoryFields.length > 0 && numberFields.length > 0) {
    recommendations.push({
      chartType: 'bar',
      confidence: 0.85,
      xAxis: categoryFields[0].name,
      yAxis: numberFields[0].name,
      reason: '分类字段适合做对比分析，推荐使用柱状图',
    });
  }

  // 分类 + 百分比/数值 → 饼图
  if (categoryFields.length > 0 && numberFields.length > 0) {
    recommendations.push({
      chartType: 'pie',
      confidence: 0.8,
      xAxis: categoryFields[0].name,
      yAxis: numberFields[0].name,
      reason: '分类数据适合展示比例分布，推荐使用饼图',
    });
  }

  // 多个数值字段 → 散点图
  if (numberFields.length >= 2) {
    recommendations.push({
      chartType: 'scatter',
      confidence: 0.75,
      xAxis: numberFields[0].name,
      yAxis: numberFields[1].name,
      reason: '两个数值字段适合展示相关性，推荐使用散点图',
    });
  }

  return recommendations;
}

/**
 * 从数据集中提取图表数据
 */
export function extractChartData(
  dataSet: DataSet,
  _chartType: ChartType,
  xAxis?: string,
  yAxis?: string
): { categories: string[]; series: { name: string; data: number[] }[] } {
  const { fields, data } = dataSet;

  // 自动选择字段
  const categoryField = xAxis || fields.find((f) => f.type === 'category' || f.type === 'date' || f.type === 'string')?.name;
  const numberFields = yAxis
    ? [yAxis]
    : fields.filter((f) => f.type === 'number' || f.type === 'percentage').map((f) => f.name);

  if (!categoryField || numberFields.length === 0) {
    return { categories: [], series: [] };
  }

  const categories = data.map((row) => String(row[categoryField] || ''));
  const series = numberFields.map((fieldName) => ({
    name: fieldName,
    data: data.map((row) => {
      const val = row[fieldName];
      if (typeof val === 'number') return val;
      return cleanNumericValue(String(val || '0'));
    }),
  }));

  return { categories, series };
}