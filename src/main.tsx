import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import App from './App.tsx';
import {UploadPage} from './pages/UploadPage.tsx';
import {AdminPage} from './pages/AdminPage.tsx';
import {PackageDetailPage} from './pages/PackageDetailPage.tsx';
import {ReportPage} from './pages/ReportPage.tsx';
import {AndroidPage} from './pages/AndroidPage.tsx';
import './index.css';

// Set initial theme class on document element
const savedTheme = localStorage.getItem('examforge_theme') || 
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.classList.add(savedTheme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/upload" element={<UploadPageWrapper />} />
        <Route path="/admin" element={<AdminPageWrapper />} />
        <Route path="/package/:packageId" element={<PackageDetailPageWrapper />} />
        <Route path="/report/:packageId" element={<ReportPageWrapper />} />
        <Route path="/android" element={<AndroidPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);

// Wrappers to pass shared state down
function UploadPageWrapper() {
  const username = localStorage.getItem('examforge_username') || 'Contributor';
  const showToast = (msg: string, type?: 'success' | 'info' | 'error') => {
    // Simple toast fallback
    const event = new CustomEvent('show-toast', { detail: { message: msg, type } });
    window.dispatchEvent(event);
  };
  return <UploadPage username={username} onShowToast={showToast} />;
}

function AdminPageWrapper() {
  const username = localStorage.getItem('examforge_username') || '';
  return <AdminPage currentUserUsername={username} />;
}

function PackageDetailPageWrapper() {
  const username = localStorage.getItem('examforge_username') || 'Anonymous';
  const showToast = (msg: string, type?: 'success' | 'info' | 'error') => {
    const event = new CustomEvent('show-toast', { detail: { message: msg, type } });
    window.dispatchEvent(event);
  };
  return <PackageDetailPage currentUserUsername={username} onShowToast={showToast} />;
}

function ReportPageWrapper() {
  const username = localStorage.getItem('examforge_username') || 'Anonymous';
  const showToast = (msg: string, type?: 'success' | 'info' | 'error') => {
    const event = new CustomEvent('show-toast', { detail: { message: msg, type } });
    window.dispatchEvent(event);
  };
  return <ReportPage currentUserUsername={username} onShowToast={showToast} />;
}
