import { create } from 'zustand';
import type { Report, Component, DataSet, Template, UserSettings, ReportPage } from '../types';

// ========== localStorage 持久化 ==========
const STORAGE_KEY_REPORTS = 'dataviz_reports';
const STORAGE_KEY_DATASETS = 'dataviz_datasets';
const STORAGE_KEY_SETTINGS = 'dataviz_settings';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 满或不可用
  }
}

/** 持久化所有报告 */
function persistReports(reports: Report[]): void {
  saveToStorage(STORAGE_KEY_REPORTS, reports);
}

/** 持久化数据集 */
function persistDataSets(dataSets: DataSet[]): void {
  saveToStorage(STORAGE_KEY_DATASETS, dataSets);
}

/** 持久化设置 */
function persistSettings(settings: UserSettings): void {
  saveToStorage(STORAGE_KEY_SETTINGS, settings);
}

// 应用状态
interface AppState {
  // 当前报告
  currentReport: Report | null;

  // 当前选中的组件
  selectedComponentId: string | null;

  // 当前页面ID
  currentPageId: string | null;

  // 数据集列表
  dataSets: DataSet[];

  // 模板列表
  templates: Template[];

  // 用户设置
  settings: UserSettings;

  // 是否保存
  isSaved: boolean;

  // 编辑模式
  editMode: 'edit' | 'preview';

  // 撤销/重做历史
  history: Report[];
  future: Report[];

  // 复制缓冲区
  clipboard: Component | null;

  // 数据版本号（数据集变更时递增，用于强制图表刷新）
  dataVersion: number;

  // 动作
  actions: {
    // 报告操作
    createNewReport: (template?: Template) => void;
    loadReport: (report: Report) => void;
    updateReport: (updates: Partial<Report>) => void;
    saveReport: () => void;

    // 页面操作
    addPage: (name?: string) => void;
    removePage: (pageId: string) => void;
    renamePage: (pageId: string, name: string) => void;
    setCurrentPage: (pageId: string) => void;

    // 组件操作
    addComponent: (component: Component) => void;
    updateComponent: (id: string, updates: Partial<Component>) => void;
    removeComponent: (id: string) => void;
    selectComponent: (id: string | null) => void;
    moveComponent: (id: string, x: number, y: number) => void;
    resizeComponent: (id: string, width: number, height: number) => void;

    // 数据集操作
    addDataSet: (dataSet: DataSet) => void;
    removeDataSet: (id: string) => void;

    // 设置操作
    updateSettings: (updates: Partial<UserSettings>) => void;

    // 编辑模式
    setEditMode: (mode: 'edit' | 'preview') => void;

    // 撤销/重做
    undo: () => void;
    redo: () => void;

    // 复制/粘贴
    copyComponent: (id: string) => void;
    pasteComponent: () => void;

    // 层级调整
    moveComponentUp: (id: string) => void;
    moveComponentDown: (id: string) => void;
    moveComponentToTop: (id: string) => void;
    moveComponentToBottom: (id: string) => void;

    // 历史快照
    beginHistorySnapshot: () => void;
  };
}

// 生成唯一ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 默认设置
const defaultSettings: UserSettings = {
  theme: 'light',
  language: 'zh-CN',
  autoSave: true,
  autoSaveInterval: 30000,
  defaultExportPath: '',
  recentFiles: [],
};

// 从 localStorage 加载设置
const initialSettings = loadFromStorage(STORAGE_KEY_SETTINGS, defaultSettings);

// 撤销/重做辅助
const MAX_HISTORY = 50;

function pushHistory(set: Function, get: Function) {
  const { currentReport, history } = get();
  if (!currentReport) return;
  const snapshot = JSON.parse(JSON.stringify(currentReport));
  set({
    history: [...history.slice(-MAX_HISTORY + 1), snapshot],
    future: [],
  });
}

