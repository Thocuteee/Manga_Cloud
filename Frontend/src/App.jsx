import React, { useState, useEffect } from 'react';
import api from './services/api';
import AdminDashboard from './components/AdminDashboard';
import './index.css';

const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80';

// Sample categories list for Sub-Navbar dropdown
const CATEGORIES_LIST = [
  'Action', 'Adventure', 'Anime', 'Comedy', 'Cyberpunk', 'Drama', 
  'Fantasy', 'Horror', 'Isekai', 'Manhua', 'Manhwa', 'Mecha', 
  'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Shounen', 
  'Slice of Life', 'Supernatural', 'Thriller'
];



export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('mangacloud_theme') || 'light');
  const [routePath, setRoutePath] = useState(window.location.pathname || '/');

  // User state & Bookmarks list (Default: GUEST mode)
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('GUEST'); // 'GUEST' | 'MEMBER' | 'ADMIN'
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showCategoryPopover, setShowCategoryPopover] = useState(false);

  // Auth Modal State (Login & Register)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);

  // Auth Form Fields
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');

  // Data & Toast state
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [displayCount, setDisplayCount] = useState(18);

  // Active Selected Story & Chapter for Detail/Read Routes
  const [selectedStory, setSelectedStory] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);

  // Admin View State
  const [adminActiveNav, setAdminActiveNav] = useState('Dashboard');

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setRoutePath(path);

    if (path.startsWith('/story/')) {
      const slug = path.replace('/story/', '');
      const found = stories.find(s => s.slug === slug);
      if (found) setSelectedStory(found);
    } else if (path.startsWith('/read/')) {
      const parts = path.replace('/read/', '').split('/');
      const slug = parts[0];
      const chapter = parts[1] || '1';
      const found = stories.find(s => s.slug === slug);
      if (found) {
        setSelectedStory(found);
        setSelectedChapter(chapter);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setRoutePath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mangacloud_theme', theme);
  }, [theme]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const sanitizeThumbUrl = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === '' || url.startsWith('blob:')) {
      return DEFAULT_COVER_IMAGE;
    }
    return url;
  };

  // Format relative time helper (e.g., '5 phút trước', '2 giờ trước', '1 ngày trước', '1 tháng trước', '1 năm trước')
  const formatRelativeTime = (dateInput, index = 0) => {
    if (dateInput) {
      try {
        let d = new Date(dateInput);
        if (typeof dateInput === 'string' && !dateInput.endsWith('Z') && !dateInput.includes('+')) {
          d = new Date(dateInput + 'Z');
        }
        const now = new Date();
        let diffMs = now.getTime() - d.getTime();

        // If diffMs is within 7 hours timezone offset bounds or negative, clamp to recent
        if (diffMs < 0 || (diffMs > 0 && diffMs <= 7 * 3600 * 1000 && typeof dateInput === 'string')) {
          diffMs = Math.max(0, diffMs % (7 * 3600 * 1000));
        }

        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);

        if (diffSec < 60) return 'Vừa xong';
        if (diffMin < 60) return `${diffMin} phút trước`;
        if (diffHour < 24) return `${diffHour} giờ trước`;
        if (diffDay < 30) return `${diffDay} ngày trước`;
        if (diffMonth < 12) return `${diffMonth} tháng trước`;
        return `${diffYear} năm trước`;
      } catch (e) {}
    }

    const relativeTimePresets = [
      '5 phút trước', '18 phút trước', '42 phút trước',
      '2 giờ trước', '5 giờ trước', '12 giờ trước',
      '1 ngày trước', '2 ngày trước', '4 ngày trước', '6 ngày trước',
      '1 tuần trước', '2 tuần trước', '3 tuần trước',
      '1 tháng trước', '2 tháng trước', '5 tháng trước', '9 tháng trước',
      '1 năm trước', '2 năm trước'
    ];
    return relativeTimePresets[index % relativeTimePresets.length];
  };

  // Toggle Bookmark Handler
  const toggleBookmark = (id, storyName, e) => {
    e.stopPropagation();
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast(`Đã bỏ theo dõi: ${storyName}`);
      } else {
        next.add(id);
        showToast(`❤️ Đã lưu "${storyName}" vào Theo Dõi!`);
      }
      return next;
    });
  };

  // Check persistent token & user session on app launch
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        const roleStr = parsedUser.role || parsedUser.roles?.[0] || 'ROLE_MEMBER';
        const isSystemAdmin = roleStr === 'ROLE_ADMIN' || roleStr.includes('ADMIN');
        setUserRole(isSystemAdmin ? 'ADMIN' : 'MEMBER');
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Auth Submit Handlers with Real Backend API Integration
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);

    if (authTab === 'login') {
      if (!authEmail || !authPassword) {
        showToast('Vui lòng nhập đầy đủ Email/Username và Mật khẩu!', 'error');
        setAuthLoading(false);
        return;
      }

      try {
        // Call Backend API POST /api/v1/auth/login
        const res = await api.login(authEmail, authPassword);
        const roleStr = res.role || res.roles?.[0] || (authEmail.includes('admin') ? 'ROLE_ADMIN' : 'ROLE_MEMBER');
        const isSystemAdmin = roleStr === 'ROLE_ADMIN' || roleStr.includes('ADMIN');

        const userData = {
          username: res.username || authEmail.split('@')[0],
          email: res.email || authEmail,
          role: roleStr
        };

        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setUserRole(isSystemAdmin ? 'ADMIN' : 'MEMBER');

        showToast(`🔑 Đăng nhập thành công! Chào mừng ${userData.username}`);
        setShowAuthModal(false);
        setAuthEmail('');
        setAuthPassword('');
      } catch (err) {
        showToast(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu!', 'error');
      } finally {
        setAuthLoading(false);
      }
    } else {
      // REGISTER
      if (!authUsername || !authEmail || !authPassword) {
        showToast('Vui lòng điền đầy đủ Username, Email và Mật khẩu!', 'error');
        setAuthLoading(false);
        return;
      }

      try {
        // Call Backend API POST /api/v1/auth/register
        const res = await api.register({
          username: authUsername,
          email: authEmail,
          password: authPassword
        });

        const userData = {
          username: res.username || authUsername,
          email: res.email || authEmail,
          role: res.role || 'ROLE_MEMBER'
        };

        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(userData));
        }

        setUser(userData);
        setUserRole('MEMBER');

        showToast(`🎉 Đăng ký tài khoản "${authUsername}" thành công!`);
        setShowAuthModal(false);
        setAuthUsername('');
        setAuthEmail('');
        setAuthPassword('');
      } catch (err) {
        showToast(err.message || 'Đăng ký thất bại. Tên đăng nhập hoặc Email có thể đã tồn tại!', 'error');
      } finally {
        setAuthLoading(false);
      }
    }
  };

  // Reader & Comment State
  const [chapterDetail, setChapterDetail] = useState(null);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [storyChaptersList, setStoryChaptersList] = useState([]);
  const [chapterComments, setChapterComments] = useState([]);
  const [newCommentInput, setNewCommentInput] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [storyDetailSearchQuery, setStoryDetailSearchQuery] = useState('');

  // Live Search Autocomplete State
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Catalog Filter & Pagination State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedSortFilter, setSelectedSortFilter] = useState('latest');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCurrentPage, setCatalogCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 18;

  // Load Chapter List & Detail when route changes
  useEffect(() => {
    if (routePath.startsWith('/story/')) {
      const slug = routePath.replace('/story/', '');
      loadStoryDataAndChapters(slug);
    } else if (routePath.startsWith('/read/')) {
      const parts = routePath.replace('/read/', '').split('/');
      const slug = parts[0];
      const chNum = parts[1] || '1';
      setSelectedChapter(chNum);
      loadStoryDataAndChapters(slug);
      loadChapterContentAndComments(slug, chNum);
    }
  }, [routePath]);

  const loadStoryDataAndChapters = async (slug) => {
    try {
      const storyData = await api.getStoryBySlug(slug).catch(() => null);
      if (storyData) {
        setSelectedStory(storyData);
      }
      const chapters = await api.getChaptersByStory(slug);
      if (Array.isArray(chapters) && chapters.length > 0) {
        const sorted = [...chapters].sort((a, b) => {
          const numA = parseFloat(a.chapterName || a.chapterNumber || 0);
          const numB = parseFloat(b.chapterName || b.chapterNumber || 0);
          return numA - numB;
        });
        setStoryChaptersList(sorted);
      } else {
        setStoryChaptersList([]);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách tập:', err);
      setStoryChaptersList([]);
    }
  };

  const loadChapterContentAndComments = async (slug, chNum) => {
    setChapterLoading(true);
    try {
      const chData = await api.getChapterDetail(slug, chNum);
      setChapterDetail(chData);
      const comments = await api.getCommentsByChapter(slug, chNum);
      setChapterComments(Array.isArray(comments) ? comments : []);
    } catch (err) {
      console.error('Lỗi tải nội dung chapter:', err);
    } finally {
      setChapterLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentInput.trim()) return;
    if (userRole === 'GUEST') {
      openAuth('login');
      return;
    }

    setCommentSubmitting(true);
    try {
      const slug = routePath.replace('/read/', '').split('/')[0];
      const chNum = routePath.replace('/read/', '').split('/')[1] || '1';

      await api.createComment({
        storySlug: slug,
        chapter: `Ch. ${chNum}`,
        content: newCommentInput,
        username: user?.username || 'Member'
      });

      showToast('💬 Đã gửi bình luận thành công!');
      setNewCommentInput('');
      loadChapterContentAndComments(slug, chNum);
    } catch (err) {
      showToast('Lỗi khi gửi bình luận!', 'error');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleSignOut = () => {
    api.logout();
    setUser(null);
    setUserRole('GUEST');
    showToast('Đã đăng xuất khỏi hệ thống.');
  };

  // Open Auth Modal
  const openAuth = (tab) => {
    setAuthTab(tab);
    setShowAuthModal(true);
  };

  // Fetch 100% real stories from Spring Boot Backend & MongoDB
  const fetchStoriesData = async () => {
    setLoading(true);
    try {
      const apiData = await api.getStories().catch(() => []);
      if (Array.isArray(apiData)) {
        const sanitizedApi = apiData.map((item) => ({
          ...item,
          id: item.id || item.slug,
          name: item.name || 'Bộ Truyện Chưa Đặt Tên',
          thumbUrl: sanitizeThumbUrl(item.thumbUrl),
          author: item.author || 'MangaCloud',
          categories: Array.isArray(item.categories) && item.categories.length > 0 ? item.categories : ['Manga'],
          status: item.status || 'Ongoing',
          latestChapter: item.latestChapter || 'Ch. 1',
          updatedTime: item.updatedTime || 'Mới cập nhật',
          isHot: item.viewCount > 500000 || item.isHot
        }));
        setStories(sanitizedApi);
      } else {
        setStories([]);
      }
    } catch (e) {
      console.error('API getStories failed:', e);
      setStories([]);
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

  const handleRoleSwitch = (role) => {
    setUserRole(role);
    if (role === 'GUEST') {
      setUser(null);
      showToast('Đã chuyển sang vai trò: Khách vô danh (Guest)');
    } else if (role === 'MEMBER') {
      setUser({ username: 'Kuro22', email: 'kuro22@mangacloud.com', role: 'ROLE_MEMBER' });
      showToast('Đã chuyển sang vai trò: Thành viên (Member)');
    } else if (role === 'ADMIN') {
      setUser({ username: 'Admin User', email: 'sysadmin@mangacloud.com', role: 'ROLE_ADMIN' });
      showToast('Đã chuyển sang vai trò: Quản trị viên (Admin)');
    }
  };

  // Data Sections for Homepage
  const topViewStories = [...stories].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 12);
  const featuredStories = stories.slice(0, 12);
  const latestStories = stories.slice(0, displayCount);

  // ISOLATED ADMIN DASHBOARD ROUTE
  if (routePath === '/admin') {
    return (
      <AdminDashboard
        stories={stories}
        onRefreshStories={fetchStoriesData}
        onNavigateHome={() => navigate('/')}
        showToast={showToast}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

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

      {/* AUTH MODAL DIALOG (LOGIN & REGISTER SHOWCASE) */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="auth-close-btn" onClick={() => setShowAuthModal(false)}>✕</button>

            {/* Logo Artwork & Sparkles Header */}
            <div className="auth-logo-header">
              <span className="sparkle-icon">✨</span>
              <img src="/logo.png" alt="MangaCloud Logo" className="auth-logo-img" />
              <span className="sparkle-icon">✨</span>
            </div>

            <div className="auth-title">
              {authTab === 'login' ? 'Welcome Back' : 'Join MangaCloud'}
            </div>
            <div className="auth-subtitle">
              {authTab === 'login' ? 'Sign in to continue reading.' : 'Create an account to start tracking.'}
            </div>

            {/* Segmented Tab Switcher */}
            <div className="auth-tab-switcher">
              <button
                type="button"
                className={`auth-tab-item ${authTab === 'login' ? 'active' : ''}`}
                onClick={() => setAuthTab('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={`auth-tab-item ${authTab === 'register' ? 'active' : ''}`}
                onClick={() => setAuthTab('register')}
              >
                Register
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit}>
              {authTab === 'register' && (
                <>
                  <div className="input-label-row">
                    <label>Tên tài khoản (Username)</label>
                  </div>
                  <div className="input-with-icon-wrapper">
                    <span className="input-left-icon">👤</span>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Nhập tên tài khoản..."
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </>
              )}

              <div className="input-label-row">
                <label>{authTab === 'login' ? 'Email hoặc Tên tài khoản' : 'Địa chỉ Email'}</label>
              </div>
              <div className="input-with-icon-wrapper">
                <span className="input-left-icon">{authTab === 'login' ? '👤' : '✉️'}</span>
                <input
                  type={authTab === 'login' ? 'text' : 'email'}
                  className="auth-input"
                  placeholder={authTab === 'login' ? 'Nhập email hoặc username...' : 'Nhập địa chỉ email...'}
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="input-label-row">
                <label>Mật khẩu</label>
                {authTab === 'login' && (
                  <span className="forgot-link" onClick={() => showToast('Vui lòng liên hệ Admin để khôi phục mật khẩu!', 'error')}>
                    Quên mật khẩu?
                  </span>
                )}
              </div>
              <div className="input-with-icon-wrapper">
                <span className="input-left-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Nhập mật khẩu..."
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="input-right-action"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>

              <button type="submit" className="btn-auth-submit">
                {authTab === 'login' ? (
                  <>Sign In &rarr;</>
                ) : (
                  <>Create Account 👤+</>
                )}
              </button>
            </form>

            <div className="auth-footer-terms">
              By registering, you agree to our Terms and Privacy Policy.
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP MAIN HEADER ROW */}
      <div style={{ backgroundColor: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)', width: '100%' }}>
        <header className="top-main-header">
          {/* Left: Custom Brand Logo Ổ Truyện Soft Pink Artwork */}
          <div className="header-brand" onClick={() => navigate('/')} title="Về trang chủ MangaCloud">
            <img src="/logo.png" alt="MangaCloud - Ổ Truyện Soft Pink" className="brand-logo-img" />
          </div>

          {/* Center: Search Bar with Floating Live Autocomplete Dropdown */}
          <div className="header-search" style={{ position: 'relative' }}>
            <form
              className="search-bar-input-wrapper"
              onSubmit={(e) => {
                e.preventDefault();
                if (headerSearchQuery.trim()) {
                  setCatalogSearchQuery(headerSearchQuery.trim());
                  setSelectedCategoryFilter('ALL');
                  setSelectedStatusFilter('ALL');
                  setCatalogCurrentPage(1);
                  setShowSearchDropdown(false);
                  navigate('/catalog');
                }
              }}
            >
              <input
                type="text"
                className="header-search-input"
                placeholder="Tìm truyện (One Piece, Solo Leveling...)"
                value={headerSearchQuery}
                onChange={(e) => {
                  setHeaderSearchQuery(e.target.value);
                  setShowSearchDropdown(e.target.value.trim().length > 0);
                }}
                onFocus={() => {
                  if (headerSearchQuery.trim().length > 0) setShowSearchDropdown(true);
                }}
              />
              <button type="submit" className="btn-search-icon" title="Tìm kiếm">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {/* FLOATING LIVE SEARCH AUTOCOMPLETE DROPDOWN MATCHING SCREENSHOT */}
            {showSearchDropdown && headerSearchQuery.trim() && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25)',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  zIndex: 99999,
                  padding: '6px 0'
                }}
              >
                {(() => {
                  const q = headerSearchQuery.trim().toLowerCase();
                  const results = stories.filter(s =>
                    s.name.toLowerCase().includes(q) ||
                    (s.author && s.author.toLowerCase().includes(q)) ||
                    (s.originName && s.originName.some(o => o.toLowerCase().includes(q)))
                  ).slice(0, 8);

                  if (results.length === 0) {
                    return (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        Không tìm thấy bộ truyện nào với từ khóa "<strong>{headerSearchQuery}</strong>"!
                      </div>
                    );
                  }

                  return (
                    <>
                      {results.map((story) => (
                        <div
                          key={story.id || story.slug}
                          style={{
                            display: 'flex',
                            gap: '12px',
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border-color)',
                            transition: 'background 0.15s ease'
                          }}
                          className="search-dropdown-item"
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setHeaderSearchQuery('');
                            navigate(`/story/${story.slug}`);
                          }}
                        >
                          <img
                            src={sanitizeThumbUrl(story.thumbUrl)}
                            alt={story.name}
                            style={{
                              width: '50px',
                              height: '68px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)',
                              flexShrink: 0
                            }}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_COVER_IMAGE; }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {story.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                              {story.originName?.join('; ') || story.author || 'Truyện Tranh'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--accent-pink)', fontWeight: 600, marginTop: '2px' }}>
                              {story.latestChapter ? (story.latestChapter.startsWith('Ch') ? story.latestChapter : `Chương ${story.latestChapter}`) : (story.totalChapters ? `Chương ${story.totalChapters}` : 'Chương 1')}
                            </div>
                          </div>
                        </div>
                      ))}

                      <div
                        style={{
                          padding: '12px',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--accent-pink)',
                          cursor: 'pointer',
                          backgroundColor: 'rgba(236, 72, 153, 0.05)',
                          borderTop: '1px solid var(--border-color)'
                        }}
                        onClick={() => {
                          setCatalogSearchQuery(headerSearchQuery.trim());
                          setSelectedCategoryFilter('ALL');
                          setSelectedStatusFilter('ALL');
                          setCatalogCurrentPage(1);
                          setShowSearchDropdown(false);
                          navigate('/catalog');
                        }}
                      >
                        🔍 Xem tất cả kết quả cho "{headerSearchQuery}" &rsaquo;
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="header-actions-group">
            {/* Theme Toggle Button */}
            <button className="icon-btn" onClick={toggleTheme} title={`Chuyển sang ${theme === 'light' ? 'Dark' : 'Light'} mode`}>
              {theme === 'dark' ? (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            {userRole === 'GUEST' ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-primary"
                  onClick={() => openAuth('login')}
                  style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '8px', backgroundColor: '#f472b6' }}
                >
                  Đăng Nhập
                </button>
                <button
                  className="btn-primary"
                  onClick={() => openAuth('register')}
                  style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '8px', backgroundColor: '#ec4899' }}
                >
                  Đăng Ký
                </button>
              </div>
            ) : (
              <>
                <button className="icon-btn" title="Notifications">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>

                <div className="profile-menu-container">
                  <div className="profile-trigger" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt="User Avatar"
                      className="avatar"
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        {userRole === 'MEMBER' ? (user?.username || 'Kuro22') : 'Admin User'}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--accent-pink)', fontWeight: 700, letterSpacing: '0.05em' }}>
                        {userRole === 'ADMIN' ? 'SYS_OP' : 'MEMBER'}
                      </span>
                    </div>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {showProfileDropdown && (
                    <div className="user-dropdown" onClick={() => setShowProfileDropdown(false)}>
                      <button className="dropdown-item">👤 Profile</button>
                      <button className="dropdown-item">🤍 Followed Manga ({bookmarkedIds.size})</button>
                      <button className="dropdown-item">🕒 History</button>

                      <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

                      {/* ADMIN DASHBOARD LINK (ONLY FOR ROLE_ADMIN) */}
                      {userRole === 'ADMIN' && (
                        <>
                          <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                          <button
                            className="dropdown-item admin-highlight"
                            onClick={() => navigate('/admin')}
                          >
                            🎛️ Admin Dashboard &rsaquo;
                          </button>
                        </>
                      )}

                      <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

                      <button className="dropdown-item" onClick={handleSignOut}>
                        🚪 Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </header>
      </div>

      {/* 2. SECONDARY SUB-HEADER NAVBAR MENU */}
      <nav className="sub-navbar">
        <div className="sub-navbar-container">
          <a
            href="/catalog"
            className={`sub-nav-item ${routePath === '/catalog' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setSelectedCategoryFilter('ALL');
              setSelectedStatusFilter('ALL');
              setSelectedSortFilter('latest');
              setCatalogCurrentPage(1);
              navigate('/catalog');
            }}
          >
            Truyện mới
          </a>

          <div className="category-menu-container">
            <div
              className="sub-nav-item"
              onClick={() => setShowCategoryPopover(!showCategoryPopover)}
            >
              Thể loại ▾
            </div>

            {showCategoryPopover && (
              <div className="category-dropdown-popover" onClick={() => setShowCategoryPopover(false)}>
                {CATEGORIES_LIST.map((cat) => (
                  <div
                    key={cat}
                    className="category-tag-btn"
                    onClick={() => {
                      setSelectedCategoryFilter(cat);
                      setCatalogCurrentPage(1);
                      navigate('/catalog');
                    }}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          <a
            href="/catalog"
            className="sub-nav-item"
            onClick={(e) => {
              e.preventDefault();
              setSelectedStatusFilter('Completed');
              setCatalogCurrentPage(1);
              navigate('/catalog');
            }}
          >
            Truyện Full
          </a>
          <a
            href="/catalog"
            className="sub-nav-item"
            onClick={(e) => {
              e.preventDefault();
              setSelectedSortFilter('views');
              setCatalogCurrentPage(1);
              navigate('/catalog');
            }}
          >
            Truyện Hot
          </a>
          <a
            href="/catalog"
            className="sub-nav-item"
            onClick={(e) => {
              e.preventDefault();
              setSelectedSortFilter('chapters');
              setCatalogCurrentPage(1);
              navigate('/catalog');
            }}
          >
            Truyện Dài
          </a>
          <a href="#creative" className="sub-nav-item" onClick={(e) => e.preventDefault()}>
            Truyện Sáng Tác
          </a>
          <a href="#authors" className="sub-nav-item" onClick={(e) => e.preventDefault()}>
            Tác giả/Dịch giả
          </a>
        </div>
      </nav>

      {/* 3. MAIN CONTENT CONTAINER (FULL WIDTH 1280PX CENTERED) */}
      <main className="main-container">
        {loading && (
          <div className="heart-loader-container">
            <span className="pink-heart-icon">🩷</span>
            <span className="heart-loader-text">Đang tải dữ liệu MangaCloud...</span>
          </div>
        )}

        {!loading && routePath === '/' && (
          <>
            {/* Announcement Notice Alert Box */}
            <div className="notice-alert-box">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>🔔</span>
                <div>
                  <strong style={{ fontSize: '14px', display: 'block', marginBottom: '2px' }}>Thông báo</strong>
                  <strong>MangaCloud xin trân trọng thông báo:</strong><br />
                  Nhằm mang tới trải nghiệm đọc truyện tuyệt vời nhất, MangaCloud hỗ trợ đọc mượt mà trên mọi thiết bị. Rất mong các team dịch và quý độc giả ủng hộ!
                </div>
              </div>
            </div>

            {/* SECTION 1: ĐỀ CỬ HÔM NAY (ZERO WASTED SPACE SHOWCASE) */}
            <div className="section-header">
              <h2 className="section-title">📌 ĐỀ CỬ HÔM NAY</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
              {stories.slice(0, 2).map((s) => (
                <div
                  key={s.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    gap: '18px',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onClick={() => navigate(`/story/${s.slug}`)}
                >
                  <img
                    src={sanitizeThumbUrl(s.thumbUrl)}
                    alt={s.name}
                    style={{ width: '120px', height: '160px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_COVER_IMAGE; }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--accent-pink)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        {s.categories ? s.categories.join(' • ') : 'HOT SHOWCASE'}
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.3 }}>
                        {s.name}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {s.summary}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        👤 <strong>{s.author}</strong> | 👁️ {(s.viewCount / 1000).toFixed(0)}k
                      </div>
                      <button
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '20px' }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/read/${s.slug}/1`); }}
                      >
                        📖 Đọc ngay
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* SECTION 2: TRUYỆN HOT THÁNG NÀY */}
            <div className="section-header">
              <h3 className="section-title">💖 TRUYỆN HOT THÁNG NÀY</h3>
            </div>
            <div className="manga-grid-6">
              {topViewStories.map((story, idx) => {
                const isBookmarked = bookmarkedIds.has(story.id);
                return (
                  <div key={story.id || idx} className="manga-card" onClick={() => navigate(`/story/${story.slug}`)}>
                    <div className="manga-cover-wrapper">
                      <div className="cover-badges-left">
                        <span className="manga-time-badge">🕒 {formatRelativeTime(story.updateAt, idx)}</span>
                        {(story.isHot || idx < 3) && <span className="manga-hot-badge">HOT</span>}
                      </div>

                      <button
                        className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
                        title={isBookmarked ? 'Bỏ theo dõi' : 'Thêm vào Theo Dõi'}
                        onClick={(e) => toggleBookmark(story.id, story.name, e)}
                      >
                        {isBookmarked ? '❤️' : '🤍'}
                      </button>

                      <img
                        src={sanitizeThumbUrl(story.thumbUrl)}
                        alt={story.name}
                        className="manga-cover-img"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_COVER_IMAGE; }}
                      />
                    </div>

                    <div className="manga-card-info">
                      <div className="manga-card-title">{story.name}</div>
                      <div className="manga-card-meta">
                        <span className="manga-chapter-text">
                          {story.latestChapter ? (story.latestChapter.startsWith('Ch') ? story.latestChapter : `Ch. ${story.latestChapter}`) : (story.totalChapters ? `Ch. ${story.totalChapters}` : 'Ch. 1')}
                        </span>
                        <span className="manga-author-text">👤 {story.author && story.author !== 'MangaCloud' ? story.author : 'Maslow'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SECTION 3: ĐỘC QUYỀN MANGA CLOUD */}
            <div className="section-header">
              <h3 className="section-title">📕 ĐỘC QUYỀN MANGA CLOUD</h3>
            </div>
            <div className="manga-grid-6">
              {featuredStories.map((story, idx) => {
                const isBookmarked = bookmarkedIds.has(story.id);
                return (
                  <div key={story.id || idx} className="manga-card" onClick={() => navigate(`/story/${story.slug}`)}>
                    <div className="manga-cover-wrapper">
                      <div className="cover-badges-left">
                        <span className="manga-time-badge">🕒 {formatRelativeTime(story.updateAt, idx + 4)}</span>
                        <span className="manga-hot-badge">HOT</span>
                      </div>

                      <button
                        className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
                        title={isBookmarked ? 'Bỏ theo dõi' : 'Thêm vào Theo Dõi'}
                        onClick={(e) => toggleBookmark(story.id, story.name, e)}
                      >
                        {isBookmarked ? '❤️' : '🤍'}
                      </button>

                      <img
                        src={sanitizeThumbUrl(story.thumbUrl)}
                        alt={story.name}
                        className="manga-cover-img"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_COVER_IMAGE; }}
                      />
                    </div>

                    <div className="manga-card-info">
                      <div className="manga-card-title">{story.name}</div>
                      <div className="manga-card-meta">
                        <span className="manga-chapter-text">
                          {story.latestChapter ? (story.latestChapter.startsWith('Ch') ? story.latestChapter : `Ch. ${story.latestChapter}`) : (story.totalChapters ? `Ch. ${story.totalChapters}` : 'Ch. 1')}
                        </span>
                        <span className="manga-author-text">👤 {story.author && story.author !== 'MangaCloud' ? story.author : 'Maslow'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SECTION 4: DANH SÁCH TRUYỆN TRANH MỚI CẬP NHẬT */}
            <div className="section-header">
              <h3 className="section-title">☁️ DANH SÁCH TRUYỆN TRANH MỚI CẬP NHẬT</h3>
            </div>
            <div className="manga-grid-6">
              {latestStories.map((story, idx) => {
                const isBookmarked = bookmarkedIds.has(story.id);
                return (
                  <div key={story.id || idx} className="manga-card" onClick={() => navigate(`/story/${story.slug}`)}>
                    <div className="manga-cover-wrapper">
                      <div className="cover-badges-left">
                        <span className="manga-time-badge">
                          🕒 {formatRelativeTime(story.updateAt, idx)}
                        </span>
                      </div>

                      <button
                        className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
                        title={isBookmarked ? 'Bỏ theo dõi' : 'Thêm vào Theo Dõi'}
                        onClick={(e) => toggleBookmark(story.id, story.name, e)}
                      >
                        {isBookmarked ? '❤️' : '🤍'}
                      </button>

                      <img
                        src={sanitizeThumbUrl(story.thumbUrl)}
                        alt={story.name}
                        className="manga-cover-img"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_COVER_IMAGE; }}
                      />
                    </div>

                    <div className="manga-card-info">
                      <div className="manga-card-title">{story.name}</div>
                      <div className="manga-card-meta">
                        <span className="manga-chapter-text">
                          {story.latestChapter ? (story.latestChapter.startsWith('Ch') ? story.latestChapter : `Ch. ${story.latestChapter}`) : (story.totalChapters ? `Ch. ${story.totalChapters}` : 'Ch. 1')}
                        </span>
                        <span className="manga-author-text">👤 {story.author && story.author !== 'MangaCloud' ? story.author : 'Maslow'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BROWSE ALL / CATALOG BUTTON */}
            <div className="load-more-container">
              <button
                className="btn-load-more"
                onClick={() => {
                  setCatalogCurrentPage(1);
                  navigate('/catalog');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                🔍 Xem Danh Sách & Tìm Kiếm Theo Thể Loại (Trang 1, 2, 3...)
              </button>
            </div>
          </>
        )}

        {/* ROUTE 4: CATALOG & SEARCH & FILTER PAGE ('/catalog') MATCHING SCREENSHOT 3 */}
        {routePath.startsWith('/catalog') && (
          <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '40px' }}>
            {/* 1. BREADCRUMB */}
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ cursor: 'pointer', color: 'var(--text-color)' }} onClick={() => navigate('/')}>Trang Chủ</span>
              <span>/</span>
              <span style={{ color: 'var(--accent-pink)', fontWeight: 600 }}>Tìm Kiếm & Lọc Truyện</span>
            </div>

            {/* 2. FILTER CONTROLS CARD */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '28px',
              boxShadow: 'var(--shadow-md)'
            }}>
              {/* Row 1: Categories Selector Grid */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  🏷️ Thể Loại Truyện:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    style={{
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '20px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: selectedCategoryFilter === 'ALL' ? 'var(--accent-pink)' : 'var(--bg-secondary)',
                      color: selectedCategoryFilter === 'ALL' ? '#ffffff' : 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => { setSelectedCategoryFilter('ALL'); setCatalogCurrentPage(1); }}
                  >
                    Tất cả
                  </button>
                  {CATEGORIES_LIST.map((cat) => {
                    const isActive = selectedCategoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        style={{
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '20px',
                          border: isActive ? '1px solid var(--accent-pink)' : '1px solid var(--border-color)',
                          backgroundColor: isActive ? 'var(--accent-pink)' : 'var(--bg-secondary)',
                          color: isActive ? '#ffffff' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => { setSelectedCategoryFilter(cat); setCatalogCurrentPage(1); }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Status, Sort Order & Search Bar */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Status Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <strong>Trạng thái:</strong>
                    <select
                      className="chapter-select-dropdown"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      value={selectedStatusFilter}
                      onChange={(e) => { setSelectedStatusFilter(e.target.value); setCatalogCurrentPage(1); }}
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="Ongoing">Đang tiến hành</option>
                      <option value="Completed">Đã hoàn thành</option>
                      <option value="Upcoming">Sắp ra mắt</option>
                    </select>
                  </div>

                  {/* Sort Order Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <strong>Sắp xếp theo:</strong>
                    <select
                      className="chapter-select-dropdown"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      value={selectedSortFilter}
                      onChange={(e) => { setSelectedSortFilter(e.target.value); setCatalogCurrentPage(1); }}
                    >
                      <option value="latest">⚡ Mới cập nhật</option>
                      <option value="views">🔥 Lượt xem nhiều nhất</option>
                      <option value="chapters">📑 Số chapter nhiều nhất</option>
                      <option value="name">🔤 Tên A-Z</option>
                    </select>
                  </div>
                </div>

                {/* Filter Text Search */}
                <input
                  type="text"
                  placeholder="🔍 Nhập tên truyện cần tìm..."
                  className="form-control"
                  style={{ width: '260px', padding: '8px 14px', fontSize: '13px' }}
                  value={catalogSearchQuery}
                  onChange={(e) => { setCatalogSearchQuery(e.target.value); setCatalogCurrentPage(1); }}
                />
              </div>
            </div>

            {/* 3. MANGA GRID DISPLAY */}
            {(() => {
              let filtered = stories.filter(s => {
                if (selectedCategoryFilter !== 'ALL' && (!s.categories || !s.categories.includes(selectedCategoryFilter))) {
                  return false;
                }
                if (selectedStatusFilter !== 'ALL' && s.status !== selectedStatusFilter) {
                  return false;
                }
                if (catalogSearchQuery.trim()) {
                  const q = catalogSearchQuery.trim().toLowerCase();
                  return s.name.toLowerCase().includes(q) || (s.author && s.author.toLowerCase().includes(q));
                }
                return true;
              });

              if (selectedSortFilter === 'views') {
                filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
              } else if (selectedSortFilter === 'chapters') {
                filtered.sort((a, b) => (b.totalChapters || 0) - (a.totalChapters || 0));
              } else if (selectedSortFilter === 'name') {
                filtered.sort((a, b) => a.name.localeCompare(b.name));
              }

              const totalItems = filtered.length;
              const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
              const currentPage = Math.min(catalogCurrentPage, totalPages);
              const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
              const currentStories = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

              return (
                <>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Tìm thấy <strong style={{ color: 'var(--accent-pink)' }}>{totalItems}</strong> bộ truyện phù hợp
                  </div>

                  {currentStories.length === 0 ? (
                    <div style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '60px',
                      textAlign: 'center',
                      color: 'var(--text-muted)'
                    }}>
                      <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Không tìm thấy bộ truyện nào phù hợp với bộ lọc!
                      </div>
                      <button
                        className="btn-secondary"
                        style={{ marginTop: '16px' }}
                        onClick={() => {
                          setSelectedCategoryFilter('ALL');
                          setSelectedStatusFilter('ALL');
                          setSelectedSortFilter('latest');
                          setCatalogSearchQuery('');
                        }}
                      >
                        Reset Bộ Lọc
                      </button>
                    </div>
                  ) : (
                    <div className="manga-grid-6" style={{ marginBottom: '32px' }}>
                      {currentStories.map((story, idx) => {
                        const isBookmarked = bookmarkedIds.has(story.id);
                        return (
                          <div key={story.id || idx} className="manga-card" onClick={() => navigate(`/story/${story.slug}`)}>
                            <div className="manga-cover-wrapper">
                              <div className="cover-badges-left">
                                <span className="manga-time-badge">
                                  🕒 {formatRelativeTime(story.updateAt, idx)}
                                </span>
                                {(story.viewCount > 300000 || idx < 3) && <span className="manga-hot-badge">HOT</span>}
                              </div>

                              <button
                                className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
                                title={isBookmarked ? 'Bỏ theo dõi' : 'Thêm vào Theo Dõi'}
                                onClick={(e) => toggleBookmark(story.id, story.name, e)}
                              >
                                {isBookmarked ? '❤️' : '🤍'}
                              </button>

                              <img
                                src={sanitizeThumbUrl(story.thumbUrl)}
                                alt={story.name}
                                className="manga-cover-img"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_COVER_IMAGE; }}
                              />
                            </div>

                            <div className="manga-card-info">
                              <div className="manga-card-title">{story.name}</div>
                              <div className="manga-card-meta">
                                <span className="manga-chapter-text">
                                  {story.latestChapter ? (story.latestChapter.startsWith('Ch') ? story.latestChapter : `Ch. ${story.latestChapter}`) : (story.totalChapters ? `Ch. ${story.totalChapters}` : 'Ch. 1')}
                                </span>
                                <span className="manga-author-text">👤 {story.author && story.author !== 'MangaCloud' ? story.author : 'Maslow'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 4. PAGINATION CONTROL BAR MATCHING SCREENSHOT 3 */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
                      <button
                        type="button"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-secondary)',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          opacity: currentPage === 1 ? 0.5 : 1
                        }}
                        disabled={currentPage === 1}
                        onClick={() => { setCatalogCurrentPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      >
                        «
                      </button>

                      <button
                        type="button"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-secondary)',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          opacity: currentPage === 1 ? 0.5 : 1
                        }}
                        disabled={currentPage === 1}
                        onClick={() => { setCatalogCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      >
                        ‹
                      </button>

                      {(() => {
                        const pages = [];
                        if (totalPages <= 7) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          if (currentPage > 3) pages.push('...');
                          const start = Math.max(2, currentPage - 1);
                          const end = Math.min(totalPages - 1, currentPage + 1);
                          for (let i = start; i <= end; i++) pages.push(i);
                          if (currentPage < totalPages - 2) pages.push('...');
                          pages.push(totalPages);
                        }

                        return pages.map((p, idx) => {
                          if (p === '...') {
                            return (
                              <span key={`dots-${idx}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '14px' }}>
                                ...
                              </span>
                            );
                          }
                          const isActive = p === currentPage;
                          return (
                            <button
                              key={p}
                              type="button"
                              style={{
                                minWidth: '38px',
                                height: '38px',
                                padding: '0 8px',
                                borderRadius: '50%',
                                border: isActive ? 'none' : '1px solid var(--border-color)',
                                backgroundColor: isActive ? '#f97316' : 'var(--bg-card)',
                                color: isActive ? '#ffffff' : 'var(--text-primary)',
                                fontWeight: isActive ? 700 : 500,
                                cursor: 'pointer',
                                boxShadow: isActive ? '0 4px 12px rgba(249, 115, 22, 0.3)' : 'none',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => { setCatalogCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            >
                              {p}
                            </button>
                          );
                        });
                      })()}

                      <button
                        type="button"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-secondary)',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          opacity: currentPage === totalPages ? 0.5 : 1
                        }}
                        disabled={currentPage === totalPages}
                        onClick={() => { setCatalogCurrentPage(prev => Math.min(totalPages, prev + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      >
                        ›
                      </button>

                      <button
                        type="button"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-secondary)',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          opacity: currentPage === totalPages ? 0.5 : 1
                        }}
                        disabled={currentPage === totalPages}
                        onClick={() => { setCatalogCurrentPage(totalPages); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      >
                        »
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ROUTE 2: MANGA DETAIL VIEW ('/story/:slug') */}
        {routePath.startsWith('/story/') && selectedStory && (
          <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
            {/* 1. BREADCRUMB NAVIGATION */}
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ cursor: 'pointer', color: 'var(--text-color)' }} onClick={() => navigate('/')}>Trang Chủ</span>
              <span>/</span>
              <span style={{ color: 'var(--accent-pink)', fontWeight: 600 }}>{selectedStory.name}</span>
            </div>

            {/* 2. TOP HERO CARD (2 COLUMNS) */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '28px',
              display: 'grid',
              gridTemplateColumns: '220px 1fr',
              gap: '28px',
              boxShadow: 'var(--shadow-md)',
              marginBottom: '28px'
            }}>
              {/* Left Poster Cover Column */}
              <div>
                <img
                  src={sanitizeThumbUrl(selectedStory.thumbUrl)}
                  alt={selectedStory.name}
                  style={{
                    width: '220px',
                    height: '310px',
                    objectFit: 'cover',
                    borderRadius: '14px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                    border: '1px solid var(--border-color)'
                  }}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_COVER_IMAGE; }}
                />
              </div>

              {/* Right Details Column */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.2 }}>
                    {selectedStory.name}
                  </h1>

                  {/* Metadata Grid (2 Columns) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px 24px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    marginBottom: '18px'
                  }}>
                    <div>📌 <strong>Tên khác:</strong> {selectedStory.originName?.join('; ') || selectedStory.name}</div>
                    <div>👤 <strong>Tác giả:</strong> <span style={{ color: 'var(--accent-pink)', fontWeight: 600 }}>{selectedStory.author && selectedStory.author !== 'MangaCloud' ? selectedStory.author : 'Đang cập nhật'}</span></div>
                    <div>📅 <strong>Ngày tạo:</strong> {selectedStory.createdAt ? new Date(selectedStory.createdAt).toLocaleDateString('vi-VN') : '12/08/2021'}</div>
                    <div>👥 <strong>Nhóm dịch:</strong> Pandora</div>
                    <div>📑 <strong>Tổng số chap:</strong> <strong style={{ color: 'var(--accent-pink)' }}>{selectedStory.totalChapters || storyChaptersList.length || 0}</strong></div>
                    <div>📡 <strong>Tình trạng:</strong> {selectedStory.status === 'Completed' ? 'Hoàn thành' : selectedStory.status === 'Upcoming' ? 'Sắp ra mắt' : 'Đang ra'}</div>
                    <div>👍 <strong>Lượt thích:</strong> 10,393</div>
                    <div>❤️ <strong>Lượt theo dõi:</strong> {((selectedStory.viewCount || 100000) * 0.15).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                    <div style={{ gridColumn: 'span 2' }}>
                      👁️ <strong>Lượt xem:</strong> <strong style={{ color: '#059669' }}>{selectedStory.viewCount ? selectedStory.viewCount.toLocaleString() : '48,609,172'}</strong>
                    </div>
                  </div>

                  {/* Categories Pills */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    {(selectedStory.categories || ['Action', 'Adventure', 'Fantasy', 'Shounen', 'Manhwa']).map((cat) => (
                      <span
                        key={cat}
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #f97316',
                          color: '#ea580c',
                          backgroundColor: 'rgba(249, 115, 22, 0.05)'
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ backgroundColor: '#22c55e', padding: '10px 20px', fontSize: '13px', fontWeight: 700 }}
                    onClick={() => navigate(`/read/${selectedStory.slug}/1`)}
                  >
                    📗 Đọc từ đầu
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ backgroundColor: bookmarkedIds.has(selectedStory.id) ? '#ec4899' : '#f43f5e', padding: '10px 20px', fontSize: '13px', fontWeight: 700 }}
                    onClick={(e) => toggleBookmark(selectedStory.id, selectedStory.name, e)}
                  >
                    {bookmarkedIds.has(selectedStory.id) ? '❤️ Đã theo dõi' : '❤️ Theo dõi'}
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ backgroundColor: '#a855f7', padding: '10px 20px', fontSize: '13px', fontWeight: 700 }}
                    onClick={() => showToast('👍 Cảm ơn bạn đã thích bộ truyện này!')}
                  >
                    👍 Thích
                  </button>
                </div>
              </div>
            </div>

            {/* 3. RICH GIỚI THIỆU SECTION MATCHING EXACT SCREENSHOT */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '28px',
              marginBottom: '28px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                ℹ️ Giới Thiệu
              </h3>

              {/* Sub-heading 1: Thông tin cơ bản */}
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#ea580c', marginBottom: '12px' }}>
                Thông tin cơ bản của {selectedStory.name}
              </h4>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px' }}>
                {selectedStory.originName && selectedStory.originName.length > 0 && (
                  <div><strong>Tên gốc / Tên tiếng Anh:</strong> {selectedStory.originName.join('; ')}</div>
                )}
                <div><strong>Tác giả nguyên tác:</strong> <span style={{ color: 'var(--accent-pink)', fontWeight: 600 }}>{selectedStory.author && selectedStory.author !== 'MangaCloud' ? selectedStory.author : 'Đang cập nhật'}</span></div>
                <div><strong>Thể loại:</strong> {selectedStory.categories ? selectedStory.categories.join(', ') : 'Hành động, Giả tưởng, Shounen, Manhwa'}</div>
                <div><strong>Trạng thái:</strong> {selectedStory.status === 'Completed' ? 'Hoàn thành' : 'Đang ra'}</div>
              </div>

              {/* Sub-heading 2: Hành trình cốt truyện */}
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#ea580c', marginBottom: '12px' }}>
                Hành trình cốt truyện của {selectedStory.name}
              </h4>
              <div
                style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px' }}
                dangerouslySetInnerHTML={{
                  __html: selectedStory.summary ? selectedStory.summary.replace(/<p>/g, '<p style="margin-bottom: 12px;">') : `<p>Bộ truyện <strong>${selectedStory.name}</strong> thuộc thể loại <em>${selectedStory.categories?.join(', ') || 'Truyện Tranh'}</em> được chấp bút bởi tác giả <strong>${selectedStory.author && selectedStory.author !== 'MangaCloud' ? selectedStory.author : 'Đang cập nhật'}</strong>.</p><p>Hành trình lôi cuốn và kịch tính mang tới trải nghiệm vô cùng cuốn hút cho độc giả ngay từ những chương đầu tiên!</p>`
                }}
              />

              {/* Sub-heading 3: Điều gì làm nên sức hút */}
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#ea580c', marginBottom: '12px' }}>
                Điều gì làm nên sức hút của {selectedStory.name}?
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                <strong>{selectedStory.name}</strong> là một trong những tác phẩm nổi bật nhất thuộc nhóm thể loại <strong>{selectedStory.categories ? selectedStory.categories.join(', ') : 'Action, Adventure'}</strong>, được sáng tác bởi <strong>{selectedStory.author && selectedStory.author !== 'MangaCloud' ? selectedStory.author : 'tác giả nguyên tác'}</strong> và mang đến cho độc giả Việt Nam thông qua bản dịch của nhóm dịch <strong>Pandora</strong>. Bộ truyện gây ấn tượng nhờ cách kể chuyện chặt chẽ, diễn biến hợp lý và dàn nhân vật được xây dựng có chiều sâu, tạo nên sức hút bền bỉ theo từng chương. 
                Kể từ khi ra mắt, <strong>{selectedStory.name}</strong> đã ghi nhận hơn <strong style={{ color: '#059669' }}>{selectedStory.viewCount ? selectedStory.viewCount.toLocaleString() : '48,609,172'}</strong> lượt xem và trở thành lựa chọn quen thuộc của cộng đồng yêu thích thể loại này tại MangaCloud.
              </p>
            </div>

            {/* 4. DANH SÁCH CHƯƠNG SECTION */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  📚 Danh Sách Chương ({selectedStory.totalChapters || storyChaptersList.length || 0})
                </h3>

                <input
                  type="text"
                  placeholder="🔍 Tìm nhanh số chương..."
                  className="form-control"
                  style={{ width: '220px', padding: '6px 12px', fontSize: '13px' }}
                  value={storyDetailSearchQuery}
                  onChange={(e) => setStoryDetailSearchQuery(e.target.value)}
                />
              </div>

              {/* Scrollable Chapters Table List (Latest Chapters on top) */}
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '12px'
              }}>
                <table className="admin-data-table" style={{ width: '100%' }}>
                  <tbody>
                    {(storyChaptersList.length > 0 ? storyChaptersList : Array.from({ length: selectedStory.totalChapters || 10 }, (_, i) => ({ chapterName: String(selectedStory.totalChapters ? selectedStory.totalChapters - i : 10 - i), chapterTitle: `Chương ${selectedStory.totalChapters ? selectedStory.totalChapters - i : 10 - i}` })))
                      .filter(ch => {
                        if (!storyDetailSearchQuery.trim()) return true;
                        const q = storyDetailSearchQuery.trim().toLowerCase();
                        const cNum = String(ch.chapterName || ch.chapterNumber || '');
                        const cTitle = String(ch.chapterTitle || ch.title || '').toLowerCase();
                        return cNum.includes(q) || cTitle.includes(q);
                      })
                      .slice()
                      .reverse()
                      .map((ch, idx) => {
                        const cNum = ch.chapterName || ch.chapterNumber || '1';
                        const cTitle = ch.chapterTitle || ch.title || `Chương ${cNum}`;
                        const formattedDate = ch.updatedAt 
                          ? new Date(ch.updatedAt).toLocaleDateString('vi-VN') 
                          : (() => {
                              const d = new Date();
                              d.setDate(d.getDate() - Math.floor(idx * 0.8));
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const year = d.getFullYear();
                              return `${day}/${month}/${year}`;
                            })();
                        return (
                          <tr
                            key={ch.id || cNum}
                            style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                            onClick={() => navigate(`/read/${selectedStory.slug}/${cNum}`)}
                          >
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: 'var(--text-color)' }}>
                              {cTitle.startsWith('Chương') || cTitle.startsWith('Chapter') ? cTitle : `Chương ${cNum}: ${cTitle}`}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                              {formattedDate}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ROUTE 3: CHAPTER READER SCREEN ('/read/:storySlug/:chapterName') */}
        {routePath.startsWith('/read/') && (
          <div className="webtoon-reader-screen">
            {/* TOP READER BAR */}
            <header className="reader-top-bar">
              <div className="reader-bar-left">
                <button className="btn-secondary" onClick={() => navigate(selectedStory ? `/story/${selectedStory.slug}` : '/')}>
                  ⬅️ Quay Lại
                </button>
                <div className="reader-story-title">
                  <strong>{selectedStory?.name || 'Manga'}</strong> - Chapter {selectedChapter || '1'}
                </div>
              </div>

              <div className="reader-bar-right">
                {/* QUICK CHAPTER SELECT DROPDOWN */}
                <select
                  className="chapter-select-dropdown"
                  value={selectedChapter || '1'}
                  onChange={(e) => {
                    const slug = routePath.replace('/read/', '').split('/')[0];
                    navigate(`/read/${slug}/${e.target.value}`);
                  }}
                >
                  {storyChaptersList.map((ch) => {
                    const cNum = ch.chapterName || ch.chapterNumber || '1';
                    const cTitle = ch.chapterTitle || ch.title || `Chapter ${cNum}`;
                    return (
                      <option key={ch.id || cNum} value={cNum}>
                        {cTitle.startsWith('Chapter') || cTitle.startsWith('Ch.') ? cTitle : `Chapter ${cNum}: ${cTitle}`}
                      </option>
                    );
                  })}
                </select>

                <button
                  className="btn-secondary"
                  disabled={Number(selectedChapter || 1) <= 1}
                  onClick={() => {
                    const slug = routePath.replace('/read/', '').split('/')[0];
                    navigate(`/read/${slug}/${Math.max(1, Number(selectedChapter || 1) - 1)}`);
                  }}
                >
                  ‹ Tập Trước
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const slug = routePath.replace('/read/', '').split('/')[0];
                    navigate(`/read/${slug}/${Number(selectedChapter || 1) + 1}`);
                  }}
                >
                  Tập Sau ›
                </button>
              </div>
            </header>

            {/* WEBTOON IMAGE CANVAS */}
            <main className="webtoon-canvas">
              {chapterLoading ? (
                <div className="heart-loader-container">
                  <span className="pink-heart-icon">🩷</span>
                  <span className="heart-loader-text">Đang tải trang ảnh Webtoon...</span>
                </div>
              ) : chapterDetail?.pages && chapterDetail.pages.length > 0 ? (
                chapterDetail.pages.map((imgUrl, idx) => (
                  <img
                    key={idx}
                    src={imgUrl}
                    alt={`Page ${idx + 1}`}
                    className="webtoon-page-img"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_COVER_IMAGE; }}
                  />
                ))
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div className="pink-heart-icon" style={{ fontSize: '32px', marginBottom: '12px' }}>🩷</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Đang tự động tải trang ảnh Webtoon từ Otruyen CDN...
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text-muted)' }}>
                    Vui lòng chờ trong giây lát!
                  </div>
                </div>
              )}
            </main>

            {/* BOTTOM NAV & LIVE COMMENTS */}
            <footer className="reader-bottom-section">
              <div className="reader-bottom-nav">
                <button
                  className="btn-secondary"
                  disabled={Number(selectedChapter || 1) <= 1}
                  onClick={() => navigate(`/read/${selectedStory?.slug || 'one-piece'}/${Number(selectedChapter || 1) - 1}`)}
                >
                  ‹ Tập Trước
                </button>
                <button
                  className="btn-secondary"
                  onClick={(e) => toggleBookmark(selectedStory?.id, selectedStory?.name, e)}
                >
                  {bookmarkedIds.has(selectedStory?.id) ? '❤️ Đã Theo Dõi' : '🤍 Theo Dõi Truyện'}
                </button>
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/read/${selectedStory?.slug || 'one-piece'}/${Number(selectedChapter || 1) + 1}`)}
                >
                  Tập Sau ›
                </button>
              </div>

              {/* LIVE COMMENT SECTION */}
              <div className="comments-section-container">
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  💬 Bình Luận Độc Giả ({chapterComments.length})
                </h3>

                <form onSubmit={handlePostComment} className="comment-input-form">
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder={userRole === 'GUEST' ? '🔒 Vui lòng đăng nhập để gửi bình luận...' : 'Viết bình luận của bạn về chapter này...'}
                    value={newCommentInput}
                    onChange={(e) => setNewCommentInput(e.target.value)}
                    disabled={userRole === 'GUEST' || commentSubmitting}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="submit" className="btn-primary" disabled={userRole === 'GUEST' || commentSubmitting}>
                      {commentSubmitting ? 'Đang gửi...' : '💬 Gửi Bình Luận'}
                    </button>
                  </div>
                </form>

                <div className="comments-list">
                  {chapterComments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Chưa có bình luận nào cho Chapter này. Hãy là người đầu tiên bình luận!
                    </div>
                  ) : (
                    chapterComments.map((c) => (
                      <div key={c.id || Math.random()} className="comment-card">
                        <div className="comment-avatar">👤</div>
                        <div style={{ flex: 1 }}>
                          <div className="comment-author-row">
                            <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{c.username || 'Thành Viên'}</strong>
                            <span className="comment-time">{c.time || 'vừa xong'}</span>
                          </div>
                          <div className="comment-content-text">{c.content}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </footer>
          </div>
        )}
      </main>

      {/* 4. SITE FOOTER */}
      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div>
              <div className="header-brand" onClick={() => navigate('/')} style={{ marginBottom: '12px' }}>
                <img src="/logo.png" alt="MangaCloud" className="brand-logo-img" style={{ height: '36px' }} />
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '320px' }}>
                MangaCloud - Ổ Truyện Soft Pink Theme. Nền tảng đọc truyện tranh vietsub bản quyền cao cấp nhẹ nhàng dịu mắt.
              </p>
            </div>

            <div>
              <div className="footer-col-title">Điều Hướng</div>
              <ul className="footer-links-list">
                <li><a href="/" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Truyện mới</a></li>
                <li><a href="#categories" className="footer-link">Thể loại</a></li>
                <li><a href="#rankings" className="footer-link">Truyện Hot</a></li>
                <li><a href="#new" className="footer-link">Truyện Full</a></li>
              </ul>
            </div>

            <div>
              <div className="footer-col-title">Thể Loại Hot</div>
              <ul className="footer-links-list">
                <li><a href="#romance" className="footer-link">Romance</a></li>
                <li><a href="#fantasy" className="footer-link">Fantasy</a></li>
                <li><a href="#drama" className="footer-link">Drama</a></li>
                <li><a href="#manhwa" className="footer-link">Manhwa</a></li>
              </ul>
            </div>

            <div>
              <div className="footer-col-title">Cộng Đồng & Hỗ Trợ</div>
              <ul className="footer-links-list">
                <li><a href="https://discord.com" target="_blank" rel="noreferrer" className="footer-link">Discord Server</a></li>
                <li><a href="https://github.com" target="_blank" rel="noreferrer" className="footer-link">GitHub Repository</a></li>
                <li><a href="#terms" className="footer-link">Điều khoản dịch vụ</a></li>
                <li><a href="#privacy" className="footer-link">Chính sách bảo mật</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            © 2026 MangaCloud. Premium Manga & Comic Reader. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
