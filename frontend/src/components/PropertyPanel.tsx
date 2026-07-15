import React, { useState } from 'react';
import {
  Typography,
  Input,
  Select,
  InputNumber,
  Switch,
  ColorPicker,
  Empty,
  Collapse,
  Tabs,
  Slider,
  Row,
  Col,
  Divider,
  Button,
  Radio,
} from 'antd';
import {
  DatabaseOutlined,
  FormatPainterOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  LineOutlined,
  BorderOutlined,
  EnvironmentOutlined,
  FontSizeOutlined,
  BgColorsOutlined,
  TagOutlined,
  SettingOutlined,
  FontColorsOutlined,
} from '@ant-design/icons';
import type {
  Component,
  DataSet,
  ChartType,
  ChartConfig,
  FontConfig,
  BackgroundConfig,
  BorderConfig,
  ShadowConfig,
  FilterComponent,
} from '../types';
import { CHART_FIELD_CONFIG, CHART_WITH_AXES, CHART_TYPE_OPTIONS, FONT_OPTIONS, FONT_SIZE_PRESETS } from '../constants';
import styles from './PropertyPanel.module.css';

const { Title, Text } = Typography;

interface PropertyPanelProps {
  component: Component | undefined;
  onUpdate: (updates: Partial<Component>) => void;
  dataSets: DataSet[];
}

// ============ 独立切片组件（定义在组件外部避免重渲染丢失焦点） ============

// 文本输入切片
const TextInputSlice: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = React.memo(({ label, value, onChange, placeholder }) => (
  <div className={styles.slice}>
    <Text className={styles.sliceLabel}>{label}</Text>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      size="small"
      variant="filled"
    />
  </div>
));

// 数字输入切片
const NumberSlice: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}> = React.memo(({ label, value, onChange, min, max, step = 1, precision = 0 }) => (
  <div className={styles.slice}>
    <Text className={styles.sliceLabel}>{label}</Text>
    <InputNumber
      value={value}
      onChange={(v) => onChange(v || 0)}
      min={min}
      max={max}
      step={step}
      precision={precision}
      size="small"
      variant="filled"
      style={{ width: '100%' }}
    />
  </div>
));

// 下拉选择切片
const SelectSlice: React.FC<{
  label: string;
  value: unknown;
  onChange: (v: unknown) => void;
  options: { label: string; value: unknown; options?: { label: string; value: unknown }[] }[];
  placeholder?: string;
  allowClear?: boolean;
}> = React.memo(({ label, value, onChange, options, placeholder, allowClear }) => (
  <div className={styles.slice}>
    <Text className={styles.sliceLabel}>{label}</Text>
    <Select
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      allowClear={allowClear}
      size="small"
      variant="filled"
      style={{ width: '100%' }}
    />
  </div>
));

// 颜色选择切片
const ColorSlice: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = React.memo(({ label, value, onChange }) => (
  <div className={styles.sliceRow}>
    <Text className={styles.sliceLabel}>{label}</Text>
    <ColorPicker
      value={value}
      onChange={(color) => onChange(color.toHexString())}
      size="small"
    >
      <div className={styles.colorSwatch} style={{ background: value }}>
        <span className={styles.colorHex}>{value}</span>
      </div>
    </ColorPicker>
  </div>
));

// 开关切片
const ToggleSlice: React.FC<{
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}> = React.memo(({ label, value, onChange }) => (
  <div className={styles.sliceRow}>
    <Text className={styles.sliceLabel}>{label}</Text>
    <Switch size="small" checked={value} onChange={onChange} />
  </div>
));

// 滑块切片（透明度）
const SliderSlice: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}> = React.memo(({ label, value, onChange, min = 0, max = 100 }) => (
  <div className={styles.slice}>
    <div className={styles.sliceRow}>
      <Text className={styles.sliceLabel}>{label}</Text>
      <Text className={styles.sliceValue}>{value}%</Text>
    </div>
    <Slider
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      style={{ margin: '4px 0 0' }}
    />
  </div>
));