// 创建空报告
const createEmptyReport = (): Report => {
  const defaultPageId = generateId();
  return {
    id: generateId(),
    title: '未命名报告',
    pageSize: '16:9',
    pages: [{ id: defaultPageId, name: '第1页' }],
    components: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const useAppStore = create<AppState>((set, get) => ({
  currentReport: null,
  selectedComponentId: null,
  currentPageId: null,
  dataSets: loadFromStorage(STORAGE_KEY_DATASETS, [] as DataSet[]),
  templates: [],
  settings: initialSettings,
  isSaved: true,
  editMode: 'edit',
  history: [],
  future: [],
  clipboard: null,
  dataVersion: 0,
  
  actions: {
    createNewReport: (template) => {
      const report = template?.config 
        ? { ...createEmptyReport(), ...template.config }
        : createEmptyReport();
      set({
        currentReport: report,
        isSaved: true,
        selectedComponentId: null,
        currentPageId: report.pages[0]?.id || null,
      });
      // 持久化新报告
      const reports = loadFromStorage<Report[]>(STORAGE_KEY_REPORTS, []);
      reports.push(report);
      persistReports(reports);
    },
    
    loadReport: (report) => {
      // 兼容旧报告：如果没有pages，创建默认页
      let r = report;
      if (!report.pages || report.pages.length === 0) {
        const defaultPageId = generateId();
        r = {
          ...report,
          pages: [{ id: defaultPageId, name: '第1页' }],
          components: report.components.map(c => ({ ...c, pageId: defaultPageId })),
        };
      }
      set({
        currentReport: r,
        isSaved: true,
        selectedComponentId: null,
        currentPageId: r.pages[0]?.id || null,
      });
    },
    
    updateReport: (updates) => {
      const { currentReport } = get();
      if (currentReport) {
        set({
          currentReport: {
            ...currentReport,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
          isSaved: false,
        });
      }
    },
    
    saveReport: () => {
      const { currentReport } = get();
      if (!currentReport) return;

      // 持久化到 localStorage
      const reports = loadFromStorage<Report[]>(STORAGE_KEY_REPORTS, []);
      const idx = reports.findIndex((r) => r.id === currentReport.id);
      const updatedReport = { ...currentReport, updatedAt: new Date().toISOString() };
      if (idx >= 0) {
        reports[idx] = updatedReport;
      } else {
        reports.push(updatedReport);
      }
      persistReports(reports);

      // 持久化数据集
      const { dataSets } = get();
      persistDataSets(dataSets);

      set({ isSaved: true, currentReport: updatedReport });
    },

    // 页面操作
    addPage: (name) => {
      const { currentReport } = get();
      if (currentReport) {
        pushHistory(set, get);
        const newPage: ReportPage = {
          id: generateId(),
          name: name || `第${currentReport.pages.length + 1}页`,
        };
        set({
          currentReport: {
            ...currentReport,
            pages: [...currentReport.pages, newPage],
            updatedAt: new Date().toISOString(),
          },
          currentPageId: newPage.id,
          selectedComponentId: null,
          isSaved: false,
        });
      }
    },

    removePage: (pageId) => {
      const { currentReport, currentPageId } = get();
      if (currentReport && currentReport.pages.length > 1) {
        pushHistory(set, get);
        const newPages = currentReport.pages.filter(p => p.id !== pageId);
        const newComponents = currentReport.components.filter(c => c.pageId !== pageId);
        const newCurrentPage = currentPageId === pageId ? newPages[0].id : currentPageId;
        set({
          currentReport: {
            ...currentReport,
            pages: newPages,
            components: newComponents,
            updatedAt: new Date().toISOString(),
          },
          currentPageId: newCurrentPage,
          selectedComponentId: null,
          isSaved: false,
        });
      }
    },

    renamePage: (pageId, name) => {
      const { currentReport } = get();
      if (currentReport) {
        set({
          currentReport: {
            ...currentReport,
            pages: currentReport.pages.map(p =>
              p.id === pageId ? { ...p, name } : p
            ),
            updatedAt: new Date().toISOString(),
          },
          isSaved: false,
        });
      }
    },

    setCurrentPage: (pageId) => {
      set({ currentPageId: pageId, selectedComponentId: null });
    },
    
    addComponent: (component) => {
      const { currentReport, currentPageId } = get();
      const report = currentReport || createEmptyReport();
      const pageId = component.pageId || currentPageId || report.pages[0]?.id || '';
      pushHistory(set, get);
      set({
        currentReport: {
          ...report,
          components: [...report.components, { ...component, pageId }],
          updatedAt: new Date().toISOString(),
        },
        isSaved: false,
      });
    },
    
    updateComponent: (id, updates) => {
      const { currentReport } = get();
      if (currentReport) {
        pushHistory(set, get);
        const components = currentReport.components.map((c) =>
          c.id === id ? { ...c, ...updates } as Component : c
        );
        set({
          currentReport: { ...currentReport, components, updatedAt: new Date().toISOString() },
          isSaved: false,
        });
      }
    },
    
    removeComponent: (id) => {
      const { currentReport, selectedComponentId } = get();
      if (currentReport) {
        pushHistory(set, get);
        set({
          currentReport: {
            ...currentReport,
            components: currentReport.components.filter((c) => c.id !== id),
            updatedAt: new Date().toISOString(),
          },
          selectedComponentId: selectedComponentId === id ? null : selectedComponentId,
          isSaved: false,
        });
      }
    },
    
    selectComponent: (id) => {
      set({ selectedComponentId: id });
    },
    
    moveComponent: (id, x, y) => {
      const { currentReport } = get();
      if (currentReport) {
        const components = currentReport.components.map((c) =>
          c.id === id ? { ...c, x, y } : c
        );
        set({
          currentReport: { ...currentReport, components, updatedAt: new Date().toISOString() },
          isSaved: false,
        });
      }
    },
    
    resizeComponent: (id, width, height) => {
      const { currentReport } = get();
      if (currentReport) {
        const components = currentReport.components.map((c) =>
          c.id === id ? { ...c, width, height } : c
        );
        set({
          currentReport: { ...currentReport, components, updatedAt: new Date().toISOString() },
          isSaved: false,
        });
      }
    },

    // 开始修改前记录历史快照（拖拽/缩放前调用）
    beginHistorySnapshot: () => {
      pushHistory(set, get);
    },
    
    addDataSet: (dataSet) => {
      set((state) => ({ dataSets: [...state.dataSets, dataSet], dataVersion: state.dataVersion + 1 }));
    },
    
    removeDataSet: (id) => {
      set((state) => ({ dataSets: state.dataSets.filter((d) => d.id !== id), dataVersion: state.dataVersion + 1 }));
    },
    
    updateSettings: (updates) => {
      set((state) => {
        const newSettings = { ...state.settings, ...updates };
        persistSettings(newSettings);
        return { settings: newSettings };
      });
    },
    
    setEditMode: (mode) => {
      set({ editMode: mode });
    },

    // ========== 撤销/重做 ==========
    undo: () => {
      const { history, currentReport } = get();
      if (history.length === 0) return;
      const prev = history[history.length - 1];
      set({
        history: history.slice(0, -1),
        future: currentReport ? [JSON.parse(JSON.stringify(currentReport)), ...get().future] : get().future,
        currentReport: prev,
        isSaved: false,
        selectedComponentId: null,
      });
    },

    redo: () => {
      const { future, currentReport } = get();
      if (future.length === 0) return;
      const next = future[0];
      set({
        future: future.slice(1),
        history: currentReport ? [...get().history, JSON.parse(JSON.stringify(currentReport))] : get().history,
        currentReport: next,
        isSaved: false,
        selectedComponentId: null,
      });
    },

    // ========== 复制/粘贴 ==========
    copyComponent: (id) => {
      const { currentReport } = get();
      if (!currentReport) return;
      const comp = currentReport.components.find((c) => c.id === id);
      if (comp) {
        set({ clipboard: JSON.parse(JSON.stringify(comp)) });
      }
    },

    pasteComponent: () => {
      const { clipboard, currentReport, currentPageId } = get();
      if (!clipboard || !currentReport) return;
      pushHistory(set, get);
      const newComp: Component = {
        ...JSON.parse(JSON.stringify(clipboard)),
        id: generateId(),
        x: clipboard.x + 30,
        y: clipboard.y + 30,
        pageId: currentPageId || clipboard.pageId,
      };
      set({
        currentReport: {
          ...currentReport,
          components: [...currentReport.components, newComp],
          updatedAt: new Date().toISOString(),
        },
        selectedComponentId: newComp.id,
        isSaved: false,
      });
    },

    // ========== 层级调整 ==========
    moveComponentUp: (id) => {
      const { currentReport } = get();
      if (!currentReport) return;
      const idx = currentReport.components.findIndex((c) => c.id === id);
      if (idx < currentReport.components.length - 1) {
        pushHistory(set, get);
        const comps = [...currentReport.components];
        [comps[idx], comps[idx + 1]] = [comps[idx + 1], comps[idx]];
        set({
          currentReport: { ...currentReport, components: comps, updatedAt: new Date().toISOString() },
          isSaved: false,
        });
      }
    },

    moveComponentDown: (id) => {
      const { currentReport } = get();
      if (!currentReport) return;
      const idx = currentReport.components.findIndex((c) => c.id === id);
      if (idx > 0) {
        pushHistory(set, get);
        const comps = [...currentReport.components];
        [comps[idx], comps[idx - 1]] = [comps[idx - 1], comps[idx]];
        set({
          currentReport: { ...currentReport, components: comps, updatedAt: new Date().toISOString() },
          isSaved: false,
        });
      }
    },

    moveComponentToTop: (id) => {
      const { currentReport } = get();
      if (!currentReport) return;
      const idx = currentReport.components.findIndex((c) => c.id === id);
      if (idx < currentReport.components.length - 1) {
        pushHistory(set, get);
        const comps = [...currentReport.components];
        const [item] = comps.splice(idx, 1);
        comps.push(item);
        set({
          currentReport: { ...currentReport, components: comps, updatedAt: new Date().toISOString() },
          isSaved: false,
        });
      }
    },

    moveComponentToBottom: (id) => {
      const { currentReport } = get();
      if (!currentReport) return;
      const idx = currentReport.components.findIndex((c) => c.id === id);
      if (idx > 0) {
        pushHistory(set, get);
        const comps = [...currentReport.components];
        const [item] = comps.splice(idx, 1);
        comps.unshift(item);
        set({
          currentReport: { ...currentReport, components: comps, updatedAt: new Date().toISOString() },
          isSaved: false,
        });
      }
    },
  },
}));

// 导出动作hook
export const useAppActions = () => useAppStore((state) => state.actions);

// ========== 自动保存订阅 ==========
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

useAppStore.subscribe((state) => {
  // 清除之前的定时器
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }

  // 自动保存：当 report 有未保存更改时，延迟保存
  if (!state.isSaved && state.currentReport && state.settings.autoSave) {
    autoSaveTimer = setTimeout(() => {
      const { actions } = useAppStore.getState();
      actions.saveReport();
    }, state.settings.autoSaveInterval);
  }
});