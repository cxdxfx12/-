import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Input, Upload, message, Table, Tag, Space, Alert, Spin } from 'antd';
import { FileExcelOutlined, RightOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useAppStore, useAppActions } from '../store';
import { parseDataLocal, parseExcelFile, recommendChartLocal } from '../utils/dataParser';
import type { DataSet, ChartRecommendation } from '../types';
import styles from './DataInput.module.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const DataInput: React.FC = () => {
  const navigate = useNavigate();
  const { currentReport } = useAppStore();
  const { addDataSet } = useAppActions();
  
  const [rawData, setRawData] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<DataSet | null>(null);
  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 解析数据
  const handleParseData = useCallback(async (source: 'paste' | 'csv' | 'excel', data?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const textData = data || rawData;
      if (!textData.trim()) {
        message.warning('请输入或上传数据');
        setLoading(false);
        return;
      }
      
      // 使用本地解析器，不依赖后端
      const result = parseDataLocal(textData, source);
      setParsedData(result);
      
      // 推荐图表
      const recs = recommendChartLocal(result.fields);
      setRecommendations(recs);
      
      message.success('数据解析成功');
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据解析失败');
      message.error('数据解析失败');
    } finally {
      setLoading(false);
    }
  }, [rawData]);

  // 确认数据并继续
  const handleConfirm = () => {
    if (parsedData) {
      addDataSet(parsedData);
      message.success('数据已添加');
      navigate('/editor');
    }
  };

  // 文件上传配置
  const uploadProps: UploadProps = {
    accept: '.csv,.xlsx,.xls,.tsv',
    showUploadList: false,
    beforeUpload: async (file) => {
      setLoading(true);
      setError(null);
      
      try {
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        let result: DataSet;

        if (isExcel) {
          result = await parseExcelFile(file);
        } else {
          const text = await file.text();
          const source = file.name.endsWith('.csv') || file.name.endsWith('.tsv') ? 'csv' : 'excel';
          result = parseDataLocal(text, source);
        }

        setParsedData(result);
        const recs = recommendChartLocal(result.fields);
        setRecommendations(recs);
        message.success(`文件 ${file.name} 解析成功`);
      } catch (err) {
        setError(err instanceof Error ? err.message : '文件解析失败');
        message.error('文件解析失败');
      } finally {
        setLoading(false);
      }
      
      return false;
    },
  };

  // 示例数据
  const sampleData = `月份	销售额	成本	利润
1月	12000	5000	7000
2月	15000	6000	9000
3月	18000	7000	11000
4月	21000	8000	13000
5月	25000	9000	16000
6月	28000	10000	18000`;

  // 字段类型颜色映射
  const fieldTypeColors: Record<string, string> = {
    number: 'blue',
    string: 'green',
    date: 'orange',
    percentage: 'purple',
    category: 'cyan',
  };

  // 字段类型中文名
  const fieldTypeNames: Record<string, string> = {
    number: '数值',
    string: '文本',
    date: '日期',
    percentage: '百分比',
    category: '分类',
  };

  return (
    <div className={styles.container}>
      {/* 顶部导航 */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <Title level={4} style={{ margin: 0 }}>
            数据输入
          </Title>
          {currentReport && (
            <Tag color="blue">{currentReport.title}</Tag>
          )}
        </div>
        <Space>
          <Button onClick={() => navigate('/')}>返回首页</Button>
          <Button 
            type="primary" 
            icon={<RightOutlined />}
            onClick={handleConfirm}
            disabled={!parsedData}
          >
            开始制作报告
          </Button>
        </Space>
      </div>

      <div className={styles.content}>
        {/* 数据输入区 */}
        <Card 
          title="数据输入" 
          className={styles.inputCard}
          extra={
            <Space>
              <Upload {...uploadProps}>
                <Button icon={<FileExcelOutlined />}>导入Excel/CSV</Button>
              </Upload>
              <Button 
                onClick={() => {
                  setRawData(sampleData);
                  handleParseData('paste', sampleData);
                }}
              >
                使用示例数据
              </Button>
            </Space>
          }
        >
          <Alert
            title="支持的格式"
            description="可以从Excel复制数据、粘贴CSV/TSV格式，或直接输入制表符分隔的数据"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <TextArea
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            placeholder="粘贴数据到此处...&#10;&#10;示例格式:&#10;月份	销售额	成本&#10;1月	12000	5000&#10;2月	15000	6000"
            className={styles.textArea}
            rows={10}
          />
          
          <div className={styles.buttonArea}>
            <Button 
              type="primary" 
              onClick={() => handleParseData('paste')}
              loading={loading}
            >
              解析数据
            </Button>
          </div>
        </Card>

        {/* 解析结果 */}
        {loading && (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
            <Text>正在解析数据...</Text>
          </div>
        )}
        
        {error && (
          <Alert
            title="解析错误"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginTop: 16 }}
          />
        )}
        
        {parsedData && !loading && (
          <Card title="数据解析结果" className={styles.resultCard}>
            <div className={styles.resultInfo}>
              <Space size="large">
                <Text><strong>数据集名称:</strong> {parsedData.name}</Text>
                <Text><strong>行数:</strong> {parsedData.rowCount}</Text>
                <Text><strong>字段数:</strong> {parsedData.fields.length}</Text>
                <Text><strong>数据来源:</strong> {
                  parsedData.source === 'paste' ? '粘贴数据' :
                  parsedData.source === 'csv' ? 'CSV文件' : 'Excel文件'
                }</Text>
              </Space>
            </div>
            
            <Title level={5} style={{ marginTop: 24 }}>字段分析</Title>
            <Table
              dataSource={parsedData.fields}
              rowKey="name"
              pagination={false}
              size="small"
              columns={[
                {
                  title: '字段名',
                  dataIndex: 'name',
                  key: 'name',
                  width: 150,
                },
                {
                  title: '类型',
                  dataIndex: 'type',
                  key: 'type',
                  width: 100,
                  render: (type: string) => (
                    <Tag color={fieldTypeColors[type]}>
                      {fieldTypeNames[type]}
                    </Tag>
                  ),
                },
                {
                  title: '示例值',
                  dataIndex: 'sampleValues',
                  key: 'sampleValues',
                  render: (values: (string | number)[]) => (
                    <Text type="secondary">
                      {values?.slice(0, 3).join(', ')}
                    </Text>
                  ),
                },
                {
                  title: '空值数',
                  dataIndex: 'nullCount',
                  key: 'nullCount',
                  width: 100,
                  render: (count: number) => count > 0 ? (
                    <Tag color="red">{count}</Tag>
                  ) : (
                    <Tag color="green">0</Tag>
                  ),
                },
                {
                  title: '唯一值数',
                  dataIndex: 'uniqueCount',
                  key: 'uniqueCount',
                  width: 100,
                },
              ]}
            />
            
            <Title level={5} style={{ marginTop: 24 }}>数据预览</Title>
            <Table
              dataSource={parsedData.data.slice(0, 10)}
              rowKey={(_, index) => `row-${index}`}
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
              columns={parsedData.fields.map((field) => ({
                title: field.name,
                dataIndex: field.name,
                key: field.name,
                width: 120,
                ellipsis: true,
              }))}
            />
            
            {parsedData.rowCount > 10 && (
              <Text type="secondary" style={{ marginTop: 8 }}>
                仅显示前10行，共 {parsedData.rowCount} 行数据
              </Text>
            )}
            
            {recommendations.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 24 }}>图表推荐</Title>
                <div className={styles.recommendations}>
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className={styles.recItem}>
                      <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                        {rec.chartType === 'line' ? '折线图' :
                         rec.chartType === 'bar' ? '柱状图' :
                         rec.chartType === 'pie' ? '饼图' : '散点图'}
                      </Tag>
                      <Text type="secondary">{rec.reason}</Text>
                      <Tag color="green">置信度 {Math.round(rec.confidence * 100)}%</Tag>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default DataInput;