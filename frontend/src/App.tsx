import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Home from './pages/Home';
import DataInput from './pages/DataInput';
import DashboardEditor from './pages/DashboardEditor';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 4,
          },
        }}
      >
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/data-input" element={<DataInput />} />
            <Route path="/editor" element={<DashboardEditor />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;