import React, { useState, useEffect } from 'react';
import api from './services/api';
import './index.css';

const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80';

// Sample categories list for Sub-Navbar dropdown
const CATEGORIES_LIST = [
  'Action', 'Adventure', 'Anime', 'Comedy', 'Cyberpunk', 'Drama', 
  'Fantasy', 'Horror', 'Isekai', 'Manhua', 'Manhwa', 'Mecha', 
  'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Shounen', 
  'Slice of Life', 'Supernatural', 'Thriller'
];

// Mockdata items for Homepage Banner & Grid Seeding (12 Rich Items)
const INITIAL_MOCK_STORIES = [
  {
    id: 's1',
    name: 'Vô Tình Lệch Khỏi Quỹ Đạo',
    slug: 'vo-tinh-lech-khoi-quy-dao',
    thumbUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80',
    author: 'Diệu Linh',
    categories: ['Romance', 'Drama'],
    status: 'Ongoing',
    summary: 'Tôi ở bên vị đại lão giới thượng lưu Hồng Kông suốt ba năm, đến đúng ngày anh đính hôn thì tôi quyết định cắt đứt quan hệ và rời đi...',
    viewCount: 1250000,
    updatedTime: '10 phút trước',
    latestChapter: 'Ch. 124',
    isHot: true
  },
  {
    id: 's2',
    name: 'Bạn Cùng Phòng Là Người Thực Vật',
    slug: 'ban-cung-phong-la-nguoi-thuc-vat',
    thumbUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80',
    author: 'An An',
    categories: ['Supernatural', 'Romance'],
    status: 'Ongoing',
    summary: 'Tôi lại bắt đầu đi quấy rầy anh bạn cùng phòng là người thực vật. Lải nhải bên tai anh ấy về những bí mật không ai biết...',
    viewCount: 980000,
    updatedTime: '30 phút trước',
    latestChapter: 'Ch. 45',
    isHot: true
  },
  {
    id: 's3',
    name: 'Monolith Protocol',
    slug: 'monolith-protocol',
    thumbUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
    author: 'DevGod',
    categories: ['Mystery', 'Thriller'],
    status: 'Completed',
    summary: 'Deep inside the ancient server ruins, an archaic protocol awakens to judge humanity.',
    viewCount: 840000,
    updatedTime: '1 giờ trước',
    latestChapter: 'Ch. 180',
    isHot: true
  },
  {
    id: 's4',
    name: 'Hạ Giới Lãng Mạn',
    slug: 'ha-gioi-lang-man',
    thumbUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80',
    author: 'Hạ Vy',
    categories: ['Romance', 'Fantasy'],
    status: 'Ongoing',
    summary: 'Chuyện tình lãng mạn giữa thế giới thần tiên và trần thế khi định mệnh đan xen.',
    viewCount: 750000,
    updatedTime: '2 giờ trước',
    latestChapter: 'Ch. 42'
  },
  {
    id: 's5',
    name: 'Anh Và Cố Nhân',
    slug: 'anh-va-co-nhan',
    thumbUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    author: 'Phương Thảo',
    categories: ['Drama', 'Romance'],
    status: 'Ongoing',
    summary: 'Những ký ức xưa cũ trỗi dậy giữa hai con người từng thương nhưng vì hiểu lầm mà xa cách.',
    viewCount: 690000,
    updatedTime: '4 giờ trước',
    latestChapter: 'Ch. 108'
  },
  {
    id: 's6',
    name: 'Midnight Brew',
    slug: 'midnight-brew',
    thumbUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
    author: 'CoffeeBean',
    categories: ['Slice of Life', 'Supernatural'],
    status: 'Ongoing',
    summary: 'A cozy coffee shop that opens only at midnight for supernatural beings seeking warmth.',
    viewCount: 520000,
    updatedTime: '5 giờ trước',
    latestChapter: 'Ch. 15'
  },
  {
    id: 's7',
    name: 'Framework Zero',
    slug: 'framework-zero',
    thumbUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    author: 'ReactNinja',
    categories: ['Action', 'Sci-Fi'],
    status: 'Ongoing',
    summary: 'The ultimate virtual reality tournament where warriors build custom combat modules.',
    viewCount: 480000,
    updatedTime: '8 giờ trước',
    latestChapter: 'Ch. 88'
  },
  {
    id: 's8',
    name: 'Cloud Native',
    slug: 'cloud-native',
    thumbUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80',
    author: 'SkyWalker',
    categories: ['Adventure', 'Fantasy'],
    status: 'Ongoing',
    summary: 'Island kingdoms floating in the troposphere wage war over cloud water crystals.',
    viewCount: 410000,
    updatedTime: '12 giờ trước',
    latestChapter: 'Ch. 3'
  },
  {
    id: 's9',
    name: 'Null Pointer',
    slug: 'null-pointer',
    thumbUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80',
    author: 'SegFault',
    categories: ['Horror', 'Psychological'],
    status: 'Completed',
    summary: 'Memory leaks in human consciousness cause people to forget their own identity.',
    viewCount: 390000,
    updatedTime: '1 ngày trước',
    latestChapter: 'Vol. 4'
  },
  {
    id: 's10',
    name: 'Đảo Hải Tặc (One Piece)',
    slug: 'one-piece',
    thumbUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80',
    author: 'Eiichiro Oda',
    categories: ['Action', 'Adventure'],
    status: 'Ongoing',
    summary: 'Hành trình tìm kiếm kho báu One Piece của thuyền trưởng Monkey D. Luffy và đồng đội!',
    viewCount: 45000000,
    updatedTime: '1 ngày trước',
    latestChapter: 'Ch. 1104',
    isHot: true
  },
  {
    id: 's11',
    name: 'Solo Leveling (Tôi Thăng Cấp Một Mình)',
    slug: 'solo-leveling',
    thumbUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80',
    author: 'Chugong',
    categories: ['Action', 'Fantasy'],
    status: 'Completed',
    summary: 'Hành trình thợ săn yếu nhất Hạng E Sung Jin-Woo trở thành Thần Thợ Săn đỉnh phong.',
    viewCount: 28000000,
    updatedTime: '2 ngày trước',
    latestChapter: 'Ch. 179',
    isHot: true
  },
  {
    id: 's12',
    name: 'Monster (Quái Vật)',
    slug: 'monster',
    thumbUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
    author: 'Naoki Urasawa',
    categories: ['Mystery', 'Thriller'],
    status: 'Completed',
    summary: 'Bác sĩ Tenma truy tìm sự thật kinh hoàng đằng sau Johan Liebert.',
    viewCount: 8200000,
    updatedTime: '3 ngày trước',
    latestChapter: 'Ch. 162'
  }
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

  // Fetch stories & Merge with Mocks so 6-Column Grid is ALWAYS 100% full!
  const fetchStoriesData = async () => {
    setLoading(true);
    try {
      const apiData = await api.getStories().catch(() => []);
      if (apiData && apiData.length > 0) {
        const sanitizedApi = apiData.map((item) => ({
          ...item,
          id: item.id || item.slug,
          thumbUrl: sanitizeThumbUrl(item.thumbUrl),
          author: item.author || 'MangaCloud',
          latestChapter: item.latestChapter || 'Ch. 1',
          updatedTime: item.updatedTime || '10 phút trước',
          isHot: item.viewCount > 500000 || item.isHot
        }));

        const existingSlugs = new Set(sanitizedApi.map(s => s.slug));
        const remainingMocks = INITIAL_MOCK_STORIES.filter(m => !existingSlugs.has(m.slug));
        setStories([...sanitizedApi, ...remainingMocks]);
      } else {
        setStories(INITIAL_MOCK_STORIES);
      }
    } catch (e) {
      setStories(INITIAL_MOCK_STORIES);
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

          {/* Center: Search Bar with Search Button */}
          <div className="header-search">
            <div className="search-bar-input-wrapper">
              <input
                type="text"
                className="header-search-input"
                placeholder="Tìm truyện..."
              />
              <button className="btn-search-icon" title="Tìm kiếm">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
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
            href="/"
            className={`sub-nav-item ${routePath === '/' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/'); }}
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
                  <div key={cat} className="category-tag-btn">
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          <a href="#full" className="sub-nav-item" onClick={(e) => e.preventDefault()}>
            Truyện Full
          </a>
          <a href="#hot" className="sub-nav-item" onClick={(e) => e.preventDefault()}>
            Truyện Hot
          </a>
          <a href="#long" className="sub-nav-item" onClick={(e) => e.preventDefault()}>
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
        {/* ROUTE 1: HOMEPAGE ('/') */}
        {routePath === '/' && (
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
                        <span className="manga-time-badge">🕒 {story.updatedTime || '10p trước'}</span>
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
                        <span className="manga-chapter-text">{story.latestChapter || 'Ch. 1'}</span>
                        <span className="manga-author-text">👤 {story.author || 'MangaCloud'}</span>
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
                        <span className="manga-time-badge">🕒 {story.updatedTime || '15p trước'}</span>
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
                        <span className="manga-chapter-text">{story.latestChapter || 'Ch. 1'}</span>
                        <span className="manga-author-text">👤 {story.author || 'MangaCloud'}</span>
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
                        <span className="manga-time-badge">🕒 {story.updatedTime || 'vừa xong'}</span>
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
                        <span className="manga-chapter-text">{story.latestChapter || 'Ch. 1'}</span>
                        <span className="manga-author-text">👤 {story.author || 'MangaCloud'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LOAD MORE BUTTON */}
            <div className="load-more-container">
              <button
                className="btn-load-more"
                onClick={() => {
                  setDisplayCount(prev => prev + 6);
                  showToast('Đã tải thêm danh sách truyện mới!');
                }}
              >
                Xem thêm nhiều truyện
              </button>
            </div>
          </>
        )}

        {/* ROUTE 2: MANGA DETAIL VIEW ('/story/:slug') */}
        {routePath.startsWith('/story/') && selectedStory && (
          <div className="detail-container">
            <div>
              <img
                src={sanitizeThumbUrl(selectedStory.thumbUrl)}
                alt={selectedStory.name}
                className="detail-cover"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_COVER_IMAGE; }}
              />
              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: '16px', padding: '12px' }}
                onClick={() => navigate(`/read/${selectedStory.slug}/1`)}
              >
                📖 Đọc Từ Chapter 1
              </button>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--accent-pink)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                {selectedStory.categories ? selectedStory.categories.join(' • ') : 'Manga'}
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {selectedStory.name}
              </h1>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Tác giả: <strong>{selectedStory.author || 'Chưa rõ'}</strong> | Trạng thái: <span className="status-badge ongoing">{selectedStory.status || 'Ongoing'}</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                {selectedStory.summary || 'Bộ truyện chưa có mô tả tóm tắt.'}
              </p>

              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Danh Sách Chapter</h3>
              <div className="chapter-list-grid">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((ch) => (
                  <button
                    key={ch}
                    className="chapter-item-btn"
                    onClick={() => navigate(`/read/${selectedStory.slug}/${ch}`)}
                  >
                    Chapter {ch}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ROUTE 3: CHAPTER READER SCREEN ('/read/:storySlug/:chapterName') */}
        {routePath.startsWith('/read/') && (
          <div className="reader-container">
            <div className="reader-header">
              <button className="btn-secondary" onClick={() => navigate(selectedStory ? `/story/${selectedStory.slug}` : '/')}>
                &lsaquo; Quay lại truyện
              </button>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {selectedStory ? selectedStory.name : 'Đang đọc'} - Chapter {selectedChapter || '1'}
              </div>
              <button className="btn-primary" onClick={() => navigate(`/read/${selectedStory?.slug || 'one-piece'}/${Number(selectedChapter || 1) + 1}`)}>
                Chapter tiếp &rsaquo;
              </button>
            </div>

            <div className="reader-pages">
              <img src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=900&auto=format&fit=crop&q=80" className="reader-img" alt="Page 1" />
              <img src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=900&auto=format&fit=crop&q=80" className="reader-img" alt="Page 2" />
              <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=80" className="reader-img" alt="Page 3" />
            </div>
          </div>
        )}

        {/* ROUTE 4: ADMIN DASHBOARD ('/admin') */}
        {routePath === '/admin' && (
          <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="page-title">🎛️ MangaCloud Admin Dashboard</h2>
                <p className="page-subtitle">Quản trị hạ tầng, CRUD bộ truyện & Upload Chapter (ROLE_ADMIN).</p>
              </div>
              <button className="btn-secondary" onClick={() => navigate('/')}>
                &lsaquo; Về Trang Chủ
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button
                className={`btn-${adminActiveNav === 'Dashboard' ? 'primary' : 'secondary'}`}
                onClick={() => setAdminActiveNav('Dashboard')}
              >
                Overview
              </button>
              <button
                className={`btn-${adminActiveNav === 'Story Management' ? 'primary' : 'secondary'}`}
                onClick={() => setAdminActiveNav('Story Management')}
              >
                Story Management
              </button>
              <button
                className={`btn-${adminActiveNav === 'Chapter Uploader' ? 'primary' : 'secondary'}`}
                onClick={() => setAdminActiveNav('Chapter Uploader')}
              >
                Chapter Uploader
              </button>
            </div>

            <section className="panel-card">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Cover</th>
                      <th>Tên Truyện</th>
                      <th>Status</th>
                      <th>Slug</th>
                      <th>Views</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stories.map((story) => (
                      <tr key={story.id || story.slug}>
                        <td><img src={sanitizeThumbUrl(story.thumbUrl)} className="cover-img" alt={story.name} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_COVER_IMAGE; }} /></td>
                        <td><strong style={{ color: 'var(--text-primary)' }}>{story.name}</strong></td>
                        <td><span className="status-badge ongoing">{story.status || 'Ongoing'}</span></td>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{story.slug}</td>
                        <td>{story.viewCount ? story.viewCount.toLocaleString() : 0}</td>
                        <td>
                          <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => alert('Sửa truyện: ' + story.name)}>
                            Sửa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
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
