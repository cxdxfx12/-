import axios from 'axios';
import type { DataSet, ChartRecommendation } from '../types';

// Python后端服务地址
const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 数据解析接口
export const parseData = async (rawData: string, source: 'paste' | 'csv' | 'excel'): Promise<DataSet> => {
  const response = await apiClient.post('/data/parse', {
    rawData,
    source,
  });
  return response.data;
};

// 图表推荐接口
export const recommendChart = async (dataSetId: string): Promise<ChartRecommendation[]> => {
  const response = await apiClient.get(`/data/recommend/${dataSetId}`);
  return response.data;
};

// 生成图表配置
export const generateChartConfig = async (
  dataSetId: string,
  chartType: string,
  xAxis?: string,
  yAxis?: string
): Promise<Record<string, unknown>> => {
  const response = await apiClient.post('/chart/generate', {
    dataSetId,
    chartType,
    xAxis,
    yAxis,
  });
  return response.data;
};

// 导出PDF
export const exportPDF = async (reportId: string): Promise<Blob> => {
  const response = await apiClient.post(`/export/pdf/${reportId}`, null, {
    responseType: 'blob',
  });
  return response.data;
};

// 导出PNG
export const exportPNG = async (reportId: string): Promise<Blob> => {
  const response = await apiClient.post(`/export/png/${reportId}`, null, {
    responseType: 'blob',
  });
  return response.data;
};

// 保存报告
export const saveReport = async (report: Record<string, unknown>): Promise<{ success: boolean; path: string }> => {
  const response = await apiClient.post('/report/save', report);
  return response.data;
};

// 打开报告
export const openReport = async (filePath: string): Promise<Record<string, unknown>> => {
  const response = await apiClient.post('/report/open', { filePath });
  return response.data;
};

// 获取最近文件列表
export const getRecentFiles = async (): Promise<Array<{ id: string; name: string; path: string; lastOpened: string }>> => {
  const response = await apiClient.get('/report/recent');
  return response.data;
};

export default apiClient;