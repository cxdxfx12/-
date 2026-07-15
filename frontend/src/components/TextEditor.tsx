import React, { useState, useRef, useEffect } from 'react';
import type { TextComponent } from '../types';

interface TextEditorProps {
  component: TextComponent;
  onChange: (updates: Partial<TextComponent>) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ component, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(component.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(component.content);
  }, [component.content]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  };

  const handleBlur = () => {
    setEditing(false);
    if (value !== component.content) {
      onChange({ content: value });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setValue(component.content);
      setEditing(false);
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      setEditing(false);
      if (value !== component.content) {
        onChange({ content: value });
      }
    }
  };

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          fontSize: component.fontSize,
          fontFamily: component.fontFamily,
          fontWeight: component.fontWeight,
          fontStyle: component.fontStyle || 'normal',
          textDecoration: component.textDecoration || 'none',
          textAlign: component.textAlign as React.CSSProperties['textAlign'],
          color: component.color,
          lineHeight: component.lineHeight ?? 1.5,
          letterSpacing: component.letterSpacing != null ? `${component.letterSpacing}px` : undefined,
          width: '100%',
          height: '100%',
          padding: '8px',
          boxSizing: 'border-box',
          border: '2px solid #1890ff',
          borderRadius: '4px',
          outline: 'none',
          resize: 'none',
          background: '#fff',
          cursor: 'text',
        }}
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{
        fontSize: component.fontSize,
        fontFamily: component.fontFamily,
        fontWeight: component.fontWeight,
        fontStyle: component.fontStyle || 'normal',
        textDecoration: component.textDecoration || 'none',
        textAlign: component.textAlign,
        color: component.color,
        lineHeight: component.lineHeight ?? 1.5,
        letterSpacing: component.letterSpacing != null ? `${component.letterSpacing}px` : undefined,
        width: '100%',
        height: '100%',
        padding: '8px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: 'move',
      }}
    >
      {component.content || <span style={{ color: '#bfbfbf' }}>双击编辑文本</span>}
    </div>
  );
};

export default TextEditor;