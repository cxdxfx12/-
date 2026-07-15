import React, { useState } from 'react';
import { Typography, Collapse, Empty, Tag, Button } from 'antd';
import {
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  DotChartOutlined,
  FontSizeOutlined,
  NumberOutlined,
  FundOutlined,
  AreaChartOutlined,
  RadarChartOutlined,
  DashboardOutlined,
  FilterOutlined,
  TableOutlined,
  BlockOutlined,
  HeatMapOutlined,
  SwapOutlined,
  PlusOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import type { DataSet, ChartType } from '../types';
import DataImportModal from './DataImportModal';
import styles from './ComponentPanel.module.css';

const { Title, Text } = Typography;

interface ComponentPanelProps {
  onAddChart: (type: ChartType, x?: number, y?: number) => void;
  onAddText: (x?: number, y?: number) => void;
  onAddCard: (x?: number, y?: number) => void;
  onAddTable: (x?: number, y?: number) => void;
  onAddImage: (x?: number, y?: number) => void;
  onAddFilter: (x?: number, y?: number) => void;
  dataSets: DataSet[];
}

interface ChartItem {
  type: ChartType;
  name: string;
  icon: React.ReactNode;
  desc: string;
  color: string;
}

const basicCharts: ChartItem[] = [
  { type: 'line', name: '折线图', icon: <LineChartOutlined />, desc: '趋势变化', color: '#1890ff' },
  { type: 'bar', name: '柱状图', icon: <BarChartOutlined />, desc: '分类比较', color: '#52c41a' },
  { type: 'pie', name: '饼图', icon: <PieChartOutlined />, desc: '占比分析', color: '#faad14' },
  { type: 'doughnut', name: '环形图', icon: <DashboardOutlined />, desc: '环形占比', color: '#722ed1' },
];

const advancedCharts: ChartItem[] = [
  { type: 'stackedBar', name: '堆叠柱状图', icon: <BlockOutlined />, desc: '堆叠对比', color: '#13c2c2' },
  { type: 'horizontalBar', name: '条形图', icon: <SwapOutlined />, desc: '横向比较', color: '#eb2f96' },
  { type: 'area', name: '面积图', icon: <AreaChartOutlined />, desc: '面积趋势', color: '#2f54eb' },
  { type: 'stackedArea', name: '堆叠面积图', icon: <FundOutlined />, desc: '堆叠面积', color: '#fa8c16' },
  { type: 'radar', name: '雷达图', icon: <RadarChartOutlined />, desc: '多维分析', color: '#a0d911' },
  { type: 'scatter', name: '散点图', icon: <DotChartOutlined />, desc: '相关性', color: '#f5222d' },
];

const otherCharts: ChartItem[] = [
  { type: 'gauge', name: '仪表盘', icon: <DashboardOutlined />, desc: '进度指标', color: '#531dab' },
  { type: 'funnel', name: '漏斗图', icon: <FilterOutlined />, desc: '转化分析', color: '#c41d7f' },
  { type: 'heatmap', name: '热力图', icon: <HeatMapOutlined />, desc: '密度分析', color: '#d46b08' },
  { type: 'waterfall', name: '瀑布图', icon: <BarChartOutlined />, desc: '增减分析', color: '#08979c' },
  { type: 'treemap', name: '树状图', icon: <TableOutlined />, desc: '层级占比', color: '#389e0d' },
];

const ComponentPanel: React.FC<ComponentPanelProps> = ({
  onAddChart,
  onAddText,
  onAddCard,
  onAddTable,
  onAddImage,
  onAddFilter,
  dataSets,
}) => {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const handleDragStart = (e: React.DragEvent, componentType: string, subType?: string) => {
    e.dataTransfer.setData('application/dataviz-component', JSON.stringify({ componentType, subType }));
    e.dataTransfer.effectAllowed = 'copy';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const renderChartCards = (charts: ChartItem[]) => (
    <div className={styles.grid}>
      {charts.map((chart) => (
        <div
          key={chart.type}
          className={styles.card}
          onDoubleClick={() => onAddChart(chart.type)}
          draggable
          onDragStart={(e) => handleDragStart(e, 'chart', chart.type)}
          onDragEnd={handleDragEnd}
          title={`双击或拖拽添加${chart.name}`}
        >
          <div className={styles.cardContent}>
            <div className={styles.icon} style={{ color: chart.color }}>{chart.icon}</div>
            <Text strong className={styles.cardName}>{chart.name}</Text>
            <Text type="secondary" className={styles.desc}>{chart.desc}</Text>
          </div>
        </div>
      ))}
    </div>
  );

  const items = [
    {
      key: 'basic',
      label: '基础图表',
      children: renderChartCards(basicCharts),
    },
    {
      key: 'advanced',
      label: '高级图表',
      children: renderChartCards(advancedCharts),
    },
    {
      key: 'other',
      label: '其他图表',
      children: renderChartCards(otherCharts),
    },
    {
      key: 'text',
      label: '文本组件',
      children: (
        <div className={styles.grid}>
          <div
            className={styles.card}
            onDoubleClick={() => onAddText()}
            draggable
            onDragStart={(e) => handleDragStart(e, 'text')}
            onDragEnd={handleDragEnd}
          >
            <div className={styles.cardContent}>
              <div className={styles.icon} style={{ color: '#13c2c2' }}><FontSizeOutlined /></div>
              <Text strong className={styles.cardName}>文本框</Text>
              <Text type="secondary" className={styles.desc}>添加说明文字</Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'kpi',
      label: 'KPI组件',
      children: (
        <div className={styles.grid}>
          <div
            className={styles.card}
            onDoubleClick={() => onAddCard()}
            draggable
            onDragStart={(e) => handleDragStart(e, 'card')}
            onDragEnd={handleDragEnd}
          >
            <div className={styles.cardContent}>
              <div className={styles.icon} style={{ color: '#eb2f96' }}><NumberOutlined /></div>
              <Text strong className={styles.cardName}>指标卡</Text>
              <Text type="secondary" className={styles.desc}>展示关键数值</Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'table',
      label: '数据表格',
      children: (
        <div className={styles.grid}>
          <div
            className={styles.card}
            onDoubleClick={() => onAddTable()}
            draggable
            onDragStart={(e) => handleDragStart(e, 'table')}
            onDragEnd={handleDragEnd}
          >
            <div className={styles.cardContent}>
              <div className={styles.icon} style={{ color: '#1677ff' }}><TableOutlined /></div>
              <Text strong className={styles.cardName}>数据表格</Text>
              <Text type="secondary" className={styles.desc}>展示明细数据</Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'image',
      label: '图片组件',
      children: (
        <div className={styles.grid}>
          <div
            className={styles.card}
            onDoubleClick={() => onAddImage()}
            draggable
            onDragStart={(e) => handleDragStart(e, 'image')}
            onDragEnd={handleDragEnd}
          >
            <div className={styles.cardContent}>
              <div className={styles.icon} style={{ color: '#fa8c16' }}><PictureOutlined /></div>
              <Text strong className={styles.cardName}>图片</Text>
              <Text type="secondary" className={styles.desc}>添加装饰图片</Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'filter',
      label: '筛选器',
      children: (
        <div className={styles.grid}>
          <div
            className={styles.card}
            onDoubleClick={() => onAddFilter()}
            draggable
            onDragStart={(e) => handleDragStart(e, 'filter')}
            onDragEnd={handleDragEnd}
          >
            <div className={styles.cardContent}>
              <div className={styles.icon} style={{ color: '#722ed1' }}><FilterOutlined /></div>
              <Text strong className={styles.cardName}>筛选器</Text>
              <Text type="secondary" className={styles.desc}>交互式数据筛选</Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'data',
      label: '数据源',
      children: (
        <div>
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() => setImportModalOpen(true)}
            style={{ marginBottom: 8 }}
          >
            添加数据
          </Button>
          {dataSets.length > 0 ? (
            <div className={styles.dataList}>
              {dataSets.map((ds) => (
                <div key={ds.id} className={styles.dataCard}>
                  <Text strong>{ds.name}</Text>
                  <div className={styles.dataInfo}>
                    <Tag>{ds.rowCount} 行</Tag>
                    <Tag>{ds.fields.length} 列</Tag>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="暂无数据，点击上方按钮添加" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={5} style={{ margin: 0 }}>组件库</Title>
        <Text type="secondary" className={styles.hint}>双击或拖拽添加</Text>
      </div>
      <Collapse defaultActiveKey={['basic']} items={items} ghost />
      <DataImportModal open={importModalOpen} onClose={() => setImportModalOpen(false)} />
    </div>
  );
};

export default ComponentPanel;