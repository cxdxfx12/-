# DataViz Desktop

数据可视化报告设计器

**设计：杭州喵喵至家网络有限公司**

版本：V1.0.0

## 项目简介

DataViz Desktop 是一款本地运行的数据可视化报告制作软件。用户只需要复制数据并粘贴到软件中，系统即可自动识别数据结构，生成图表，并通过拖拽方式制作包含图表、文本、指标卡的专业数据分析页面。

## 核心功能

- 📊 **数据输入**: 支持粘贴数据、导入CSV/Excel文件
- 🔍 **自动分析**: 自动检测字段类型、识别数据异常
- 📈 **图表生成**: 支持折线图、柱状图、饼图、散点图等多种图表
- ✏️ **可视化编辑**: 拖拽式Dashboard编辑器，所见即所得
- 📄 **报告导出**: 支持导出PDF、PNG等格式

## 技术栈

- **前端**: React + TypeScript + Vite + Ant Design + ECharts
- **桌面框架**: Electron
- **后端**: Python Flask + Pandas
- **数据库**: SQLite

## 目录结构

```
DataVizDesktop/
├── frontend/          # React前端应用
├── backend/           # Python后端服务
├── electron/          # Electron主进程
├── database/          # 数据库文件
├── templates/         # 报告模板
└── installer/         # 安装程序
```

## 开发环境

### 前置要求

- Node.js >= 18.0
- Python >= 3.9
- pip

### 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装Python依赖
cd ../backend
pip install -r requirements.txt

# 安装Electron依赖
cd ..
npm install
```

### 启动开发服务器

```bash
# 方式1: 分别启动
cd frontend && npm run dev
cd backend && python app.py
cd .. && npm run dev:electron

# 方式2: 使用concurrently同时启动
npm run dev
```

### 访问地址

- 前端开发服务器: http://localhost:5173
- Python后端API: http://localhost:5000

## 构建发布

```bash
# 构建前端
npm run build:frontend

# 打包Electron应用
npm run build:electron

# 或一键构建
npm run build
```

## 快捷键

| 功能 | Mac | Windows/Linux |
|------|-----|---------------|
| 新建报告 | Cmd + N | Ctrl + N |
| 打开文件 | Cmd + O | Ctrl + O |
| 保存 | Cmd + S | Ctrl + S |
| 撤销 | Cmd + Z | Ctrl + Z |
| 重做 | Cmd + Shift + Z | Ctrl + Shift + Z |
| 删除组件 | Delete | Delete |
| 导出PDF | Cmd + Shift + P | Ctrl + Shift + P |

## 许可证

MIT License

---

© 2026 杭州喵喵至家网络有限公司