// 复合字体切片 — PowerBI 风格
const FontSlice: React.FC<{
  label: string;
  config: FontConfig | undefined;
  onChange: (key: keyof FontConfig, value: unknown) => void;
  showAlign?: boolean;
}> = React.memo(({ label, config, onChange, showAlign }) => {
  const fc = config || {};
  const currentFont = fc.fontFamily || 'Microsoft YaHei';
  const currentSize = fc.fontSize || 14;

  return (
    <div className={styles.compositeSlice}>
      <Text className={styles.sliceLabel} style={{ display: 'block', marginBottom: 8 }}>
        {label}
      </Text>

      {/* 字体选择 + 预览 */}
      <div className={styles.slice} style={{ marginBottom: 8 }}>
        <Text className={styles.sliceLabel} style={{ fontSize: 11, color: '#8c8c8c' }}>字体</Text>
        <Select
          value={currentFont}
          onChange={(v) => onChange('fontFamily', v)}
          size="small"
          variant="filled"
          style={{ width: '100%' }}
          optionRender={(opt) => (
            <span style={{ fontFamily: opt.value as string }}>{opt.label}</span>
          )}
          labelRender={(props) => (
            <span style={{ fontFamily: props.value as string }}>{props.label}</span>
          )}
          options={FONT_OPTIONS.map((f) => ({
            ...f,
            label: (
              <span style={{ fontFamily: f.value }}>
                {f.label}
              </span>
            ),
          }))}
        />
      </div>

      {/* 字号 + 预设 */}
      <div className={styles.slice} style={{ marginBottom: 8 }}>
        <div className={styles.sliceRow}>
          <Text className={styles.sliceLabel} style={{ fontSize: 11, color: '#8c8c8c' }}>字号</Text>
          <InputNumber
            value={currentSize}
            onChange={(v) => onChange('fontSize', v || 14)}
            min={1}
            max={200}
            step={1}
            precision={0}
            size="small"
            variant="filled"
            style={{ width: 72 }}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 4 }}>
          {FONT_SIZE_PRESETS.slice(0, 12).map((sz) => (
            <Button
              key={sz}
              size="small"
              type={currentSize === sz ? 'primary' : 'text'}
              style={{ padding: '0 4px', minWidth: 28, fontSize: 10, height: 22 }}
              onClick={() => onChange('fontSize', sz)}
            >
              {sz}
            </Button>
          ))}
        </div>
      </div>

      {/* 样式按钮行 */}
      <Row gutter={4} style={{ marginBottom: 4 }}>
        <Col span={showAlign ? 6 : 8}>
          <Button
            size="small"
            type={fc.bold ? 'primary' : 'text'}
            icon={<BoldOutlined />}
            block
            onClick={() => onChange('bold', !fc.bold)}
            title="加粗"
          />
        </Col>
        <Col span={showAlign ? 6 : 8}>
          <Button
            size="small"
            type={fc.italic ? 'primary' : 'text'}
            icon={<ItalicOutlined />}
            block
            onClick={() => onChange('italic', !fc.italic)}
            title="斜体"
          />
        </Col>
        <Col span={showAlign ? 6 : 8}>
          <Button
            size="small"
            type={fc.underline ? 'primary' : 'text'}
            icon={<UnderlineOutlined />}
            block
            onClick={() => onChange('underline', !fc.underline)}
            title="下划线"
          />
        </Col>
        {showAlign && (
          <Col span={6}>
            <ColorPicker
              value={fc.color || '#333333'}
              onChange={(color) => onChange('color', color.toHexString())}
              size="small"
            >
              <Button size="small" type="text" icon={<FontColorsOutlined />} block title="字体颜色" />
            </ColorPicker>
          </Col>
        )}
      </Row>

      {/* 对齐按钮行 */}
      {showAlign && (
        <Row gutter={4} style={{ marginBottom: 4 }}>
          <Col span={8}>
            <Button
              size="small"
              type={fc.align === 'left' ? 'primary' : 'text'}
              icon={<AlignLeftOutlined />}
              block
              onClick={() => onChange('align', 'left')}
              title="左对齐"
            />
          </Col>
          <Col span={8}>
            <Button
              size="small"
              type={fc.align === 'center' ? 'primary' : 'text'}
              icon={<AlignCenterOutlined />}
              block
              onClick={() => onChange('align', 'center')}
              title="居中"
            />
          </Col>
          <Col span={8}>
            <Button
              size="small"
              type={fc.align === 'right' ? 'primary' : 'text'}
              icon={<AlignRightOutlined />}
              block
              onClick={() => onChange('align', 'right')}
              title="右对齐"
            />
          </Col>
        </Row>
      )}

      {/* 颜色（无对齐时单独显示） */}
      {!showAlign && (
        <div className={styles.sliceRow}>
          <Text className={styles.sliceLabel} style={{ fontSize: 11, color: '#8c8c8c' }}>颜色</Text>
          <ColorPicker
            value={fc.color || '#333333'}
            onChange={(color) => onChange('color', color.toHexString())}
            size="small"
          >
            <div className={styles.colorSwatch} style={{ background: fc.color || '#333333' }}>
              <span className={styles.colorHex}>{fc.color || '#333333'}</span>
            </div>
          </ColorPicker>
        </div>
      )}
    </div>
  );
});

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  component,
  onUpdate,
  dataSets,
}) => {
  const [activeTab, setActiveTab] = useState('format');

  if (!component) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Title level={5} style={{ margin: 0 }}>属性面板</Title>
        </div>
        <div className={styles.empty}>
          <Empty description="选择组件以编辑属性" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      </div>
    );
  }

  // ============ 通用更新辅助函数 ============
  const updateChartConfig = (key: keyof ChartConfig, value: unknown) => {
    if (component.type === 'chart') {
      onUpdate({ config: { ...component.config, [key]: value } });
    }
  };

  const updateNestedConfig = <K extends keyof ChartConfig>(
    parentKey: K,
    childKey: string,
    value: unknown
  ) => {
    if (component.type === 'chart') {
      const parent = (component.config[parentKey] || {}) as Record<string, unknown>;
      onUpdate({
        config: {
          ...component.config,
          [parentKey]: { ...parent, [childKey]: value },
        },
      });
    }
  };

  // ============ 渲染字段Tab（数据绑定）============
  const renderFieldsTab = () => {
    if (component.type === 'chart') {
      const selectedDataSet = dataSets.find((ds) => ds.id === component.dataSetId);
      const fieldOptions = selectedDataSet
        ? selectedDataSet.fields.map((f) => ({
            label: `${f.name} (${f.type})`,
            value: f.name,
          }))
        : [];
      const fieldConfig = CHART_FIELD_CONFIG[component.chartType];

      return (
        <div className={styles.tabContent}>
          {/* 数据源卡片 */}
          <Collapse
            defaultActiveKey={['data']}
            ghost
            className={styles.collapse}
            items={[
              {
                key: 'data',
                label: (
                  <span className={styles.cardTitle}>
                    <DatabaseOutlined /> 数据
                  </span>
                ),
                children: (
                  <div className={styles.cardBody}>
                    <SelectSlice
                      label="数据源"
                      value={component.dataSetId}
                      onChange={(v) =>
                        onUpdate({
                          dataSetId: v as string,
                          xField: undefined,
                          yField: undefined,
                        })
                      }
                      options={dataSets.map((ds) => ({ label: ds.name, value: ds.id }))}
                      placeholder="选择数据集"
                      allowClear
                    />
                    {fieldConfig && fieldConfig.xLabel && (
                      <SelectSlice
                        label={fieldConfig.xLabel}
                        value={component.xField}
                        onChange={(v) => onUpdate({ xField: v as string })}
                        options={fieldOptions}
                        placeholder={fieldConfig.xPlaceholder}
                        allowClear
                      />
                    )}
                    {fieldConfig && fieldConfig.yLabel && (
                      <SelectSlice
                        label={fieldConfig.yLabel}
                        value={component.yField}
                        onChange={(v) => onUpdate({ yField: v as string })}
                        options={fieldOptions}
                        placeholder={fieldConfig.yPlaceholder}
                        allowClear
                      />
                    )}
                    {dataSets.length === 0 && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        暂无数据集，请在左侧面板导入数据
                      </Text>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      );
    }

    if (component.type === 'text') {
      return (
        <div className={styles.tabContent}>
          <Collapse
            defaultActiveKey={['content', 'font']}
            ghost
            className={styles.collapse}
            items={[
              {
                key: 'content',
                label: (
                  <span className={styles.cardTitle}>
                    <FontSizeOutlined /> 文本内容
                  </span>
                ),
                children: (
                  <div className={styles.cardBody}>
                    <div className={styles.slice}>
                      <Text className={styles.sliceLabel}>内容</Text>
                      <Input.TextArea
                        value={component.content}
                        onChange={(e) => onUpdate({ content: e.target.value })}
                        rows={4}
                        size="small"
                        variant="filled"
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: 'font',
                label: (
                  <span className={styles.cardTitle}>
                    <FontColorsOutlined /> 字体
                  </span>
                ),
                children: (
                  <div className={styles.cardBody}>
                    <FontSlice
                      label=""
                      config={{
                        fontFamily: component.fontFamily || 'Microsoft YaHei',
                        fontSize: component.fontSize || 14,
                        bold: component.fontWeight === 'bold',
                        italic: component.fontStyle === 'italic',
                        underline: component.textDecoration === 'underline',
                        color: component.color || '#333333',
                        align: component.textAlign || 'left',
                      }}
                      onChange={(key, value) => {
                        const textUpdates: Record<string, unknown> = {};
                        if (key === 'bold') textUpdates.fontWeight = value ? 'bold' : 'normal';
                        else if (key === 'italic') textUpdates.fontStyle = value ? 'italic' : 'normal';
                        else if (key === 'underline') textUpdates.textDecoration = value ? 'underline' : 'none';
                        else if (key === 'align') textUpdates.textAlign = value;
                        else textUpdates[key] = value;
                        onUpdate(textUpdates);
                      }}
                      showAlign
                    />
                    <div className={styles.sliceRow}>
                      <Text className={styles.sliceLabel} style={{ fontSize: 11, color: '#8c8c8c' }}>行高</Text>
                      <InputNumber
                        value={component.lineHeight ?? 1.5}
                        onChange={(v) => onUpdate({ lineHeight: v ?? 1.5 })}
                        min={0.5}
                        max={5}
                        step={0.1}
                        size="small"
                        variant="filled"
                        style={{ width: 80 }}
                      />
                    </div>
                    <div className={styles.sliceRow}>
                      <Text className={styles.sliceLabel} style={{ fontSize: 11, color: '#8c8c8c' }}>字间距</Text>
                      <InputNumber
                        value={component.letterSpacing ?? 0}
                        onChange={(v) => onUpdate({ letterSpacing: v ?? 0 })}
                        min={-5}
                        max={20}
                        step={0.5}
                        size="small"
                        variant="filled"
                        style={{ width: 80 }}
                      />
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      );
    }

    if (component.type === 'card') {
      return (
        <div className={styles.tabContent}>
          <Collapse
            defaultActiveKey={['data']}
            ghost
            className={styles.collapse}
            items={[
              {
                key: 'data',
                label: (
                  <span className={styles.cardTitle}>
                    <DatabaseOutlined /> 数据
                  </span>
                ),
                children: (
                  <div className={styles.cardBody}>
                    <TextInputSlice
                      label="指标标题"
                      value={component.title}
                      onChange={(v) => onUpdate({ title: v })}
                    />
                    <TextInputSlice
                      label="指标值"
                      value={String(component.value)}
                      onChange={(v) => onUpdate({ value: v })}
                    />
                    <TextInputSlice
                      label="单位"
                      value={component.unit || ''}
                      onChange={(v) => onUpdate({ unit: v })}
                      placeholder="例如: 元、%"
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>
      );
    }

    if (component.type === 'table') {
      const selectedDataSet = dataSets.find((ds) => ds.id === component.dataSetId);
      return (
        <div className={styles.tabContent}>
          <Collapse
            defaultActiveKey={['data']}
            ghost
            className={styles.collapse}
            items={[
              {
                key: 'data',
                label: (
                  <span className={styles.cardTitle}>
                    <DatabaseOutlined /> 数据
                  </span>
                ),
                children: (
                  <div className={styles.cardBody}>
                    <SelectSlice
                      label="数据源"
                      value={component.dataSetId}
                      onChange={(v) => onUpdate({ dataSetId: v as string })}
                      options={dataSets.map((ds) => ({ label: ds.name, value: ds.id }))}
                      placeholder="选择数据集"
                      allowClear
                    />
                    {selectedDataSet && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        已选择数据集: {selectedDataSet.name} ({selectedDataSet.rowCount} 行, {selectedDataSet.fields.length} 列)
                      </Text>
                    )}
                    {dataSets.length === 0 && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        暂无数据集，请在左侧面板导入数据
                      </Text>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      );
    }

    if (component.type === 'image') {
      return (
        <div className={styles.tabContent}>
          <Collapse
            defaultActiveKey={['image']}
            ghost
            className={styles.collapse}
            items={[
              {
                key: 'image',
                label: (
                  <span className={styles.cardTitle}>
                    <FontSizeOutlined /> 图片设置
                  </span>
                ),
                children: (
                  <div className={styles.cardBody}>
                    <TextInputSlice
                      label="图片URL"
                      value={component.src}
                      onChange={(v) => onUpdate({ src: v })}
                      placeholder="输入图片链接"
                    />
                    <TextInputSlice
                      label="替代文本"
                      value={component.alt || ''}
                      onChange={(v) => onUpdate({ alt: v })}
                      placeholder="图片加载失败时显示"
                    />
                    {component.src && (
                      <div style={{ marginTop: 8, textAlign: 'center' }}>
                        <img
                          src={component.src}
                          alt={component.alt || '预览'}
                          style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      );
    }

    if (component.type === 'filter') {
      const selectedDataSet = dataSets.find((ds) => ds.id === component.dataSetId);
      return (
        <div className={styles.tabContent}>
          <Collapse
            defaultActiveKey={['data']}
            ghost
            className={styles.collapse}
            items={[
              {
                key: 'data',
                label: (
                  <span className={styles.cardTitle}>
                    <DatabaseOutlined /> 筛选器设置
                  </span>
                ),
                children: (
                  <div className={styles.cardBody}>
                    <TextInputSlice
                      label="标签文本"
                      value={component.label}
                      onChange={(v) => onUpdate({ label: v })}
                    />
                    <SelectSlice
                      label="筛选类型"
                      value={component.filterType}
                      onChange={(v) => onUpdate({ filterType: v as FilterComponent['filterType'] })}
                      options={[
                        { label: '下拉选择', value: 'dropdown' },
                        { label: '日期范围', value: 'dateRange' },
                        { label: '滑块', value: 'slider' },
                      ]}
                    />
                    <SelectSlice
                      label="数据源"
                      value={component.dataSetId}
                      onChange={(v) => onUpdate({ dataSetId: v as string })}
                      options={dataSets.map((ds) => ({ label: ds.name, value: ds.id }))}
                      placeholder="选择数据集"
                      allowClear
                    />
                    {selectedDataSet && (
                      <SelectSlice
                        label="绑定字段"
                        value={component.field}
                        onChange={(v) => onUpdate({ field: v as string })}
                        options={selectedDataSet.fields.map((f) => ({ label: `${f.name} (${f.type})`, value: f.name }))}
                        placeholder="选择筛选字段"
                        allowClear
                      />
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      );
    }

    return null;
  };

  // ============ 渲染格式Tab ============
  const renderFormatTab = () => {
    const isChart = component.type === 'chart';
    const isText = component.type === 'text';
    const isCard = component.type === 'card';

    // 获取/设置通用样式配置
    const getBg = (): BackgroundConfig => {
      if (isChart) return component.config.background || {};
      if (isText || isCard) return component.background || {};
      return {};
    };
    const setBg = (key: keyof BackgroundConfig, v: unknown) => {
      const bg = getBg();
      if (isChart) updateNestedConfig('background', key as string, v);
      else if (isText || isCard) onUpdate({ background: { ...bg, [key]: v } });
    };

    const getBorder = (): BorderConfig => {
      if (isChart) return component.config.border || {};
      if (isText || isCard) return component.border || {};
      return {};
    };
    const setBorder = (key: keyof BorderConfig, v: unknown) => {
      const b = getBorder();
      if (isChart) updateNestedConfig('border', key as string, v);
      else if (isText || isCard) onUpdate({ border: { ...b, [key]: v } });
    };

    const getShadow = (): ShadowConfig => {
      if (isChart) return component.config.shadow || {};
      if (isText || isCard) return component.shadow || {};
      return {};
    };
    const setShadow = (key: keyof ShadowConfig, v: unknown) => {
      const s = getShadow();
      if (isChart) updateNestedConfig('shadow', key as string, v);
      else if (isText || isCard) onUpdate({ shadow: { ...s, [key]: v } });
    };

    const getTransparency = (): number => {
      if (isChart) return component.config.transparency || 0;
      if (isText || isCard) return component.transparency || 0;
      return 0;
    };
    const setTransparency = (v: number) => {
      if (isChart) updateChartConfig('transparency', v);
      else if (isText || isCard) onUpdate({ transparency: v });
    };

    // 图表特定配置获取
    const chartConfig = isChart ? component.config : null;

    return (
      <div className={styles.tabContent}>
        {/* 常规卡片 */}
        <Collapse
          defaultActiveKey={['general']}
          ghost
          className={styles.collapse}
          items={[
            {
              key: 'general',
              label: (
                <span className={styles.cardTitle}>
                  <SettingOutlined /> 常规
                </span>
              ),
              children: (
                <div className={styles.cardBody}>
                  <div className={styles.sliceRow}>
                    <Text className={styles.sliceLabel}>宽度</Text>
                    <InputNumber
                      value={component.width}
                      onChange={(v) => onUpdate({ width: v || 100 })}
                      min={50}
                      step={1}
                      precision={0}
                      size="small"
                      variant="filled"
                      style={{ width: 80 }}
                    />
                  </div>
                  <div className={styles.sliceRow}>
                    <Text className={styles.sliceLabel}>高度</Text>
                    <InputNumber
                      value={component.height}
                      onChange={(v) => onUpdate({ height: v || 60 })}
                      min={30}
                      step={1}
                      precision={0}
                      size="small"
                      variant="filled"
                      style={{ width: 80 }}
                    />
                  </div>
                  <div className={styles.sliceRow}>
                    <Text className={styles.sliceLabel}>X 位置</Text>
                    <InputNumber
                      value={component.x}
                      onChange={(v) => onUpdate({ x: v || 0 })}
                      min={0}
                      step={1}
                      precision={0}
                      size="small"
                      variant="filled"
                      style={{ width: 80 }}
                    />
                  </div>
                  <div className={styles.sliceRow}>
                    <Text className={styles.sliceLabel}>Y 位置</Text>
                    <InputNumber
                      value={component.y}
                      onChange={(v) => onUpdate({ y: v || 0 })}
                      min={0}
                      step={1}
                      precision={0}
                      size="small"
                      variant="filled"
                      style={{ width: 80 }}
                    />
                  </div>
                  <SliderSlice
                    label="透明度"
                    value={getTransparency()}
                    onChange={setTransparency}
                  />
                </div>
              ),
            },
          ]}
        />

        {/* 图表类型卡片（仅图表） */}
        {isChart && (
          <Collapse
            ghost
            className={styles.collapse}
            items={[
              {
                key: 'chartType',
                label: (
                  <span className={styles.cardTitle}>
                    <LineOutlined /> 视觉对象类型
                  </span>
                ),
                children: (
                  <div className={styles.cardBody}>
                    <SelectSlice
                      label="图表类型"
                      value={component.chartType}
                      onChange={(v) => onUpdate({ chartType: v as ChartType })}
                      options={CHART_TYPE_OPTIONS.map(g => ({ label: g.label, value: g.label, options: g.options }))}
                    />
                  </div>
                ),
              },
            ]}
          />
        )}

        {/* 标题卡片 */}
        {isChart && (
          <Collapse
            ghost
            className={styles.collapse}
            items={[
              {
                key: 'title',
                label: (
                  <span className={styles.cardTitle}>
                    <FontSizeOutlined /> 标题
                  </span>
                ),
                children: (
                  <div className={styles.cardBody}>
                    <TextInputSlice
                      label="标题文本"
                      value={chartConfig?.title || ''}
                      onChange={(v) => updateChartConfig('title', v)}
                      placeholder="请输入图表标题"
                    />
                    <FontSlice
                      label="标题字体"
                      config={chartConfig?.titleFont}
                      onChange={(key, v) => updateNestedConfig('titleFont', key as string, v)}
                      showAlign
                    />
                  </div>
                ),
              },
            ]}
          />
        )}

        {/* 文本字体卡片（仅文本） */}
        {isText && (
          <Collapse
            defaultActiveKey={['font']}
            ghost
            className={styles.collapse}
            items={[
              {
                key: 'font',
                label: (
                  <span className={styles.cardTitle}>
                    <FontSizeOutlined /> 字体
                  </span>
                ),
                children: (
                  <div className={styles.cardBody}>
                    <SelectSlice
                      label="字体"
                      value={component.fontFamily}
                      onChange={(v) => onUpdate({ fontFamily: v as string })}
                      options={FONT_OPTIONS}
                    />
                    <div className={styles.sliceRow}>
                      <Text className={styles.sliceLabel}>字号</Text>
                      <InputNumber
                        value={component.fontSize}
                        onChange={(v) => onUpdate({ fontSize: v || 14 })}
                        min={8}
                        max={72}
                        step={1}
                        precision={0}
                        size="small"
                        variant="filled"
                        style={{ width: 80 }}
                      />
                    </div>
                    <div className={styles.sliceRow}>
                      <Text className={styles.sliceLabel}>粗细</Text>
                      <Select
                        value={component.fontWeight}
                        onChange={(v) => onUpdate({ fontWeight: v })}
                        size="small"
                        variant="filled"
                        style={{ width: 100 }}
                        options={[
                          { label: '正常', value: 'normal' },
                          { label: '粗体', value: 'bold' },
                        ]}
                      />
                    </div>
                    <div className={styles.sliceRow}>
                      <Text className={styles.sliceLabel}>对齐</Text>
                      <Radio.Group
                        value={component.textAlign}
                        onChange={(e) => onUpdate({ textAlign: e.target.value })}
                        size="small"
                      >
                        <Radio.Button value="left"><AlignLeftOutlined /></Radio.Button>
                        <Radio.Button value="center"><AlignCenterOutlined /></Radio.Button>
                        <Radio.Button value="right"><AlignRightOutlined /></Radio.Button>
                      </Radio.Group>
                    </div>
                    <ColorSlice
                      label="颜色"
                      value={component.color}
                      onChange={(v) => onUpdate({ color: v })}
                    />
                  </div>
                ),
              },
            ]}
          />
        )}

        {/* 指标卡样式 */}
        {isCard && (
          <Collapse
            defaultActiveKey={['cardStyle']}
            ghost
            className={styles.collapse}
            items={[
              {
                key: 'cardStyle',
                label: (
                  <span className={styles.cardTitle}>
                    <TagOutlined /> 指标卡样式
                  </span>
                ),
                children: (
                  <div className={styles.cardBody}>
                    <FontSlice
                      label="标题字体"
                      config={component.titleFont}
                      onChange={(key, v) =>
                        onUpdate({ titleFont: { ...(component.titleFont || {}), [key]: v } })
                      }
                    />
                    <FontSlice
                      label="数值字体"
                      config={component.valueFont}
                      onChange={(key, v) =>
                        onUpdate({ valueFont: { ...(component.valueFont || {}), [key]: v } })
                      }
                    />
                    <ToggleSlice
                      label="使用渐变背景"
                      value={!!component.background?.gradient}
                      onChange={(v) =>
                        onUpdate({
                          background: {
                            ...component.background,
                            gradient: v ? '#667eea' : undefined,
                            gradientEnd: v ? '#764ba2' : undefined,
                          },
                        })
                      }
                    />
                    {component.background?.gradient && (
                      <>
                        <ColorSlice
                          label="渐变起始色"
                          value={component.background.gradient}
                          onChange={(v) =>
                            onUpdate({
                              background: { ...component.background, gradient: v },
                            })
                          }
                        />
                        <ColorSlice
                          label="渐变结束色"
                          value={component.background.gradientEnd || '#764ba2'}
                          onChange={(v) =>
                            onUpdate({
                              background: { ...component.background, gradientEnd: v },
                            })
                          }
                        />
                      </>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}

        {/* 背景卡片 */}
        <Collapse
          ghost
          className={styles.collapse}
          items={[
            {
              key: 'background',
              label: (
                <span className={styles.cardTitle}>
                  <BgColorsOutlined /> 背景
                </span>
              ),
              children: (
                <div className={styles.cardBody}>
                  <ToggleSlice
                    label="显示背景"
                    value={getBg().show !== false}
                    onChange={(v) => setBg('show', v)}
                  />
                  {getBg().show !== false && (
                    <>
                      <ColorSlice
                        label="背景颜色"
                        value={getBg().color || '#ffffff'}
                        onChange={(v) => setBg('color', v)}
                      />
                      <SliderSlice
                        label="透明度"
                        value={getBg().transparency || 0}
                        onChange={(v) => setBg('transparency', v)}
                      />
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />

        {/* 边框卡片 */}
        <Collapse
          ghost
          className={styles.collapse}
          items={[
            {
              key: 'border',
              label: (
                <span className={styles.cardTitle}>
                  <BorderOutlined /> 边框
                </span>
              ),
              children: (
                <div className={styles.cardBody}>
                  <ToggleSlice
                    label="显示边框"
                    value={getBorder().show !== false}
                    onChange={(v) => setBorder('show', v)}
                  />
                  {getBorder().show !== false && (
                    <>
                      <ColorSlice
                        label="边框颜色"
                        value={getBorder().color || '#e0e0e0'}
                        onChange={(v) => setBorder('color', v)}
                      />
                      <NumberSlice
                        label="边框粗细"
                        value={getBorder().width || 1}
                        onChange={(v) => setBorder('width', v)}
                        min={0}
                        max={10}
                      />
                      <NumberSlice
                        label="圆角"
                        value={getBorder().radius || 6}
                        onChange={(v) => setBorder('radius', v)}
                        min={0}
                        max={30}
                      />
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />

        {/* 阴影卡片 */}
        <Collapse
          ghost
          className={styles.collapse}
          items={[
            {
              key: 'shadow',
              label: (
                <span className={styles.cardTitle}>
                  <EnvironmentOutlined /> 阴影
                </span>
              ),
              children: (
                <div className={styles.cardBody}>
                  <ToggleSlice
                    label="显示阴影"
                    value={getShadow().show !== false}
                    onChange={(v) => setShadow('show', v)}
                  />
                  {getShadow().show !== false && (
                    <>
                      <ColorSlice
                        label="阴影颜色"
                        value={getShadow().color || 'rgba(0,0,0,0.08)'}
                        onChange={(v) => setShadow('color', v)}
                      />
                      <NumberSlice
                        label="模糊度"
                        value={getShadow().blur || 8}
                        onChange={(v) => setShadow('blur', v)}
                        min={0}
                        max={40}
                      />
                      <div className={styles.sliceRow}>
                        <Text className={styles.sliceLabel}>X偏移</Text>
                        <InputNumber
                          value={getShadow().offsetX ?? 0}
                          onChange={(v) => setShadow('offsetX', v ?? 0)}
                          min={-20}
                          max={20}
                          step={1}
                          precision={0}
                          size="small"
                          variant="filled"
                          style={{ width: 80 }}
                        />
                      </div>
                      <div className={styles.sliceRow}>
                        <Text className={styles.sliceLabel}>Y偏移</Text>
                        <InputNumber
                          value={getShadow().offsetY ?? 2}
                          onChange={(v) => setShadow('offsetY', v ?? 0)}
                          min={-20}
                          max={20}
                          step={1}
                          precision={0}
                          size="small"
                          variant="filled"
                          style={{ width: 80 }}
                        />
                      </div>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />

        {/* 图表专属设置 */}
        {isChart && (
          <>
            {/* 图例卡片 */}
            <Collapse
              ghost
              className={styles.collapse}
              items={[
                {
                  key: 'legend',
                  label: (
                    <span className={styles.cardTitle}>
                      <TagOutlined /> 图例
                    </span>
                  ),
                  children: (
                    <div className={styles.cardBody}>
                      <ToggleSlice
                        label="显示图例"
                        value={chartConfig?.legend?.show ?? chartConfig?.showLegend ?? true}
                        onChange={(v) => {
                          updateNestedConfig('legend', 'show', v);
                          updateChartConfig('showLegend', v);
                        }}
                      />
                      {(chartConfig?.legend?.show ?? chartConfig?.showLegend ?? true) && (
                        <>
                          <SelectSlice
                            label="位置"
                            value={chartConfig?.legend?.position || 'bottom'}
                            onChange={(v) => updateNestedConfig('legend', 'position', v)}
                            options={[
                              { label: '顶部', value: 'top' },
                              { label: '底部', value: 'bottom' },
                              { label: '左侧', value: 'left' },
                              { label: '右侧', value: 'right' },
                            ]}
                          />
                          <NumberSlice
                            label="字号"
                            value={chartConfig?.legend?.fontSize || 12}
                            onChange={(v) => updateNestedConfig('legend', 'fontSize', v)}
                            min={8}
                            max={24}
                          />
                          <ColorSlice
                            label="文字颜色"
                            value={chartConfig?.legend?.color || '#666666'}
                            onChange={(v) => updateNestedConfig('legend', 'color', v)}
                          />
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
            />

            {/* 数据标签卡片 */}
            <Collapse
              ghost
              className={styles.collapse}
              items={[
                {
                  key: 'dataLabel',
                  label: (
                    <span className={styles.cardTitle}>
                      <TagOutlined /> 数据标签
                    </span>
                  ),
                  children: (
                    <div className={styles.cardBody}>
                      <ToggleSlice
                        label="显示数据标签"
                        value={chartConfig?.dataLabel?.show ?? false}
                        onChange={(v) => updateNestedConfig('dataLabel', 'show', v)}
                      />
                      {chartConfig?.dataLabel?.show && (
                        <>
                          <SelectSlice
                            label="位置"
                            value={chartConfig?.dataLabel?.position || 'top'}
                            onChange={(v) => updateNestedConfig('dataLabel', 'position', v)}
                            options={[
                              { label: '顶部', value: 'top' },
                              { label: '底部', value: 'bottom' },
                              { label: '左侧', value: 'left' },
                              { label: '右侧', value: 'right' },
                              { label: '内部', value: 'inside' },
                            ]}
                          />
                          <NumberSlice
                            label="字号"
                            value={chartConfig?.dataLabel?.fontSize || 12}
                            onChange={(v) => updateNestedConfig('dataLabel', 'fontSize', v)}
                            min={8}
                            max={24}
                          />
                          <ColorSlice
                            label="文字颜色"
                            value={chartConfig?.dataLabel?.color || '#333333'}
                            onChange={(v) => updateNestedConfig('dataLabel', 'color', v)}
                          />
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
            />

            {/* 坐标轴卡片（仅含轴的图表） */}
            {CHART_WITH_AXES.includes(component.chartType) && (
              <Collapse
                ghost
                className={styles.collapse}
                items={[
                  {
                    key: 'axes',
                    label: (
                      <span className={styles.cardTitle}>
                        <LineOutlined /> 坐标轴
                      </span>
                    ),
                    children: (
                      <div className={styles.cardBody}>
                        {/* X轴 */}
                        <div className={styles.subGroup}>
                          <Text className={styles.subGroupTitle}>X轴</Text>
                          <ToggleSlice
                            label="显示X轴"
                            value={chartConfig?.xAxisConfig?.show ?? true}
                            onChange={(v) => updateNestedConfig('xAxisConfig', 'show', v)}
                          />
                          <ToggleSlice
                            label="显示轴标题"
                            value={chartConfig?.xAxisConfig?.showTitle ?? false}
                            onChange={(v) => updateNestedConfig('xAxisConfig', 'showTitle', v)}
                          />
                          {chartConfig?.xAxisConfig?.showTitle && (
                            <TextInputSlice
                              label="轴标题"
                              value={chartConfig?.xAxisConfig?.title || ''}
                              onChange={(v) => updateNestedConfig('xAxisConfig', 'title', v)}
                            />
                          )}
                        </div>
                        <Divider style={{ margin: '8px 0' }} />
                        {/* Y轴 */}
                        <div className={styles.subGroup}>
                          <Text className={styles.subGroupTitle}>Y轴</Text>
                          <ToggleSlice
                            label="显示Y轴"
                            value={chartConfig?.yAxisConfig?.show ?? true}
                            onChange={(v) => updateNestedConfig('yAxisConfig', 'show', v)}
                          />
                          <ToggleSlice
                            label="显示轴标题"
                            value={chartConfig?.yAxisConfig?.showTitle ?? false}
                            onChange={(v) => updateNestedConfig('yAxisConfig', 'showTitle', v)}
                          />
                          {chartConfig?.yAxisConfig?.showTitle && (
                            <TextInputSlice
                              label="轴标题"
                              value={chartConfig?.yAxisConfig?.title || ''}
                              onChange={(v) => updateNestedConfig('yAxisConfig', 'title', v)}
                            />
                          )}
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            )}

            {/* 网格线卡片 */}
            <Collapse
              ghost
              className={styles.collapse}
              items={[
                {
                  key: 'grid',
                  label: (
                    <span className={styles.cardTitle}>
                      <LineOutlined /> 网格线
                    </span>
                  ),
                  children: (
                    <div className={styles.cardBody}>
                      <ToggleSlice
                        label="显示网格线"
                        value={chartConfig?.gridLine?.show ?? chartConfig?.showGrid ?? true}
                        onChange={(v) => {
                          updateNestedConfig('gridLine', 'show', v);
                          updateChartConfig('showGrid', v);
                        }}
                      />
                      {(chartConfig?.gridLine?.show ?? chartConfig?.showGrid ?? true) && (
                        <>
                          <ColorSlice
                            label="网格颜色"
                            value={chartConfig?.gridLine?.color || '#f0f0f0'}
                            onChange={(v) => updateNestedConfig('gridLine', 'color', v)}
                          />
                          <NumberSlice
                            label="线条粗细"
                            value={chartConfig?.gridLine?.width || 1}
                            onChange={(v) => updateNestedConfig('gridLine', 'width', v)}
                            min={1}
                            max={5}
                          />
                          <SelectSlice
                            label="线条类型"
                            value={chartConfig?.gridLine?.type || 'solid'}
                            onChange={(v) => updateNestedConfig('gridLine', 'type', v)}
                            options={[
                              { label: '实线', value: 'solid' },
                              { label: '虚线', value: 'dashed' },
                              { label: '点线', value: 'dotted' },
                            ]}
                          />
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
            />

            {/* 颜色卡片 */}
            <Collapse
              ghost
              className={styles.collapse}
              items={[
                {
                  key: 'colors',
                  label: (
                    <span className={styles.cardTitle}>
                      <BgColorsOutlined /> 数据颜色
                    </span>
                  ),
                  children: (
                    <div className={styles.cardBody}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        配置图表系列颜色，按顺序应用到每个数据系列
                      </Text>
                      <div className={styles.colorPalette}>
                        {(chartConfig?.colors || [
                          '#1890ff', '#52c41a', '#faad14', '#722ed1',
                          '#eb2f96', '#13c2c2', '#fa8c16', '#2f54eb',
                        ]).map((color, idx) => (
                          <div key={idx} className={styles.paletteItem}>
                            <ColorPicker
                              value={color}
                              onChange={(c) => {
                                const colors = [...(chartConfig?.colors || [])];
                                colors[idx] = c.toHexString();
                                updateChartConfig('colors', colors);
                              }}
                              size="small"
                            >
                              <div className={styles.paletteSwatch} style={{ background: color }} />
                            </ColorPicker>
                          </div>
                        ))}
                      </div>
                      <Button
                        size="small"
                        type="dashed"
                        block
                        onClick={() => {
                          const colors = [...(chartConfig?.colors || [])];
                          colors.push('#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
                          updateChartConfig('colors', colors);
                        }}
                      >
                        + 添加颜色
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={5} style={{ margin: 0 }}>属性面板</Title>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        centered
        size="small"
        className={styles.tabs}
        items={[
          {
            key: 'format',
            label: (
              <span>
                <FormatPainterOutlined /> 格式
              </span>
            ),
            children: renderFormatTab(),
          },
          {
            key: 'fields',
            label: (
              <span>
                <DatabaseOutlined /> 字段
              </span>
            ),
            children: renderFieldsTab(),
          },
        ]}
      />
    </div>
  );
};

export default PropertyPanel;
