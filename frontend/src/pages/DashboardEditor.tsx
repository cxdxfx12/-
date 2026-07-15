import React, { useState, useRef, useEffect } from 'react';
import { Layout, Typography, Button, Space, Tooltip, Dropdown, Input, message, Tabs } from 'antd';
import {
  DeleteOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FilePptOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  PlayCircleOutlined,
  EditOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  FontSizeOutlined,
  NumberOutlined,
  PlusOutlined,
  UndoOutlined,
  RedoOutlined,
  CopyOutlined,
  SnippetsOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TableOutlined,
  PictureOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import html2canvas from 'html2canvas';
import { generateHtmlExport } from '../utils/exportHtml';

// Electron IPC 引用（仅 Electron 环境可用）
const ipcRenderer = (() => {
  try {
    return (window as any).require('electron').ipcRenderer;
  } catch {
    return null;
  }
})();
import { useAppStore, useAppActions } from '../store';
import { PAGE_SIZE_DIMENSIONS } from '../constants';
import type { Component, ChartType } from '../types';
import { CHART_NAMES, CHART_DEFAULT_SIZES } from '../constants';
import ComponentPanel from '../components/ComponentPanel';
import PropertyPanel from '../components/PropertyPanel';
import Canvas from '../components/Canvas';
import TemplateModal from '../components/TemplateModal';
import styles from './DashboardEditor.module.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

// 画布默认尺寸 — 根据页面大小动态计算
const getCanvasSize = (pageSize: string) => {
  const dims = PAGE_SIZE_DIMENSIONS[pageSize as keyof typeof PAGE_SIZE_DIMENSIONS] || PAGE_SIZE_DIMENSIONS['16:9'];
  return { width: dims.width, height: dims.height };
};

const DashboardEditor: React.FC = () => {
  const { currentReport, selectedComponentId, editMode, dataSets, isSaved, currentPageId } = useAppStore();
  const {
    selectComponent,
    addComponent,
    updateComponent,
    removeComponent,
    saveReport,
    loadReport,
    setEditMode,
    createNewReport,
    addPage,
    removePage,
    setCurrentPage,
    undo,
    redo,
    copyComponent,
    pasteComponent,
    moveComponentUp,
    moveComponentDown,
    moveComponentToTop,
    moveComponentToBottom,
  } = useAppActions();

  const [zoom, setZoom] = useState(1.0);
  const [titleEditing, setTitleEditing] = useState(false);
  const [reportTitle, setReportTitle] = useState(currentReport?.title || '未命名报告');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 如果没有报告，自动创建一个
  useEffect(() => {
    if (!currentReport) {
      createNewReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 同步报告标题
  useEffect(() => {
    if (currentReport) {
      setReportTitle(currentReport.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentReport?.title]);

  // 组件计数器（用于自动排列位置）
  const componentCountRef = useRef(0);

  // 计算下一个组件的默认位置（自动排列，不重叠）
  const getNextPosition = (width: number, height: number, dropX?: number, dropY?: number) => {
    const { width: canvasW, height: canvasH } = getCanvasSize(currentReport?.pageSize || '16:9');
    if (dropX !== undefined && dropY !== undefined) {
      // 拖放时，以落点为中心
      return {
        x: Math.max(20, Math.min(canvasW - width - 20, dropX - width / 2)),
        y: Math.max(20, Math.min(canvasH - height - 20, dropY - height / 2)),
      };
    }

    // 双击时，自动排列到画布中合理位置
    const count = componentCountRef.current;
    const cols = 2;
    const gapX = 40;
    const gapY = 40;
    const startX = 60;
    const startY = 40;
    const col = count % cols;
    const row = Math.floor(count / cols);
    const maxComponentWidth = (canvasW - startX * 2 - gapX) / cols;

    return {
      x: startX + col * (maxComponentWidth + gapX),
      y: startY + row * (height + gapY),
    };
  };

  // 缩放控制
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.3));

  // 添加图表
  const handleAddChart = (chartType: ChartType, x?: number, y?: number) => {
    const { w: defaultWidth, h: defaultHeight } = CHART_DEFAULT_SIZES[chartType];
    const pos = getNextPosition(defaultWidth, defaultHeight, x, y);

    const newComponent: Component = {
      id: `chart-${Date.now()}`,
      type: 'chart',
      chartType,
      pageId: currentPageId || '',
      title: CHART_NAMES[chartType],
      x: pos.x,
      y: pos.y,
      width: defaultWidth,
      height: defaultHeight,
      config: {
        title: '',
        showLegend: true,
        showGrid: true,
      },
    };
    addComponent(newComponent);
    selectComponent(newComponent.id);
    componentCountRef.current += 1;
  };

  // 添加文本
  const handleAddText = (x?: number, y?: number) => {
    const defaultWidth = 400;
    const defaultHeight = 80;
    const pos = getNextPosition(defaultWidth, defaultHeight, x, y);

    const newComponent: Component = {
      id: `text-${Date.now()}`,
      type: 'text',
      pageId: currentPageId || '',
      content: '双击编辑文本',
      x: pos.x,
      y: pos.y,
      width: defaultWidth,
      height: defaultHeight,
      fontSize: 16,
      fontFamily: 'Microsoft YaHei',
      fontWeight: 'normal',
      textAlign: 'left',
      color: '#333333',
    };
    addComponent(newComponent);
    selectComponent(newComponent.id);
    componentCountRef.current += 1;
  };

  // 添加指标卡
  const handleAddCard = (x?: number, y?: number) => {
    const defaultWidth = 280;
    const defaultHeight = 160;
    const pos = getNextPosition(defaultWidth, defaultHeight, x, y);

    const newComponent: Component = {
      id: `card-${Date.now()}`,
      type: 'card',
      pageId: currentPageId || '',
      title: '关键指标',
      value: '¥0',
      x: pos.x,
      y: pos.y,
      width: defaultWidth,
      height: defaultHeight,
    };
    addComponent(newComponent);
    selectComponent(newComponent.id);
    componentCountRef.current += 1;
  };

  // 添加表格
  const handleAddTable = (x?: number, y?: number) => {
    const defaultWidth = 800;
    const defaultHeight = 400;
    const pos = getNextPosition(defaultWidth, defaultHeight, x, y);

    const newComponent: Component = {
      id: `table-${Date.now()}`,
      type: 'table',
      pageId: currentPageId || '',
      columns: [],
      data: [],
      x: pos.x,
      y: pos.y,
      width: defaultWidth,
      height: defaultHeight,
    };
    addComponent(newComponent);
    selectComponent(newComponent.id);
    componentCountRef.current += 1;
  };

  // 添加图片
  const handleAddImage = (x?: number, y?: number) => {
    const defaultWidth = 400;
    const defaultHeight = 300;
    const pos = getNextPosition(defaultWidth, defaultHeight, x, y);

    const newComponent: Component = {
      id: `image-${Date.now()}`,
      type: 'image',
      pageId: currentPageId || '',
      src: '',
      alt: '',
      x: pos.x,
      y: pos.y,
      width: defaultWidth,
      height: defaultHeight,
    };
    addComponent(newComponent);
    selectComponent(newComponent.id);
    componentCountRef.current += 1;
  };

  // 添加筛选器
  const handleAddFilter = (x?: number, y?: number) => {
    const defaultWidth = 260;
    const defaultHeight = 60;
    const pos = getNextPosition(defaultWidth, defaultHeight, x, y);

    const newComponent: Component = {
      id: `filter-${Date.now()}`,
      type: 'filter',
      filterType: 'dropdown',
      pageId: currentPageId || '',
      label: '筛选器',
      x: pos.x,
      y: pos.y,
      width: defaultWidth,
      height: defaultHeight,
    };
    addComponent(newComponent);
    selectComponent(newComponent.id);
    componentCountRef.current += 1;
  };

  // 从拖放处理组件添加
  const handleDropComponent = (componentType: string, subType?: string, x?: number, y?: number) => {
    switch (componentType) {
      case 'chart':
        if (subType) {
          handleAddChart(subType as ChartType, x, y);
        }
        break;
      case 'text':
        handleAddText(x, y);
        break;
      case 'card':
        handleAddCard(x, y);
        break;
      case 'table':
        handleAddTable(x, y);
        break;
      case 'image':
        handleAddImage(x, y);
        break;
      case 'filter':
        handleAddFilter(x, y);
        break;
    }
  };

  // 删除选中组件
  const handleDelete = () => {
    if (selectedComponentId) {
      removeComponent(selectedComponentId);
    }
  };

  // 保存报告到文件
  const handleSave = async () => {
    saveReport(); // localStorage 持久化
    if (!currentReport) return;

    try {
      const report = useAppStore.getState().currentReport;
      if (!report) return;

      // 下载为 JSON 文件
      const json = JSON.stringify(report, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title || '未命名报告'}.dataviz.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('报告已保存到文件');
    } catch {
      message.success('报告已保存');
    }
  };

  // 获取画布元素
  const getCanvasElement = () => {
    return canvasRef.current?.querySelector('[class*="canvas"]') as HTMLElement;
  };

  // 导出 PNG/PDF/HTML/PPT
  const handleExport = async (format: 'pdf' | 'png' | 'html' | 'ppt') => {
    const canvasEl = getCanvasElement();
    if (!canvasEl) {
      message.warning('画布未找到，请先添加组件');
      return;
    }

    const formatLabel = format === 'html' ? 'HTML' : format === 'ppt' ? 'PPT' : format.toUpperCase();
    message.loading({ content: `正在导出${formatLabel}...`, key: 'export' });

    try {
      const canvas = await html2canvas(canvasEl, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      if (format === 'png') {
        // PNG 导出
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentReport?.title || '报告'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (format === 'pdf') {
        // PDF 导出：使用 canvas 生成图片，然后通过浏览器打印
        const imgData = canvas.toDataURL('image/png');
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html><head><title>${currentReport?.title || '报告'}</title>
            <style>body{margin:0;display:flex;justify-content:center;}</style></head>
            <body><img src="${imgData}" style="max-width:100%;height:auto;" onload="window.print();window.close();" /></body></html>
          `);
          printWindow.document.close();
        }
      } else if (format === 'html') {
        // HTML 导出：生成包含真实图表的独立 HTML 文件
        if (!currentReport) {
          message.warning('没有可导出的报告');
          return;
        }
        const htmlContent = generateHtmlExport(currentReport, dataSets);
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentReport.title || '报告'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'ppt') {
        // PPT 导出：通过 Electron IPC 调用主进程生成
        if (!ipcRenderer) {
          message.warning('PPT 导出仅在桌面应用中可用');
          return;
        }

        const imgData = canvas.toDataURL('image/png');
        const pageNames = currentReport?.pages.map(p => p.name) || [];
        const result = await ipcRenderer.invoke('export-ppt', {
          imageDataUrl: imgData,
          title: currentReport?.title || '报告',
          pages: currentReport?.pages.length || 1,
          pageNames,
        });

        if (!result.success) {
          if (result.error !== '用户取消') {
            message.error(`PPT 导出失败: ${result.error}`);
          } else {
            message.destroy('export');
            return;
          }
        }
      }

      message.success({ content: `导出${formatLabel}成功`, key: 'export' });
    } catch {
      message.error({ content: `导出${formatLabel}失败`, key: 'export' });
    }
  };

  // 打开文件
  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

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
      } catch {
        message.error('文件解析失败，请检查文件格式');
      }
    };
    reader.readAsText(file);

    // 重置 input 以便可以重复选择同一文件
    e.target.value = '';
  };

  // 切换页面时重置组件计数器
  useEffect(() => {
    componentCountRef.current = (currentReport?.components || []).filter(
      c => c.pageId === currentPageId
    ).length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageId]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponentId && !isInput) {
          removeComponent(selectedComponentId);
        }
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSave();
        }
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        }
        if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
        if (e.key === 'c' && selectedComponentId && !isInput) {
          e.preventDefault();
          copyComponent(selectedComponentId);
          message.success('组件已复制');
        }
        if (e.key === 'v' && !isInput) {
          e.preventDefault();
          pasteComponent();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedComponentId, undo, redo, copyComponent, pasteComponent, removeComponent]);

  return (
    <Layout className={styles.container}>
      {/* 顶部工具栏 */}
      <Header className={styles.header}>
        <div className={styles.headerLeft}>
          {titleEditing ? (
            <Input
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              onBlur={() => setTitleEditing(false)}
              onPressEnter={() => setTitleEditing(false)}
              autoFocus
              className={styles.titleInput}
            />
          ) : (
            <Title
              level={4}
              className={styles.title}
              onClick={() => setTitleEditing(true)}
            >
              {reportTitle}
              <EditOutlined className={styles.editIcon} />
            </Title>
          )}
          {!isSaved && <span className={styles.unsaved}>未保存</span>}
        </div>

        <div className={styles.headerCenter}>
          <Space>
            <Tooltip title="添加折线图">
              <Button icon={<LineChartOutlined />} onClick={() => handleAddChart('line')} />
            </Tooltip>
            <Tooltip title="添加柱状图">
              <Button icon={<BarChartOutlined />} onClick={() => handleAddChart('bar')} />
            </Tooltip>
            <Tooltip title="添加饼图">
              <Button icon={<PieChartOutlined />} onClick={() => handleAddChart('pie')} />
            </Tooltip>
            <Tooltip title="添加文本">
              <Button icon={<FontSizeOutlined />} onClick={() => handleAddText()} />
            </Tooltip>
            <Tooltip title="添加指标卡">
              <Button icon={<NumberOutlined />} onClick={() => handleAddCard()} />
            </Tooltip>
            <Tooltip title="添加表格">
              <Button icon={<TableOutlined />} onClick={() => handleAddTable()} />
            </Tooltip>
            <Tooltip title="添加图片">
              <Button icon={<PictureOutlined />} onClick={() => handleAddImage()} />
            </Tooltip>
            <Tooltip title="添加筛选器">
              <Button icon={<FilterOutlined />} onClick={() => handleAddFilter()} />
            </Tooltip>
            <span className={styles.divider} />
            <Tooltip title="删除 (Delete)">
              <Button icon={<DeleteOutlined />} onClick={handleDelete} disabled={!selectedComponentId} />
            </Tooltip>
            <span className={styles.divider} />
            <Tooltip title="撤销 (Ctrl+Z)">
              <Button icon={<UndoOutlined />} onClick={undo} />
            </Tooltip>
            <Tooltip title="重做 (Ctrl+Y)">
              <Button icon={<RedoOutlined />} onClick={redo} />
            </Tooltip>
            <span className={styles.divider} />
            <Tooltip title="复制 (Ctrl+C)">
              <Button icon={<CopyOutlined />} onClick={() => { if (selectedComponentId) { copyComponent(selectedComponentId); message.success('组件已复制'); } }} disabled={!selectedComponentId} />
            </Tooltip>
            <Tooltip title="粘贴 (Ctrl+V)">
              <Button icon={<SnippetsOutlined />} onClick={pasteComponent} />
            </Tooltip>
            <span className={styles.divider} />
            <Tooltip title="上移一层">
              <Button icon={<ArrowUpOutlined />} onClick={() => { if (selectedComponentId) moveComponentUp(selectedComponentId); }} disabled={!selectedComponentId} />
            </Tooltip>
            <Tooltip title="下移一层">
              <Button icon={<ArrowDownOutlined />} onClick={() => { if (selectedComponentId) moveComponentDown(selectedComponentId); }} disabled={!selectedComponentId} />
            </Tooltip>
            <Tooltip title="置顶">
              <Button icon={<VerticalAlignTopOutlined />} onClick={() => { if (selectedComponentId) moveComponentToTop(selectedComponentId); }} disabled={!selectedComponentId} />
            </Tooltip>
            <Tooltip title="置底">
              <Button icon={<VerticalAlignBottomOutlined />} onClick={() => { if (selectedComponentId) moveComponentToBottom(selectedComponentId); }} disabled={!selectedComponentId} />
            </Tooltip>
            <span className={styles.divider} />
            <Tooltip title="缩小">
              <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
            </Tooltip>
            <Text className={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
            <Tooltip title="放大">
              <Button icon={<ZoomInOutlined />} onClick={handleZoomIn} />
            </Tooltip>
          </Space>
        </div>

        <div className={styles.headerRight}>
          <Space>
            <Button
              icon={editMode === 'preview' ? <EditOutlined /> : <PlayCircleOutlined />}
              onClick={() => setEditMode(editMode === 'edit' ? 'preview' : 'edit')}
            >
              {editMode === 'edit' ? '预览' : '编辑'}
            </Button>
            <Button icon={<FolderOpenOutlined />} onClick={handleOpenFile}>
              打开
            </Button>
            <Button onClick={() => setTemplateModalOpen(true)}>
              模板
            </Button>
            <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>
              保存
            </Button>
            <Dropdown
              menu={{
                items: [
                  { key: 'png', label: '导出 PNG', icon: <FileImageOutlined />, onClick: () => handleExport('png') },
                  { key: 'pdf', label: '导出 PDF', icon: <FilePdfOutlined />, onClick: () => handleExport('pdf') },
                  { key: 'html', label: '导出 HTML', icon: <FileTextOutlined />, onClick: () => handleExport('html') },
                  { key: 'ppt', label: '导出 PPT', icon: <FilePptOutlined />, onClick: () => handleExport('ppt') },
                ],
              }}
            >
              <Button>导出</Button>
            </Dropdown>
            {/* 隐藏的文件选择器 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.dataviz.json"
              style={{ display: 'none' }}
              onChange={handleFileSelected}
            />
          </Space>
        </div>
      </Header>

      <Layout>
        {/* 左侧组件面板 */}
        <Sider width={240} className={styles.siderLeft}>
          <ComponentPanel
            onAddChart={handleAddChart}
            onAddText={handleAddText}
            onAddCard={handleAddCard}
            onAddTable={handleAddTable}
            onAddImage={handleAddImage}
            onAddFilter={handleAddFilter}
            dataSets={dataSets}
          />
        </Sider>

        {/* 中间画布 */}
        <Content className={styles.content}>
          {/* 页面标签栏 */}
          <div className={styles.pageTabs}>
            <Tabs
              type="editable-card"
              hideAdd
              activeKey={currentPageId || ''}
              onChange={(key) => setCurrentPage(key)}
              onEdit={(targetKey, action) => {
                if (action === 'add') {
                  addPage();
                } else if (action === 'remove' && typeof targetKey === 'string') {
                  if (currentReport && currentReport.pages.length > 1) {
                    removePage(targetKey);
                  } else {
                    message.warning('至少保留一个页面');
                  }
                }
              }}
              items={(currentReport?.pages || []).map((page) => ({
                key: page.id,
                label: page.name,
                closable: (currentReport?.pages.length || 0) > 1,
              }))}
              size="small"
              tabBarStyle={{ margin: 0, paddingLeft: 8 }}
            />
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => addPage()}
              title="新增页面"
              style={{ marginRight: 8 }}
            />
          </div>
          <div className={styles.canvasWrapper}>
            <Canvas
              ref={canvasRef}
              zoom={zoom}
              components={(currentReport?.components || []).filter(c => c.pageId === currentPageId)}
              selectedId={selectedComponentId}
              onSelect={selectComponent}
              onUpdate={updateComponent}
              onDropComponent={handleDropComponent}
              editMode={editMode}
              pageSize={currentReport?.pageSize || '16:9'}
            />
          </div>
        </Content>

        {/* 右侧属性面板 */}
        <Sider width={280} className={styles.siderRight}>
          <PropertyPanel
            component={currentReport?.components.find((c) => c.id === selectedComponentId)}
            onUpdate={(updates) => {
              if (selectedComponentId) {
                updateComponent(selectedComponentId, updates);
              }
            }}
            dataSets={dataSets}
          />
        </Sider>
      </Layout>
      <TemplateModal open={templateModalOpen} onClose={() => setTemplateModalOpen(false)} />
    </Layout>
  );
};

export default DashboardEditor;