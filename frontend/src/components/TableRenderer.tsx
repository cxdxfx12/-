import React from 'react';
import { Table } from 'antd';
import type { TableComponent } from '../types';
import { useAppStore } from '../store';

interface TableRendererProps {
  component: TableComponent;
}

const TableRenderer: React.FC<TableRendererProps> = ({ component }) => {
  const dataSets = useAppStore((state) => state.dataSets);
  const dataVersion = useAppStore((state) => state.dataVersion);

  const dataSet = component.dataSetId
    ? dataSets.find((ds) => ds.id === component.dataSetId)
    : null;

  const hasData = dataSet && dataSet.data.length > 0;

  // 确定列：优先使用组件配置的列，否则使用数据集字段
  const columnNames = component.columns.length > 0
    ? component.columns
    : (dataSet ? dataSet.fields.map((f) => f.name) : []);

  const columns = columnNames.map((col) => ({
    title: col,
    dataIndex: col,
    key: col,
    ellipsis: true,
    ...(hasData ? {
      sorter: (a: Record<string, unknown>, b: Record<string, unknown>) => {
        const va = a[col];
        const vb = b[col];
        if (typeof va === 'number' && typeof vb === 'number') return va - vb;
        return String(va || '').localeCompare(String(vb || ''));
      },
    } : {}),
  }));

  const dataSource = hasData
    ? dataSet!.data.map((row, idx) => ({ ...row, _key: idx }))
    : component.data.map((row, idx) => ({ ...row, _key: idx }));

  return (
    <Table
      key={`${component.id}-${component.dataSetId || 'none'}-v${dataVersion}`}
      columns={columns}
      dataSource={dataSource}
      rowKey="_key"
      size="small"
      pagination={component.pagination === false ? false : {
        pageSize: component.pagination?.pageSize ?? 10,
        showSizeChanger: component.pagination?.showSizeChanger ?? true,
        showTotal: (total: number) => `共 ${total} 条`,
      }}
      scroll={{ x: 'max-content', y: component.height - 60 }}
      bordered
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default TableRenderer;