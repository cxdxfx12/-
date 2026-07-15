import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Button, Space, Empty, message } from 'antd';
import { FileAddOutlined, FolderOpenOutlined, BarChartOutlined, DollarOutlined, LineChartOutlined } from '@ant-design/icons';
import { useAppActions } from '../store';
import type { Template, Report } from '../types';
import styles from './Home.module.css';

const { Title, Text } = Typography;

// 预置模板
const defaultTemplates: Template[] = [
  {
    id: 'sales',
    name: '销售分析模板',
    category: 'sales',
    description: '包含销售趋势、区域排名、产品分析等图表',
    config: {
      title: '销售分析报告',
      pageSize: '16:9',
    },
  },
  {
    id: 'finance',
    name: '财务分析模板',
    category: 'finance',
    description: '包含收入、成本、利润、现金流分析',
    config: {
      title: '财务分析报告',
      pageSize: '16:9',
    },
  },
  {
    id: 'operation',
    name: '运营分析模板',
    category: 'operation',
    description: '包含用户增长、活跃趋势、转化分析',
    config: {
      title: '运营分析报告',
      pageSize: '16:9',
    },
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { createNewReport, loadReport } = useAppActions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 新建报告
  const handleNewReport = (template?: Template) => {
    createNewReport(template);
    navigate('/data-input');
  };

  // 打开文件选择对话框
  const handleOpenFileClick = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const report = JSON.parse(ev.target?.result as string) as Report;
        if (!report.id || !report.components) {
          message.error('无效的报告文件格式');
          return;
        }
        loadReport(report);
        message.success(`已打开报告: ${report.title || '未命名报告'}`);
        navigate('/editor');
      } catch {
        message.error('文件解析失败，请检查文件格式');
      }
    };
    reader.readAsText(file);

    // 重置 input 以便可以重复选择同一文件
    e.target.value = '';
  };

  return (
    <div className={styles.container}>
      {/* 顶部标题 */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <BarChartOutlined className={styles.logoIcon} />
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            DataViz Desktop
          </Title>
        </div>
        <Text type="secondary">数据可视化报告设计器 · 杭州喵喵至家网络有限公司</Text>
      </div>

      {/* 主内容区 */}
      <div className={styles.content}>
        {/* 新建报告区域 */}
        <div className={styles.section}>
          <Title level={4}>新建报告</Title>
          <Row gutter={[16, 16]}>
            {/* 空白报告 */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                className={styles.newCard}
                onClick={() => handleNewReport()}
              >
                <div className={styles.cardContent}>
                  <FileAddOutlined className={styles.cardIcon} />
                  <Text strong>空白报告</Text>
                  <Text type="secondary">从头开始创建</Text>
                </div>
              </Card>
            </Col>
            {/* 模板列表 */}
            {defaultTemplates.map((template) => (
              <Col key={template.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  className={styles.templateCard}
                  onClick={() => handleNewReport(template)}
                >
                  <div className={styles.cardContent}>
                    {template.category === 'sales' && <LineChartOutlined className={styles.cardIcon} />}
                    {template.category === 'finance' && <DollarOutlined className={styles.cardIcon} />}
                    {template.category === 'operation' && <BarChartOutlined className={styles.cardIcon} />}
                    <Text strong>{template.name}</Text>
                    <Text type="secondary" className={styles.cardDesc}>
                      {template.description}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 最近文件 */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Title level={4}>最近文件</Title>
            <Button 
              type="link" 
              icon={<FolderOpenOutlined />}
              onClick={handleOpenFileClick}
            >
              打开文件
            </Button>
          </div>
          
          {(() => {
            // 从 localStorage 加载已保存的报告列表
            const savedReports: Report[] = (() => {
              try {
                return JSON.parse(localStorage.getItem('dataviz_reports') || '[]');
              } catch { return []; }
            })();

            return savedReports.length === 0 ? (
              <Empty 
                description="暂无最近打开的文件" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Row gutter={[16, 16]}>
                {savedReports.slice(0, 4).map((report) => (
                  <Col key={report.id} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      hoverable
                      className={styles.recentCard}
                      onClick={() => {
                        loadReport(report);
                        navigate('/editor');
                      }}
                    >
                      <div className={styles.recentInfo}>
                        <Text strong>{report.title || '未命名报告'}</Text>
                        <Text type="secondary">{new Date(report.updatedAt).toLocaleDateString('zh-CN')}</Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            );
          })()}
        </div>

        {/* 底部信息 */}
        <div className={styles.footer}>
          <Space separator={<span className={styles.divider}>|</span>}>
            <Text type="secondary">版本: V1.0.0</Text>
            <Text type="secondary">© 2026 杭州喵喵至家网络有限公司</Text>
          </Space>
        </div>
      </div>

      {/* 隐藏的文件选择器 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.dataviz.json"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />
    </div>
  );
};

export default Home;