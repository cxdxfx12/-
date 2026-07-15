import React from 'react';
import { Select, DatePicker, Slider, Typography } from 'antd';
import type { FilterComponent } from '../types';
import { useAppStore } from '../store';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface FilterRendererProps {
  component: FilterComponent;
  onChange?: (value: string | number | undefined) => void;
}

const FilterRenderer: React.FC<FilterRendererProps> = ({ component, onChange }) => {
  const dataSets = useAppStore((state) => state.dataSets);
  const dataVersion = useAppStore((state) => state.dataVersion);
  const dataSet = component.dataSetId
    ? dataSets.find((ds) => ds.id === component.dataSetId)
    : null;

  const options = component.values
    ? component.values.map((v) => ({ label: v, value: v }))
    : dataSet && component.field
      ? [...new Set(dataSet.data.map((row) => String(row[component.field!] || '')))]
          .filter(Boolean)
          .map((v) => ({ label: v, value: v }))
      : [];

  const handleChange = (val: string | number | undefined) => {
    onChange?.(val);
  };

  switch (component.filterType) {
    case 'dropdown':
      return (
        <div key={`filter-${component.id}-v${dataVersion}`} style={{ padding: '8px 12px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{component.label}</Text>
          <Select
            placeholder={`请选择${component.label}`}
            allowClear
            style={{ width: '100%' }}
            options={options}
            value={component.value as string}
            onChange={handleChange}
            size="small"
          />
        </div>
      );

    case 'dateRange':
      return (
        <div key={`filter-${component.id}-v${dataVersion}`} style={{ padding: '8px 12px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{component.label}</Text>
          <RangePicker size="small" style={{ width: '100%' }} />
        </div>
      );

    case 'slider':
      return (
        <div key={`filter-${component.id}-v${dataVersion}`} style={{ padding: '8px 12px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{component.label}</Text>
          <Slider
            value={component.value as number || 0}
            onChange={handleChange}
            min={0}
            max={100}
            style={{ margin: '4px 0' }}
          />
        </div>
      );

    default:
      return null;
  }
};

export default FilterRenderer;