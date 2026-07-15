const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const pptxgen = require('pptxgenjs');

// 判断是否是开发模式
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 主窗口
let mainWindow = null;

// 后端进程
let backendProcess = null;

// 启动 Python 后端
function startBackend() {
  if (isDev) {
    // 开发模式下，假设后端已手动启动
    console.log('[Dev] Backend should be started manually on port 5000');
    return;
  }

  // 生产模式下，启动打包的后端 exe
  const backendPath = path.join(process.resourcesPath, 'backend', 'backend.exe');
  console.log('[Backend] Starting:', backendPath);

  backendProcess = spawn(backendPath, [], {
    stdio: 'pipe',
    windowsHide: true,
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend] ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error] ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`[Backend] Process exited with code ${code}`);
    backendProcess = null;
  });

  backendProcess.on('error', (err) => {
    console.error('[Backend] Failed to start:', err.message);
  });
}

// 停止后端进程
function stopBackend() {
  if (backendProcess) {
    console.log('[Backend] Stopping...');
    backendProcess.kill();
    backendProcess = null;
  }
}

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'DataViz Desktop - 数据可视化报告设计器',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  // 加载页面
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  // 创建菜单
  createMenu();
}

// 创建菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建报告',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-report');
          },
        },
        {
          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              filters: [{ name: 'DataViz Report', extensions: ['report'] }],
              properties: ['openFile'],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send('open-file', result.filePaths[0]);
            }
          },
        },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save');
          },
        },
        { type: 'separator' },
        {
          label: '导出PDF',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => {
            mainWindow.webContents.send('menu-export-pdf');
          },
        },
        {
          label: '导出PNG',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            mainWindow.webContents.send('menu-export-png');
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 DataViz Desktop',
              message: 'DataViz Desktop',
              detail: '版本: V1.0.0\n\n数据可视化报告设计器\n\n© 2026 杭州喵喵至家网络有限公司',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC处理
// 保存文件
ipcMain.handle('save-file', async (event, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'DataViz Report', extensions: ['report'] }],
    defaultPath: '未命名报告.report',
  });
  
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(content, null, 2));
    return { success: true, path: result.filePath };
  }
  
  return { success: false };
});

// 打开文件
ipcMain.handle('open-file', async (event, filePath) => {
  try {
    if (!filePath) {
      const result = await dialog.showOpenDialog(mainWindow, {
        filters: [{ name: 'DataViz Report', extensions: ['report'] }],
        properties: ['openFile'],
      });
      
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false };
      }
      
      filePath = result.filePaths[0];
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data: JSON.parse(content), path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 选择导出路径
ipcMain.handle('select-export-path', async (event, defaultName, filters) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: filters,
  });

  return result;
});

// 导出 PPT
ipcMain.handle('export-ppt', async (event, { imageDataUrl, title, pages, pageNames }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `${title || '报告'}.pptx`,
      filters: [{ name: 'PowerPoint', extensions: ['pptx'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: '用户取消' };
    }

    const pptx = new pptxgen();
    pptx.defineLayout({ name: 'WIDE', width: '12.8', height: '7.2' });
    pptx.layout = 'WIDE';

    // 封面页
    const slide1 = pptx.addSlide();
    slide1.background = { color: '1890ff' };
    slide1.addText(title || '报告', {
      x: 1, y: 2.5, w: 10.8, h: 1.5,
      fontSize: 40, bold: true, color: 'FFFFFF',
      align: 'center', fontFace: 'Microsoft YaHei',
    });
    slide1.addText(new Date().toLocaleString('zh-CN'), {
      x: 1, y: 4, w: 10.8, h: 0.6,
      fontSize: 16, color: 'FFFFFF', align: 'center', fontFace: 'Microsoft YaHei',
    });

    // 将 base64 图片写入临时文件
    const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, '');
    const tmpDir = path.join(app.getPath('temp'), 'dataviz');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const tmpImagePath = path.join(tmpDir, `slide-${Date.now()}.png`);
    fs.writeFileSync(tmpImagePath, Buffer.from(base64Data, 'base64'));

    // 内容页
    for (let i = 0; i < (pages || 1); i++) {
      const slide = pptx.addSlide();
      const pageName = pageNames?.[i] || `第${i + 1}页`;

      slide.addText(pageName, {
        x: 0.5, y: 0.2, w: 11.8, h: 0.5,
        fontSize: 18, bold: true, color: '1890ff', fontFace: 'Microsoft YaHei',
      });

      if (i === 0) {
        slide.addImage({ path: tmpImagePath, x: 0.5, y: 0.9, w: 11.8, h: 5.8 });
      } else {
        slide.addText('（请切换到对应页面后单独导出该页，或将各页图像插入此处）', {
          x: 1, y: 2, w: 10.8, h: 2,
          fontSize: 14, color: '999999', align: 'center', fontFace: 'Microsoft YaHei',
        });
      }
    }

    // 保存 PPT
    await pptx.writeFile({ fileName: result.filePath });

    // 清理临时文件
    try { fs.unlinkSync(tmpImagePath); } catch {}

    return { success: true, path: result.filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 应用启动
app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 应用关闭
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});