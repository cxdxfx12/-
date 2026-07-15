import React, { useState, useEffect, forwardRef, useCallback } from 'react';
import { Typography } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import type { Component, ChartComponent, TextComponent, CardComponent, TableComponent, ImageComponent, FilterComponent, PageSize } from '../types';
import { useAppActions } from '../store';
import { PAGE_SIZE_DIMENSIONS } from '../constants';
import ChartRenderer from './ChartRenderer';
import TextEditor from './TextEditor';
import TableRenderer from './TableRenderer';
import FilterRenderer from './FilterRenderer';
import styles from './Canvas.module.css';

const { Text } = Typography;

interface CanvasProps {
  zoom: number;
  components: Component[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<Component>) => void;
  onDropComponent: (type: string, subType?: string, x?: number, y?: number) => void;
  editMode: 'edit' | 'preview';
  pageSize: PageSize;
}

// 构建组件的内联样式（应用背景、边框、阴影、透明度配置）
const buildComponentStyle = (component: Component): React.CSSProperties => {
  let bg, border, shadow, transparency;

  if (component.type === 'chart') {
    bg = (component as ChartComponent).config.background;
    border = (component as ChartComponent).config.border;
    shadow = (component as ChartComponent).config.shadow;
    transparency = (component as ChartComponent).config.transparency;
  } else if (component.type === 'text' || component.type === 'card') {
    bg = (component as TextComponent | CardComponent).background;
    border = (component as TextComponent | CardComponent).border;
    shadow = (component as TextComponent | CardComponent).shadow;
    transparency = (component as TextComponent | CardComponent).transparency;
  }

  const style: React.CSSProperties = {};

  // 背景配置
  if (bg?.show !== false) {
    if (bg?.color) {
      const alpha = bg.transparency ? 1 - bg.transparency / 100 : 1;
      style.background = bg.color;
      style.opacity = alpha;
    }
  } else {
    style.background = 'transparent';
  }

  // 边框配置
  if (border?.show !== false) {
    style.border = `${border?.width ?? 1}px solid ${border?.color || '#e0e0e0'}`;
    style.borderRadius = `${border?.radius ?? 6}px`;
  } else {
    style.border = 'none';
    style.borderRadius = `${border?.radius ?? 6}px`;
  }

  // 阴影配置
  const shadowObj = shadow || {};
  if (shadowObj.show !== false) {
    const x = shadowObj.offsetX ?? 0;
    const y = shadowObj.offsetY ?? 2;
    const blur = shadowObj.blur ?? 8;
    const spread = shadowObj.spread ?? 0;
    const color = shadowObj.color || 'rgba(0,0,0,0.08)';
    style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
  } else {
    style.boxShadow = 'none';
  }

  // 透明度（独立于背景透明度）
  if (transparency && transparency > 0) {
    style.opacity = Number(style.opacity ?? 1) * (1 - transparency / 100);
  }

  return style;
};

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({
  zoom, components, selectedId, onSelect, onUpdate, onDropComponent, editMode, pageSize,
}, ref) => {
    const [dragging, setDragging] = useState<string | null>(null);
    const [resizing, setResizing] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [alignLines, setAlignLines] = useState<{ type: 'h' | 'v'; pos: number }[]>([]);

    const { beginHistorySnapshot } = useAppActions();

    const dims = PAGE_SIZE_DIMENSIONS[pageSize] || PAGE_SIZE_DIMENSIONS['16:9'];
    const canvasWidth = dims.width;
    const canvasHeight = dims.height;

    // 开始拖拽（画布内已有组件的拖动）
    const handleMouseDown = (e: React.MouseEvent, componentId: string) => {
      if (editMode !== 'edit') return;

      e.stopPropagation();
      onSelect(componentId);

      const component = components.find((c) => c.id === componentId);
      if (!component) return;

      beginHistorySnapshot();
      setDragging(componentId);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    // 开始调整大小
    const handleResizeMouseDown = (e: React.MouseEvent, componentId: string, handle: string) => {
      if (editMode !== 'edit') return;

      e.stopPropagation();
      beginHistorySnapshot();
      setResizing(componentId);
      setResizeHandle(handle);
    };

    // 鼠标移动
    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (dragging) {
          const component = components.find((c) => c.id === dragging);
          if (!component) return;

          const container = (ref as React.RefObject<HTMLDivElement>)?.current;
          if (!container) return;
          const canvasRect = container.getBoundingClientRect();

          const rawX = (e.clientX - canvasRect.left + container.scrollLeft - dragOffset.x) / zoom;
          const rawY = (e.clientY - canvasRect.top + container.scrollTop - dragOffset.y) / zoom;

          // 对齐辅助线计算
          const threshold = 5;
          const lines: { type: 'h' | 'v'; pos: number }[] = [];
          const compCenterX = rawX + component.width / 2;
          const compCenterY = rawY + component.height / 2;
          const compRight = rawX + component.width;
          const compBottom = rawY + component.height;

          for (const other of components) {
            if (other.id === dragging) continue;
            const oCenterX = other.x + other.width / 2;
            const oCenterY = other.y + other.height / 2;
            const oRight = other.x + other.width;
            const oBottom = other.y + other.height;

            // 垂直对齐
            const vChecks = [
              { my: rawX, other: other.x },
              { my: compCenterX, other: oCenterX },
              { my: compRight, other: oRight },
            ];
            for (const check of vChecks) {
              if (Math.abs(check.my - check.other) < threshold) {
                lines.push({ type: 'v', pos: check.other });
                break;
              }
            }

            // 水平对齐
            const hChecks = [
              { my: rawY, other: other.y },
              { my: compCenterY, other: oCenterY },
              { my: compBottom, other: oBottom },
            ];
            for (const check of hChecks) {
              if (Math.abs(check.my - check.other) < threshold) {
                lines.push({ type: 'h', pos: check.other });
                break;
              }
            }
          }

          setAlignLines(lines);

          const newX = Math.max(0, Math.min(canvasWidth - component.width, rawX));
          const newY = Math.max(0, Math.min(canvasHeight - component.height, rawY));

          onUpdate(dragging, { x: newX, y: newY });
        }

        if (resizing && resizeHandle) {
          const component = components.find((c) => c.id === resizing);
          if (!component) return;

          const container = (ref as React.RefObject<HTMLDivElement>)?.current;
          if (!container) return;
          const canvasRect = container.getBoundingClientRect();

          const mouseX = (e.clientX - canvasRect.left + container.scrollLeft) / zoom;
          const mouseY = (e.clientY - canvasRect.top + container.scrollTop) / zoom;

          let newWidth = component.width;
          let newHeight = component.height;
          let newX = component.x;
          let newY = component.y;

          if (resizeHandle.includes('e')) {
            newWidth = Math.max(100, mouseX - component.x);
          }
          if (resizeHandle.includes('w')) {
            const deltaX = component.x - mouseX;
            newWidth = Math.max(100, component.width + deltaX);
            newX = mouseX;
          }
          if (resizeHandle.includes('s')) {
            newHeight = Math.max(60, mouseY - component.y);
          }
          if (resizeHandle.includes('n')) {
            const deltaY = component.y - mouseY;
            newHeight = Math.max(60, component.height + deltaY);
            newY = mouseY;
          }

          onUpdate(resizing, {
            width: newWidth,
            height: newHeight,
            x: newX,
            y: newY,
          });
        }
      },
      [dragging, resizing, resizeHandle, components, zoom, dragOffset, onUpdate, ref, canvasWidth, canvasHeight]
    );

    // 鼠标释放
    const handleMouseUp = useCallback(() => {
      setDragging(null);
      setResizing(null);
      setResizeHandle(null);
      setAlignLines([]);
    }, []);

    // 点击空白区域取消选中
    const handleCanvasClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains(styles.canvas) || (e.target as HTMLElement).classList.contains(styles.grid)) {
        onSelect(null);
      }
    };

    // ========== 拖放支持（从左侧组件面板拖入） ==========

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      // 只有离开画布容器时才取消高亮
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const { clientX, clientY } = e;
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        setDragOver(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const data = e.dataTransfer.getData('application/dataviz-component');
      if (!data) return;

      try {
        const { componentType, subType } = JSON.parse(data);

        // 计算落点在画布内的坐标（考虑滚动偏移）
        const container = e.currentTarget as HTMLElement;
        const canvasRect = container.getBoundingClientRect();
        const dropX = (e.clientX - canvasRect.left + container.scrollLeft) / zoom;
        const dropY = (e.clientY - canvasRect.top + container.scrollTop) / zoom;

        onDropComponent(componentType, subType, dropX, dropY);
      } catch {
        // ignore
      }
    };

    useEffect(() => {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [handleMouseMove, handleMouseUp]);

    return (
      <div
        ref={ref}
        className={`${styles.canvasContainer} ${dragOver ? styles.dragOver : ''}`}
        onClick={handleCanvasClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className={styles.canvas}
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${zoom})`,
          }}
        >
          {components.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyInner}>
                <PlusCircleOutlined className={styles.emptyIcon} />
                <Text strong className={styles.emptyTitle}>双击左侧组件 或 拖拽到此处</Text>
                <Text type="secondary" className={styles.emptyDesc}>
                  支持图表、文本框、指标卡等组件
                </Text>
              </div>
            </div>
          ) : (
            components.map((component) => (
              <div
                key={component.id}
                className={`${styles.component} ${
                  selectedId === component.id ? styles.selected : ''
                }`}
                style={{
                  left: component.x,
                  top: component.y,
                  width: component.width,
                  height: component.height,
                  ...buildComponentStyle(component),
                }}
                onMouseDown={(e) => handleMouseDown(e, component.id)}
              >
                {/* 组件内容 */}
                {component.type === 'chart' && (
                  <ChartRenderer component={component} />
                )}

                {component.type === 'text' && (
                  <TextEditor
                    component={component}
                    onChange={(updates) => onUpdate(component.id, updates)}
                  />
                )}

                {component.type === 'card' && (() => {
                  const card = component as CardComponent;
                  const tf = card.titleFont || {};
                  const vf = card.valueFont || {};
                  const bg = card.background;
                  const bgStyle: React.CSSProperties = bg?.gradient
                    ? { background: `linear-gradient(135deg, ${bg.gradient} 0%, ${bg.gradientEnd || '#764ba2'} 100%)` }
                    : {};
                  return (
                    <div className={styles.cardComponent} style={bgStyle}>
                      <div
                        className={styles.cardTitle}
                        style={{
                          fontSize: tf.fontSize || 14,
                          fontFamily: tf.fontFamily,
                          fontWeight: tf.bold ? 'bold' : 'normal',
                          fontStyle: tf.italic ? 'italic' : 'normal',
                          textDecoration: tf.underline ? 'underline' : 'none',
                          color: tf.color || 'rgba(255,255,255,0.9)',
                        }}
                      >
                        {card.title}
                      </div>
                      <div
                        className={styles.cardValue}
                        style={{
                          fontSize: vf.fontSize || 28,
                          fontFamily: vf.fontFamily,
                          fontWeight: vf.bold ? 'bold' : 'normal',
                          fontStyle: vf.italic ? 'italic' : 'normal',
                          textDecoration: vf.underline ? 'underline' : 'none',
                          color: vf.color || '#fff',
                        }}
                      >
                        {card.value}
                        {card.unit && <span style={{ fontSize: (vf.fontSize || 28) * 0.5, marginLeft: 4 }}>{card.unit}</span>}
                      </div>
                    </div>
                  );
                })()}

                {component.type === 'table' && (
                  <TableRenderer component={component as TableComponent} />
                )}

                {component.type === 'image' && (
                  <img
                    src={(component as ImageComponent).src}
                    alt={(component as ImageComponent).alt || ''}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    draggable={false}
                  />
                )}

                {component.type === 'filter' && (
                  <FilterRenderer
                    component={component as FilterComponent}
                    onChange={(val) => onUpdate(component.id, { value: val } as Partial<Component>)}
                  />
                )}

                {/* 选中边框和调整手柄 */}
                {selectedId === component.id && editMode === 'edit' && (
                  <>
                    <div className={styles.selectionBorder} />

                    <div className={`${styles.resizeHandle} ${styles.nw}`} onMouseDown={(e) => handleResizeMouseDown(e, component.id, 'nw')} />
                    <div className={`${styles.resizeHandle} ${styles.ne}`} onMouseDown={(e) => handleResizeMouseDown(e, component.id, 'ne')} />
                    <div className={`${styles.resizeHandle} ${styles.sw}`} onMouseDown={(e) => handleResizeMouseDown(e, component.id, 'sw')} />
                    <div className={`${styles.resizeHandle} ${styles.se}`} onMouseDown={(e) => handleResizeMouseDown(e, component.id, 'se')} />
                    <div className={`${styles.resizeHandle} ${styles.n}`} onMouseDown={(e) => handleResizeMouseDown(e, component.id, 'n')} />
                    <div className={`${styles.resizeHandle} ${styles.s}`} onMouseDown={(e) => handleResizeMouseDown(e, component.id, 's')} />
                    <div className={`${styles.resizeHandle} ${styles.w}`} onMouseDown={(e) => handleResizeMouseDown(e, component.id, 'w')} />
                    <div className={`${styles.resizeHandle} ${styles.e}`} onMouseDown={(e) => handleResizeMouseDown(e, component.id, 'e')} />
                  </>
                )}
              </div>
            ))
          )}

          {/* 网格背景 */}
          <div className={styles.grid} />

          {/* 对齐辅助线 */}
          {alignLines.map((line, idx) => (
            <div
              key={`align-${idx}`}
              className={line.type === 'v' ? styles.alignLineV : styles.alignLineH}
              style={
                line.type === 'v'
                  ? { left: line.pos }
                  : { top: line.pos }
              }
            />
          ))}

          {/* 拖放高亮指示 */}
          {dragOver && (
            <div className={styles.dropOverlay}>
              <Text className={styles.dropText}>释放以添加组件</Text>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Canvas.displayName = 'Canvas';

export default Canvas;