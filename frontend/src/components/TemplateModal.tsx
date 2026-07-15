import React from 'react';
import { Modal, Card, Row, Col, Typography, Tag, message } from 'antd';
import {
  RiseOutlined,
  MoneyCollectOutlined,
  TeamOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  ProjectOutlined,
  IdcardOutlined,
  AimOutlined,
  UserSwitchOutlined,
  TruckOutlined,
  LikeOutlined,
} from '@ant-design/icons';
import { useAppActions } from '../store';
import type { Component, Report, ReportPage } from '../types';
import styles from './TemplateModal.module.css';

const { Text } = Typography;

interface TemplateModalProps {
  open: boolean;
  onClose: () => void;
}

interface TemplateItem {
  key: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  category: string;
  color: string;
  generateReport: () => Report;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const makeComponents = (pageId: string, comps: Partial<Component>[]): Component[] =>
  comps.map((c) => ({
    id: generateId(),
    pageId,
    type: 'chart',
    chartType: 'bar',
    title: '',
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    config: {},
    ...c,
  })) as Component[];

/** 创建多页模板的辅助函数 */
const makeMultiPage = (
  title: string,
  pageDefs: { name: string; components: Partial<Component>[] }[]
): Report => {
  const pages: ReportPage[] = [];
  const allComponents: Component[] = [];

  pageDefs.forEach((def) => {
    const pageId = generateId();
    pages.push({ id: pageId, name: def.name });
    allComponents.push(...makeComponents(pageId, def.components));
  });

  return {
    id: generateId(),
    title,
    pageSize: '16:9',
    pages,
    components: allComponents,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/** 创建单页模板的辅助函数 */
const makeSinglePage = (
  title: string,
  pageName: string,
  comps: Partial<Component>[]
): Report => {
  const pageId = generateId();
  return {
    id: generateId(),
    title,
    pageSize: '16:9',
    pages: [{ id: pageId, name: pageName }],
    components: makeComponents(pageId, comps),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/** KPI 卡片快捷生成 */
const kpi = (
  title: string, value: string, trend: 'up' | 'down' | 'flat',
  trendValue: string, x: number
): Partial<Component> => ({
  type: 'card', title, value, trend, trendValue,
  x, y: 40, width: 200, height: 140,
});

/** 4 个 KPI 卡片一行 */
const kpiRow = (cards: [string, string, 'up' | 'down' | 'flat', string][]) =>
  cards.map(([t, v, tr, tv], i) => kpi(t, v, tr, tv, 60 + i * 220));

const TemplateModal: React.FC<TemplateModalProps> = ({ open, onClose }) => {
  const { createNewReport } = useAppActions();

  const templates: TemplateItem[] = [
    // ============ 销售分析看板（3 页） ============
    {
      key: 'sales',
      name: '销售分析看板',
      icon: <RiseOutlined />,
      description: '销售额、利润率、区域分布等核心销售指标，含区域和产品明细页',
      category: 'sales',
      color: '#1890ff',
      generateReport: () => makeMultiPage('销售分析看板', [
        {
          name: '总览',
          components: [
            ...kpiRow([['总销售额', '¥12.8M', 'up', '+12.5%'], ['订单数', '3,456', 'up', '+8.3%'], ['客单价', '¥3,700', 'down', '-2.1%'], ['毛利率', '42.5%', 'up', '+3.8%']]),
            { type: 'chart', chartType: 'line', title: '月度销售趋势', x: 60, y: 210, width: 900, height: 380 },
            { type: 'chart', chartType: 'bar', title: '各区域销售额', x: 1000, y: 210, width: 860, height: 380 },
            { type: 'chart', chartType: 'pie', title: '产品类别占比', x: 60, y: 620, width: 550, height: 420 },
            { type: 'chart', chartType: 'bar', title: 'Top 10 产品', x: 650, y: 620, width: 600, height: 420 },
          ],
        },
        {
          name: '区域分析',
          components: [
            ...kpiRow([['华东区', '¥4.5M', 'up', '+15.2%'], ['华南区', '¥3.2M', 'up', '+10.8%'], ['华北区', '¥2.8M', 'flat', '+2.1%'], ['西南区', '¥2.3M', 'down', '-3.5%']]),
            { type: 'chart', chartType: 'bar', title: '区域分布', x: 60, y: 210, width: 900, height: 400 },
            { type: 'chart', chartType: 'treemap', title: '区域-品类交叉', x: 1000, y: 210, width: 860, height: 400 },
            { type: 'chart', chartType: 'stackedBar', title: '区域月度对比', x: 60, y: 640, width: 1200, height: 400 },
            { type: 'chart', chartType: 'gauge', title: '区域达标率', x: 1300, y: 640, width: 560, height: 400 },
          ],
        },
        {
          name: '产品分析',
          components: [
            ...kpiRow([['SKU 总数', '1,280', 'up', '+45'], ['新品占比', '28%', 'up', '+5%'], ['动销率', '76%', 'down', '-3%'], ['退货率', '2.1%', 'flat', '-0.1%']]),
            { type: 'chart', chartType: 'bar', title: '产品销量排名', x: 60, y: 210, width: 600, height: 380 },
            { type: 'chart', chartType: 'scatter', title: '价格 vs 销量', x: 700, y: 210, width: 600, height: 380 },
            { type: 'chart', chartType: 'heatmap', title: '产品-月份热力', x: 60, y: 620, width: 800, height: 420 },
            { type: 'chart', chartType: 'funnel', title: '产品转化漏斗', x: 900, y: 620, width: 400, height: 420 },
          ],
        },
      ]),
    },
    // ============ 财务报表（2 页） ============
    {
      key: 'finance',
      name: '财务报表',
      icon: <MoneyCollectOutlined />,
      description: '收入、支出、利润、现金流等财务指标，含利润和现金流明细',
      category: 'finance',
      color: '#52c41a',
      generateReport: () => makeMultiPage('财务报表', [
        {
          name: '财务总览',
          components: [
            ...kpiRow([['总收入', '¥45.6M', 'up', '+15.2%'], ['净利润', '¥8.2M', 'up', '+22.1%'], ['毛利率', '42.5%', 'up', '+3.2%'], ['现金流', '¥5.1M', 'flat', '持平']]),
            { type: 'chart', chartType: 'waterfall', title: '利润瀑布图', x: 60, y: 210, width: 800, height: 380 },
            { type: 'chart', chartType: 'pie', title: '支出结构', x: 900, y: 210, width: 500, height: 380 },
            { type: 'chart', chartType: 'stackedBar', title: '季度收支对比', x: 60, y: 620, width: 900, height: 420 },
            { type: 'chart', chartType: 'gauge', title: '预算完成率', x: 1000, y: 620, width: 400, height: 420 },
          ],
        },
        {
          name: '利润与现金流',
          components: [
            ...kpiRow([['营业利润', '¥12.3M', 'up', '+18.5%'], ['净利润率', '18.2%', 'up', '+2.1%'], ['经营现金流', '¥6.8M', 'up', '+25%'], ['自由现金流', '¥4.2M', 'up', '+30%']]),
            { type: 'chart', chartType: 'line', title: '月度利润趋势', x: 60, y: 210, width: 900, height: 380 },
            { type: 'chart', chartType: 'bar', title: '各部门费用', x: 1000, y: 210, width: 860, height: 380 },
            { type: 'chart', chartType: 'area', title: '现金流预测', x: 60, y: 620, width: 900, height: 420 },
            { type: 'chart', chartType: 'doughnut', title: '成本结构', x: 1000, y: 620, width: 400, height: 420 },
          ],
        },
      ]),
    },
    // ============ 运营分析 ============
    {
      key: 'operation',
      name: '运营分析',
      icon: <TeamOutlined />,
      description: '用户增长、留存率、活跃度等运营指标',
      category: 'operation',
      color: '#722ed1',
      generateReport: () => makeSinglePage('运营分析看板', '运营总览', [
          ...kpiRow([['DAU', '128K', 'up', '+5.3%'], ['新增用户', '3.2K', 'up', '+12.8%'], ['留存率', '68%', 'down', '-2.5%'], ['活跃时长', '42min', 'up', '+8%']]),
          { type: 'chart', chartType: 'area', title: '用户增长趋势', x: 60, y: 210, width: 900, height: 380 },
          { type: 'chart', chartType: 'funnel', title: '转化漏斗', x: 1000, y: 210, width: 400, height: 380 },
          { type: 'chart', chartType: 'heatmap', title: '用户活跃时段', x: 60, y: 620, width: 700, height: 420 },
          { type: 'chart', chartType: 'radar', title: '用户画像', x: 800, y: 620, width: 500, height: 420 },
        ]),
    },
    // ============ 电商看板 ============
    {
      key: 'ecommerce',
      name: '电商看板',
      icon: <ShoppingCartOutlined />,
      description: 'GMV、转化率、客单价、复购率等电商核心指标',
      category: 'sales',
      color: '#eb2f96',
      generateReport: () => makeSinglePage('电商运营看板', '电商总览', [
          ...kpiRow([['GMV', '¥56.8M', 'up', '+18.2%'], ['订单量', '12.5K', 'up', '+8.5%'], ['转化率', '3.8%', 'up', '+0.5%'], ['复购率', '42%', 'down', '-1.2%']]),
          { type: 'chart', chartType: 'line', title: 'GMV 趋势', x: 60, y: 210, width: 900, height: 380 },
          { type: 'chart', chartType: 'treemap', title: '品类销售分布', x: 1000, y: 210, width: 500, height: 380 },
          { type: 'chart', chartType: 'bar', title: '渠道对比', x: 60, y: 620, width: 900, height: 420 },
          { type: 'chart', chartType: 'scatter', title: '客单价 vs 购买频次', x: 1000, y: 620, width: 500, height: 420 },
        ]),
    },
    // ============ 项目管理 ============
    {
      key: 'project',
      name: '项目管理',
      icon: <ProjectOutlined />,
      description: '任务进度、工时统计、里程碑追踪',
      category: 'custom',
      color: '#fa8c16',
      generateReport: () => makeSinglePage('项目管理看板', '项目总览', [
          ...kpiRow([['项目总数', '24', 'up', '+3'], ['完成率', '78%', 'up', '+5%'], ['总工时', '3,200h', 'flat', '持平'], ['延期率', '12%', 'down', '-4%']]),
          { type: 'chart', chartType: 'horizontalBar', title: '项目进度', x: 60, y: 210, width: 600, height: 380 },
          { type: 'chart', chartType: 'doughnut', title: '状态分布', x: 700, y: 210, width: 500, height: 380 },
          { type: 'chart', chartType: 'stackedBar', title: '月度工时统计', x: 60, y: 620, width: 900, height: 420 },
          { type: 'chart', chartType: 'gauge', title: 'Sprint 进度', x: 1000, y: 620, width: 400, height: 420 },
        ]),
    },
    // ============ 新增：人力资源看板 ============
    {
      key: 'hr',
      name: '人力资源看板',
      icon: <IdcardOutlined />,
      description: '员工结构、招聘进度、离职率、培训覆盖率',
      category: 'operation',
      color: '#13c2c2',
      generateReport: () => makeSinglePage('人力资源看板', 'HR 总览', [
          ...kpiRow([['员工总数', '1,280', 'up', '+5.2%'], ['招聘中', '48', 'down', '-12'], ['离职率', '3.2%', 'down', '-0.8%'], ['平均工龄', '3.5年', 'flat', '持平']]),
          { type: 'chart', chartType: 'bar', title: '各部门人员分布', x: 60, y: 210, width: 600, height: 380 },
          { type: 'chart', chartType: 'pie', title: '学历结构', x: 700, y: 210, width: 500, height: 380 },
          { type: 'chart', chartType: 'line', title: '月度入职/离职趋势', x: 60, y: 620, width: 900, height: 420 },
          { type: 'chart', chartType: 'radar', title: '部门能力评估', x: 1000, y: 620, width: 500, height: 420 },
        ]),
    },
    // ============ 新增：市场营销看板 ============
    {
      key: 'marketing',
      name: '市场营销看板',
      icon: <AimOutlined />,
      description: '广告投放、ROI、线索转化、渠道效果',
      category: 'sales',
      color: '#2f54eb',
      generateReport: () => makeSinglePage('市场营销看板', '营销总览', [
          ...kpiRow([['广告花费', '¥2.8M', 'up', '+8.5%'], ['ROI', '3.8x', 'up', '+0.5'], ['线索数', '5,600', 'up', '+15%'], ['MQL 转化', '22%', 'up', '+3%']]),
          { type: 'chart', chartType: 'line', title: '广告投放趋势', x: 60, y: 210, width: 900, height: 380 },
          { type: 'chart', chartType: 'bar', title: '各渠道 ROI 对比', x: 1000, y: 210, width: 860, height: 380 },
          { type: 'chart', chartType: 'funnel', title: '营销转化漏斗', x: 60, y: 620, width: 450, height: 420 },
          { type: 'chart', chartType: 'stackedBar', title: '渠道月度花费', x: 550, y: 620, width: 700, height: 420 },
          { type: 'chart', chartType: 'gauge', title: '预算利用率', x: 1300, y: 620, width: 560, height: 420 },
        ]),
    },
    // ============ 新增：客户分析看板 ============
    {
      key: 'customer',
      name: '客户分析看板',
      icon: <UserSwitchOutlined />,
      description: 'RFM分析、客户分层、生命周期价值',
      category: 'operation',
      color: '#fa541c',
      generateReport: () => makeSinglePage('客户分析看板', '客户总览', [
          ...kpiRow([['总客户数', '86K', 'up', '+12%'], ['活跃客户', '42K', 'up', '+8%'], ['流失率', '5.2%', 'down', '-1.1%'], ['CLV', '¥3,200', 'up', '+5.5%']]),
          { type: 'chart', chartType: 'line', title: '客户增长趋势', x: 60, y: 210, width: 900, height: 380 },
          { type: 'chart', chartType: 'pie', title: '客户分层 (RFM)', x: 1000, y: 210, width: 500, height: 380 },
          { type: 'chart', chartType: 'scatter', title: '消费频次 vs 金额', x: 60, y: 620, width: 700, height: 420 },
          { type: 'chart', chartType: 'bar', title: '各渠道获客成本', x: 800, y: 620, width: 600, height: 420 },
        ]),
    },
    // ============ 新增：供应链看板 ============
    {
      key: 'supply',
      name: '供应链看板',
      icon: <TruckOutlined />,
      description: '库存周转、订单履约、采购成本、物流时效',
      category: 'custom',
      color: '#a0d911',
      generateReport: () => makeSinglePage('供应链看板', '供应链总览', [
          ...kpiRow([['库存周转', '8.5天', 'up', '+0.3'], ['订单准时率', '96.2%', 'up', '+1.5%'], ['采购成本', '¥15.2M', 'down', '-3%'], ['物流时效', '2.8天', 'down', '-0.5']]),
          { type: 'chart', chartType: 'line', title: '库存周转趋势', x: 60, y: 210, width: 900, height: 380 },
          { type: 'chart', chartType: 'bar', title: '供应商评分', x: 1000, y: 210, width: 860, height: 380 },
          { type: 'chart', chartType: 'heatmap', title: '仓储-品类热力', x: 60, y: 620, width: 700, height: 420 },
          { type: 'chart', chartType: 'gauge', title: '履约率', x: 800, y: 620, width: 400, height: 420 },
        ]),
    },
    // ============ 新增：社交媒体看板 ============
    {
      key: 'social',
      name: '社交媒体看板',
      icon: <LikeOutlined />,
      description: '粉丝增长、互动率、内容效果、平台对比',
      category: 'custom',
      color: '#f759ab',
      generateReport: () => makeSinglePage('社交媒体看板', '社媒总览', [
          ...kpiRow([['总粉丝数', '2.8M', 'up', '+8.5%'], ['互动率', '4.2%', 'up', '+0.8%'], ['发帖量', '320', 'up', '+15'], ['平均互动', '3.2K', 'flat', '持平']]),
          { type: 'chart', chartType: 'line', title: '粉丝增长趋势', x: 60, y: 210, width: 900, height: 380 },
          { type: 'chart', chartType: 'bar', title: '各平台互动对比', x: 1000, y: 210, width: 860, height: 380 },
          { type: 'chart', chartType: 'pie', title: '内容类型分布', x: 60, y: 620, width: 550, height: 420 },
          { type: 'chart', chartType: 'radar', title: '平台影响力评估', x: 650, y: 620, width: 500, height: 420 },
        ]),
    },
    // ============ 空白画布 ============
    {
      key: 'blank',
      name: '空白画布',
      icon: <DashboardOutlined />,
      description: '从零开始创建你的自定义报告',
      category: 'custom',
      color: '#8c8c8c',
      generateReport: () => makeSinglePage('未命名报告', '第1页', []),
    },
  ];

  const handleSelect = (template: TemplateItem) => {
    const report = template.generateReport();
    createNewReport({ id: '', name: '', category: 'custom', description: '', config: report });
    message.success(`已创建: ${template.name}`);
    onClose();
  };

  const categoryLabel: Record<string, string> = {
    sales: '销售',
    finance: '财务',
    operation: '运营',
    custom: '自定义',
  };

  return (
    <Modal
      title="选择报告模板"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        选择一个模板快速开始，或使用空白画布创建自定义报告。多页模板点击后自动创建多个页面。
      </Text>
      <Row gutter={[16, 16]}>
        {templates.map((tpl) => (
          <Col span={8} key={tpl.key}>
            <Card
              hoverable
              className={styles.templateCard}
              onClick={() => handleSelect(tpl)}
              cover={
                <div className={styles.templateCover} style={{ background: `linear-gradient(135deg, ${tpl.color}22, ${tpl.color}44)` }}>
                  <div className={styles.templateIcon} style={{ color: tpl.color }}>
                    {tpl.icon}
                  </div>
                </div>
              }
            >
              <Card.Meta
                title={
                  <span>
                    {tpl.name}
                    <Tag color={tpl.color} style={{ marginLeft: 8, fontSize: 10 }}>
                      {categoryLabel[tpl.category] || tpl.category}
                    </Tag>
                  </span>
                }
                description={tpl.description}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </Modal>
  );
};

export default TemplateModal;