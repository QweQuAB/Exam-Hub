import {StrictMode, useState} from 'react';
import type {MouseEvent} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Routes, Route, useNavigate, useParams} from 'react-router-dom';
import App from './App.tsx';
import {UploadPage} from './pages/UploadPage.tsx';
import {AdminPage} from './pages/AdminPage.tsx';
import {PackageDetailPage} from './pages/PackageDetailPage.tsx';
import {ReportPage} from './pages/ReportPage.tsx';
import {AndroidPage} from './pages/AndroidPage.tsx';
import {ForumPackageDocument} from './types';
import {toggleLikeInFirestore, trackDownloadInFirestore, deletePackageFromFirestore} from './lib/firebase';
import './index.css';

const USERNAME_KEY = 'examforge_username';
const LIKES_KEY = 'examforge_hub_liked_ids';

// Set initial theme class on document element
const savedTheme = localStorage.getItem('examforge_theme') || 
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.classList.add(savedTheme);

function showToast(msg: string, type?: 'success' | 'info' | 'error') {
  const event = new CustomEvent('show-toast', {detail: {message: msg, type}});
  window.dispatchEvent(event);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/Exam-Hub">
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

function UploadPageWrapper() {
  const username = localStorage.getItem(USERNAME_KEY) || 'Contributor';
  return <UploadPage username={username} onShowToast={showToast} />;
}

function AdminPageWrapper() {
  const username = localStorage.getItem(USERNAME_KEY) || '';
  return <AdminPage currentUserUsername={username} />;
}

function PackageDetailPageWrapper() {
  const navigate = useNavigate();
  const {packageId} = useParams<{packageId: string}>();
  const username = localStorage.getItem(USERNAME_KEY) || 'Anonymous';
  const isAdmin = false;

  const [likedPackageIds, setLikedPackageIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(LIKES_KEY) || '[]'); }
    catch { return []; }
  });

  const handleToggleLike = async (pkg: ForumPackageDocument, e: MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyLiked = likedPackageIds.includes(pkg.id);
    const newLiked = !isCurrentlyLiked;
    const updatedIds = newLiked
      ? [...likedPackageIds, pkg.id]
      : likedPackageIds.filter((id) => id !== pkg.id);
    setLikedPackageIds(updatedIds);
    localStorage.setItem(LIKES_KEY, JSON.stringify(updatedIds));
    try {
      await toggleLikeInFirestore(pkg.id, newLiked);
      if (newLiked) showToast(`Liked "${pkg.title}"`, 'success');
    } catch (err) {
      console.error('Like toggle error:', err);
    }
  };

  const handleTrackDownload = (pkg: ForumPackageDocument, e: MouseEvent) => {
    e.stopPropagation();
    trackDownloadInFirestore(pkg.id);
  };

  const handleDelete = async (packageId: string, title: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${title}"? This cannot be undone.`)) {
      try {
        await deletePackageFromFirestore(packageId);
        showToast(`Post "${title}" deleted`, 'info');
        navigate('/');
      } catch (err: any) {
        showToast(`Delete failed: ${err.message || 'Error'}`, 'error');
      }
    }
  };

  const handleReport = (pkg: ForumPackageDocument) => {
    navigate(`/report/${pkg.id || pkg.packageId}`);
  };

  return (
    <PackageDetailPage
      username={username}
      onShowToast={showToast}
      onToggleLike={handleToggleLike}
      onTrackDownload={handleTrackDownload}
      isLiked={false}
      isAdmin={isAdmin}
      onDelete={handleDelete}
      onReport={handleReport}
    />
  );
}

function ReportPageWrapper() {
  const username = localStorage.getItem(USERNAME_KEY) || 'Anonymous';
  return <ReportPage username={username} onShowToast={showToast} />;
}
