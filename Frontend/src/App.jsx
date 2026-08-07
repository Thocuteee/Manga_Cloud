import React, { useState, useEffect } from 'react';
import api from './services/api';
import './index.css';

// Helper auto-slug generator
function generateSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Auth state
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ usernameOrEmail: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Toast Notification State
  const [toast, setToast] = useState(null);

  // Search & Filter State with 300ms Debounce
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Story Form Modal State (Add / Edit)
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [storyForm, setStoryForm] = useState({
    name: '',
    originNameStr: '',
    thumbUrl: '',
    author: '',
    categoriesStr: '',
    status: 'Ongoing',
    summary: '',
    isPublic: true
  });
  const [storyFormErrors, setStoryFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Chapter Uploader State
  const [chapterForm, setChapterForm] = useState({
    storySlug: '',
    chapterName: '',
    chapterTitle: '',
    chapterApiUrl: ''
  });
  const [chapterFiles, setChapterFiles] = useState([]);
  const [chapterFormErrors, setChapterFormErrors] = useState({});
  const [chapterSubmitting, setChapterSubmitting] = useState(false);

  // Auto-dismiss Toast after 3 seconds
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load theme and auth user from localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }

    const handleUnauthorized = () => {
      setUser(null);
      setShowLoginModal(true);
      showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', 'error');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [theme]);

  // Debounce Search Term (300ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch Stories from Spring Boot Backend API
  const fetchStoriesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStories();
      setStories(data || []);
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError('Không thể kết nối đến Backend API (http://localhost:8080). Hãy chắc chắn Backend đang chạy!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoriesData();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setFormSubmitting(true);

    try {
      const data = await api.login(loginForm.usernameOrEmail, loginForm.password);
      setUser(data);
      setShowLoginModal(false);
      setLoginForm({ usernameOrEmail: '', password: '' });
      showToast('Đăng nhập thành công!');
      fetchStoriesData();
    } catch (err) {
      setLoginError(err.message || 'Đăng nhập thất bại!');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Story Modal for Creating
  const handleOpenAddStoryModal = () => {
    setEditingStory(null);
    setStoryForm({
      name: '',
      originNameStr: '',
      thumbUrl: '',
      author: '',
      categoriesStr: 'Action, Adventure, Shounen',
      status: 'Ongoing',
      summary: '',
      isPublic: true
    });
    setStoryFormErrors({});
    setShowStoryModal(true);
  };

  // Open Story Modal for Editing
  const handleOpenEditStoryModal = (story) => {
    setEditingStory(story);
    setStoryForm({
      name: story.name || '',
      originNameStr: story.originName ? story.originName.join(', ') : '',
      thumbUrl: story.thumbUrl || '',
      author: story.author || '',
      categoriesStr: story.categories ? story.categories.join(', ') : '',
      status: story.status || 'Ongoing',
      summary: story.summary || '',
      isPublic: story.isPublic !== undefined ? story.isPublic : true
    });
    setStoryFormErrors({});
    setShowStoryModal(true);
  };

  // Validate Story Form
  const validateStoryForm = () => {
    const errors = {};
    if (!storyForm.name.trim()) {
      errors.name = 'Tên bộ truyện không được để trống!';
    }
    setStoryFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Submit Story Form (Create / Update)
  const handleStoryFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateStoryForm()) return;

    setFormSubmitting(true);
    try {
      const payload = {
        name: storyForm.name.trim(),
        originName: storyForm.originNameStr ? storyForm.originNameStr.split(',').map(s => s.trim()).filter(Boolean) : [],
        thumbUrl: storyForm.thumbUrl.trim() || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80',
        author: storyForm.author.trim() || 'Đang cập nhật',
        categories: storyForm.categoriesStr ? storyForm.categoriesStr.split(',').map(s => s.trim()).filter(Boolean) : ['Manga'],
        status: storyForm.status,
        summary: storyForm.summary.trim(),
        isPublic: storyForm.isPublic
      };

      if (editingStory) {
        await api.updateStory(editingStory.id, payload);
        showToast(`Cập nhật bộ truyện "${payload.name}" thành công!`);
      } else {
        await api.createStory(payload);
        showToast(`Thêm mới bộ truyện "${payload.name}" thành công!`);
      }

      setShowStoryModal(false);
      fetchStoriesData(); // State Sync
    } catch (err) {
      showToast(err.message || 'Thao tác thất bại!', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Story
  const handleDeleteStory = async (story) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bộ truyện "${story.name}" khỏi hệ thống?`)) return;

    try {
      await api.deleteStory(story.id);
      showToast(`Đã xóa bộ truyện "${story.name}"!`);
      fetchStoriesData(); // State Sync
    } catch (err) {
      showToast(err.message || 'Xóa bộ truyện thất bại!', 'error');
    }
  };

  // Validate Chapter Form
  const validateChapterForm = () => {
    const errors = {};
    if (!chapterForm.storySlug) {
      errors.storySlug = 'Vui lòng chọn bộ truyện!';
    }
    if (!chapterForm.chapterName.trim()) {
      errors.chapterName = 'Số/Tên Chapter không được để trống (VD: 1084 hoặc Chapter 1084)!';
    }
    setChapterFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Submit Chapter Upload
  const handleChapterUploadSubmit = async (e) => {
    e.preventDefault();
    if (!validateChapterForm()) return;

    setChapterSubmitting(true);
    try {
      const payload = {
        storySlug: chapterForm.storySlug,
        chapterName: chapterForm.chapterName.trim(),
        chapterTitle: chapterForm.chapterTitle.trim() || `Chapter ${chapterForm.chapterName.trim()}`,
        chapterApiUrl: chapterForm.chapterApiUrl.trim() || (chapterFiles.length > 0 ? `local://${chapterFiles.length}-images` : 'https://api.mangacloud.net/images')
      };

      await api.createChapter(payload);
      showToast(`Đăng Chapter ${payload.chapterName} cho bộ truyện thành công!`);

      // Reset Form
      setChapterForm({
        storySlug: '',
        chapterName: '',
        chapterTitle: '',
        chapterApiUrl: ''
      });
      setChapterFiles([]);
      fetchStoriesData(); // State Sync
    } catch (err) {
      showToast(err.message || 'Đăng Chapter thất bại!', 'error');
    } finally {
      setChapterSubmitting(false);
    }
  };

  // Handle Local Image Files Select / Drop
  const handleFileDrop = (files) => {
    const fileList = Array.from(files);
    setChapterFiles(prev => [...prev, ...fileList]);
  };

  // Filter stories based on debounced search term and status filter
  const filteredStories = stories.filter(story => {
    const matchesSearch = !debouncedSearchTerm || 
      story.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      story.author?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      story.slug?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || 
      story.status?.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const totalStoriesCount = stories.length;
  const totalViewsSum = stories.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);
  const formattedTotalViews = totalViewsSum > 1000000 
    ? (totalViewsSum / 1000000).toFixed(1) + 'M' 
    : totalViewsSum > 1000 
    ? (totalViewsSum / 1000).toFixed(1) + 'k' 
    : totalViewsSum.toString();

  const navItems = [
    { name: 'Dashboard', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z' },
    { name: 'Story Management', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { name: 'Chapter Uploader', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
    { name: 'User Management', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="brand-header">
            <h1 className="brand-title">MangaCloud Admin</h1>
            <p className="brand-subtitle">Infrastructure Management</p>
          </div>

          <ul className="nav-menu">
            {navItems.map((item) => (
              <li key={item.name}>
                <a
                  href={`#${item.name}`}
                  className={`nav-item ${activeNav === item.name ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveNav(item.name);
                  }}
                >
                  <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* User Profile */}
        <div className="user-profile" style={{ flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={user ? `https://ui-avatars.com/api/?name=${user.username}&background=3b82f6&color=fff` : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
              alt="User Avatar"
              className="avatar"
            />
            <div className="user-info" style={{ flex: 1 }}>
              <span className="user-name">{user ? user.username : 'Khách (Chưa đăng nhập)'}</span>
              <span className="user-email">{user ? user.email : 'Bấm Đăng nhập để dùng API'}</span>
            </div>
          </div>

          {user ? (
            <button
              onClick={() => {
                api.logout();
                setUser(null);
                showToast('Đã đăng xuất!');
              }}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Đăng xuất
            </button>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Đăng nhập Backend
            </button>
          )}
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="search-bar">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search stories, author, slug (Debounce 300ms)..."
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="header-actions">
            <button className="icon-btn" onClick={fetchStoriesData} title="Refresh API Data">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button className="icon-btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}>
              {theme === 'dark' ? (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="content-body">
          {error && (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '13px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>⚠️ {error}</span>
              <button onClick={fetchStoriesData} style={{ background: 'none', border: 'none', textDecoration: 'underline', color: 'inherit', cursor: 'pointer' }}>
                Thử lại
              </button>
            </div>
          )}

          {/* VIEW 1: DASHBOARD */}
          {activeNav === 'Dashboard' && (
            <>
              <div className="page-header">
                <h2 className="page-title">Platform Overview</h2>
                <p className="page-subtitle">Real-time metrics connected to Spring Boot API backend.</p>
              </div>

              {/* Metrics Grid */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">TOTAL STORIES</span>
                    <svg className="metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="metric-value">{loading ? '...' : totalStoriesCount}</div>
                  <div className="metric-trend up">
                    <span>MongoDB</span>
                    <span className="trend-period">live API</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">ACTIVE READERS</span>
                    <svg className="metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="metric-value">45.2k</div>
                  <div className="metric-trend up">
                    <span>↑ 8.4%</span>
                    <span className="trend-period">vs last week</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">TOTAL VIEWS</span>
                    <svg className="metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="metric-value">{loading ? '...' : formattedTotalViews}</div>
                  <div className="metric-trend up">
                    <span>Live Views</span>
                    <span className="trend-period">total view count</span>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">MONTHLY REVENUE</span>
                    <svg className="metric-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="metric-value">$12,400</div>
                  <div className="metric-trend down">
                    <span>↓ 2.1%</span>
                    <span className="trend-period">vs last week</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Main Panels Grid */}
              <div className="dashboard-grid">
                <section className="panel-card">
                  <div className="panel-header">
                    <h3 className="panel-title">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--accent-blue)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Active Stories
                    </h3>
                    <button onClick={() => setActiveNav('Story Management')} className="view-all-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      Go to Management &rsaquo;
                    </button>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Cover</th>
                          <th>Manga Title</th>
                          <th>Status</th>
                          <th>Views</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStories.slice(0, 5).map((story) => (
                          <tr key={story.id || story.slug}>
                            <td>
                              <img
                                src={story.thumbUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80'}
                                alt={story.name}
                                className="cover-img"
                              />
                            </td>
                            <td className="manga-title">{story.name}</td>
                            <td>
                              <span className={`status-badge ${(story.status || 'ongoing').toLowerCase()}`}>
                                {story.status || 'Ongoing'}
                              </span>
                            </td>
                            <td>{story.viewCount ? story.viewCount.toLocaleString() : 0}</td>
                            <td>
                              <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleOpenEditStoryModal(story)}>
                                Sửa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <section className="panel-card">
                    <div className="panel-header">
                      <h3 className="panel-title">Quick Chapter Upload</h3>
                    </div>
                    <button
                      onClick={() => setActiveNav('Chapter Uploader')}
                      className="btn-primary"
                      style={{ width: '100%', padding: '12px' }}
                    >
                      + Chuyển Sang Trang Đăng Chapter
                    </button>
                  </section>
                </div>
              </div>
            </>
          )}

          {/* VIEW 2: STORY MANAGEMENT */}
          {activeNav === 'Story Management' && (
            <>
              <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className="page-title">Story Management</h2>
                  <p className="page-subtitle">Quản lý danh sách bộ truyện (Thêm mới, Chỉnh sửa thông tin, Xóa bộ truyện).</p>
                </div>

                <button onClick={handleOpenAddStoryModal} className="btn-primary">
                  + Thêm Truyện Mới
                </button>
              </div>

              {/* Filters Bar */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Lọc theo tên truyện, tác giả, slug (Debounce 300ms)..."
                  />
                </div>

                <select
                  className="form-select"
                  style={{ width: '180px' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ONGOING">Ongoing (Đang tiến hành)</option>
                  <option value="COMPLETED">Completed (Hoàn thành)</option>
                </select>
              </div>

              {/* Stories Table */}
              <section className="panel-card">
                <div className="table-container">
                  {loading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Đang tải danh sách bộ truyện từ API...
                    </div>
                  ) : filteredStories.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {debouncedSearchTerm ? 'Không tìm thấy bộ truyện nào khớp với từ khóa.' : 'Chưa có bộ truyện nào trong hệ thống.'}
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Ảnh bìa</th>
                          <th>Tên Bộ Truyện</th>
                          <th>Trạng thái</th>
                          <th>Tác giả</th>
                          <th>Thể loại</th>
                          <th>Lượt xem</th>
                          <th style={{ textAlign: 'right' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStories.map((story) => (
                          <tr key={story.id || story.slug}>
                            <td>
                              <img
                                src={story.thumbUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100&auto=format&fit=crop&q=80'}
                                alt={story.name}
                                className="cover-img"
                              />
                            </td>
                            <td>
                              <div className="manga-title">{story.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>slug: {story.slug}</div>
                            </td>
                            <td>
                              <span className={`status-badge ${(story.status || 'ongoing').toLowerCase()}`}>
                                {story.status || 'Ongoing'}
                              </span>
                            </td>
                            <td>{story.author || 'Chưa rõ'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {story.categories?.map((cat, idx) => (
                                  <span key={idx} style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}>
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>{story.viewCount ? story.viewCount.toLocaleString() : 0}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleOpenEditStoryModal(story)}
                                  className="btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteStory(story)}
                                  className="btn-danger"
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            </>
          )}

          {/* VIEW 3: CHAPTER UPLOADER */}
          {activeNav === 'Chapter Uploader' && (
            <>
              <div className="page-header">
                <h2 className="page-title">Chapter Uploader</h2>
                <p className="page-subtitle">Đăng chapter mới cho bộ truyện (Hỗ trợ URL danh sách ảnh hoặc chọn file từ máy tính).</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Chapter Upload Form */}
                <section className="panel-card">
                  <h3 className="panel-title" style={{ marginBottom: '16px' }}>Thông tin Chapter Mới</h3>

                  <form onSubmit={handleChapterUploadSubmit}>
                    <div className="form-group">
                      <label className="form-label">Chọn Bộ Truyện *</label>
                      <select
                        className={`form-select ${chapterFormErrors.storySlug ? 'error' : ''}`}
                        value={chapterForm.storySlug}
                        onChange={(e) => setChapterForm({ ...chapterForm, storySlug: e.target.value })}
                      >
                        <option value="">-- Chọn bộ truyện từ danh sách --</option>
                        {stories.map((story) => (
                          <option key={story.id || story.slug} value={story.slug}>
                            {story.name} ({story.slug})
                          </option>
                        ))}
                      </select>
                      {chapterFormErrors.storySlug && <div className="form-error">{chapterFormErrors.storySlug}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Số / Tên Chapter *</label>
                      <input
                        type="text"
                        className={`form-input ${chapterFormErrors.chapterName ? 'error' : ''}`}
                        placeholder="VD: 1084 hoặc Chapter 1084"
                        value={chapterForm.chapterName}
                        onChange={(e) => setChapterForm({ ...chapterForm, chapterName: e.target.value })}
                      />
                      {chapterFormErrors.chapterName && <div className="form-error">{chapterFormErrors.chapterName}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tiêu đề Chapter (Không bắt buộc)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="VD: Sự thật về ngai vàng trống"
                        value={chapterForm.chapterTitle}
                        onChange={(e) => setChapterForm({ ...chapterForm, chapterTitle: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">URL API / Danh Sách Trang Ảnh</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="VD: https://api.mangacloud.net/images/chapter-1084"
                        value={chapterForm.chapterApiUrl}
                        onChange={(e) => setChapterForm({ ...chapterForm, chapterApiUrl: e.target.value })}
                      />
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Hoặc kéo thả file ảnh ở ô bên phải để xem trước.
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={chapterSubmitting}
                      className="btn-primary"
                      style={{ width: '100%', padding: '12px', marginTop: '12px' }}
                    >
                      {chapterSubmitting ? 'Đang Đăng Chapter...' : '🚀 Bấm Đăng Chapter Mới'}
                    </button>
                  </form>
                </section>

                {/* Local File Drag & Drop Zone */}
                <section className="panel-card">
                  <h3 className="panel-title" style={{ marginBottom: '16px' }}>Kéo Thả / Chọn Trang Ảnh (Local File Preview)</h3>

                  <div
                    className="upload-box"
                    style={{ minHeight: '200px' }}
                    onClick={() => document.getElementById('chapter-file-input').click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files) handleFileDrop(e.dataTransfer.files);
                    }}
                  >
                    <input
                      id="chapter-file-input"
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files) handleFileDrop(e.target.files);
                      }}
                    />
                    <div className="upload-icon">📸</div>
                    <div className="upload-text">Click hoặc Kéo thả ảnh trang truyện vào đây</div>
                    <div className="upload-subtext">Hỗ trợ định dạng .png, .jpg, .webp</div>
                  </div>

                  {chapterFiles.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <span>Đã chọn <strong>{chapterFiles.length} trang ảnh</strong></span>
                        <button
                          onClick={() => setChapterFiles([])}
                          style={{ background: 'none', border: 'none', color: 'var(--trend-down)', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Xóa tất cả
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                        {chapterFiles.map((file, idx) => (
                          <div key={idx} style={{ position: 'relative', width: '60px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '10px', textAlign: 'center' }}>
                              #{idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </main>
      </div>

      {/* STORY MODAL (ADD / EDIT) */}
      {showStoryModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">{editingStory ? 'Chỉnh Sửa Bộ Truyện' : 'Thêm Mới Bộ Truyện'}</h3>
            <p className="modal-subtitle">Điền thông tin bộ truyện để cập nhật vào MongoDB Backend API.</p>

            <form onSubmit={handleStoryFormSubmit}>
              <div className="form-group">
                <label className="form-label">Tên Bộ Truyện *</label>
                <input
                  type="text"
                  className={`form-input ${storyFormErrors.name ? 'error' : ''}`}
                  placeholder="VD: One Piece"
                  value={storyForm.name}
                  onChange={(e) => setStoryForm({ ...storyForm, name: e.target.value })}
                />
                {storyFormErrors.name && <div className="form-error">{storyFormErrors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Tên Gọi Khác / Tên Gốc (Phân cách bởi dấu phẩy)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Đảo Hải Tặc, Vua Hải Tặc"
                  value={storyForm.originNameStr}
                  onChange={(e) => setStoryForm({ ...storyForm, originNameStr: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Tác Giả</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Eiichiro Oda"
                    value={storyForm.author}
                    onChange={(e) => setStoryForm({ ...storyForm, author: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Trạng Thái</label>
                  <select
                    className="form-select"
                    value={storyForm.status}
                    onChange={(e) => setStoryForm({ ...storyForm, status: e.target.value })}
                  >
                    <option value="Ongoing">Ongoing (Đang tiến hành)</option>
                    <option value="Completed">Completed (Hoàn thành)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Thể Loại (Phân cách bởi dấu phẩy)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Action, Adventure, Shounen, Fantasy"
                  value={storyForm.categoriesStr}
                  onChange={(e) => setStoryForm({ ...storyForm, categoriesStr: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL Ảnh Bìa (Thumb URL)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://..."
                  value={storyForm.thumbUrl}
                  onChange={(e) => setStoryForm({ ...storyForm, thumbUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mô Tả Tóm Tắt</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Nhập nội dung tóm tắt bộ truyện..."
                  value={storyForm.summary}
                  onChange={(e) => setStoryForm({ ...storyForm, summary: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowStoryModal(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn-primary"
                >
                  {formSubmitting ? 'Đang Lưu...' : editingStory ? 'Lưu Thay Đổi' : 'Tạo Truyện Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ width: '380px' }}>
            <h3 className="modal-title">Đăng Nhập Backend API</h3>
            <p className="modal-subtitle">Nhập tài khoản & mật khẩu để nhận Token JWT.</p>

            {loginError && (
              <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '12px', marginBottom: '16px' }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Username hoặc Email</label>
                <input
                  type="text"
                  required
                  value={loginForm.usernameOrEmail}
                  onChange={(e) => setLoginForm({ ...loginForm, usernameOrEmail: e.target.value })}
                  placeholder="tho1 hoặc email@example.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn-primary"
                >
                  {formSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
