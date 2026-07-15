import React, { useState, useCallback } from 'react';
import { Modal, Input, Upload, Button, Tabs, message, Alert } from 'antd';
import { UploadOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useAppActions } from '../store';
import { parseDataLocal, parseExcelFile } from '../utils/dataParser';
import type { DataSet } from '../types';

const { TextArea } = Input;

interface DataImportModalProps {
  open: boolean;
  onClose: () => void;
}

const DataImportModal: React.FC<DataImportModalProps> = ({ open, onClose }) => {
  const { addDataSet } = useAppActions();
  const [rawData, setRawData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleData = `月份	销售额	成本	利润
1月	12000	5000	7000
2月	15000	6000	9000
3月	18000	7000	11000
4月	21000	8000	13000
5月	25000	9000	16000
6月	28000	10000	18000`;

  const handleParse = useCallback(async (source: 'paste' | 'csv' | 'excel', data?: string) => {
    setLoading(true);
    setError(null);
    try {
      const textData = data || rawData;
      if (!textData.trim()) {
        message.warning('请输入或上传数据');
        setLoading(false);
        return;
      }
      const result: DataSet = parseDataLocal(textData, source);
      addDataSet(result);
      message.success(`数据集 "${result.name}" 已添加`);
      setRawData('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据解析失败');
      message.error('数据解析失败');
    } finally {
      setLoading(false);
    }
  }, [rawData, addDataSet, onClose]);

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

        addDataSet(result);
        message.success(`文件 ${file.name} 解析成功`);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : '文件解析失败');
        message.error('文件解析失败');
      } finally {
        setLoading(false);
      }
      return false;
    },
  };

  const tabItems = [
    {
      key: 'paste',
      label: '粘贴数据',
      children: (
        <div>
          {error && <Alert message={error} type="error" closable onClose={() => setError(null)} style={{ marginBottom: 12 }} />}
          <TextArea
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            placeholder="在此粘贴CSV或TSV格式的数据，第一行为字段名..."
            rows={10}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              type="link"
              icon={<FileTextOutlined />}
              onClick={() => { setRawData(sampleData); }}
            >
              填充示例数据
            </Button>
            <Button
              type="primary"
              loading={loading}
              onClick={() => handleParse('paste')}
            >
              解析并添加
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'upload',
      label: '上传文件',
      children: (
        <div>
          {error && <Alert message={error} type="error" closable onClose={() => setError(null)} style={{ marginBottom: 12 }} />}
          <Upload.Dragger {...uploadProps} style={{ padding: 24 }}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: 16 }}>点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">支持 CSV、TSV、Excel 格式</p>
          </Upload.Dragger>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="添加数据源"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnHidden
    >
      <Tabs items={tabItems} defaultActiveKey="paste" />
    </Modal>
  );
};

export default DataImportModal;