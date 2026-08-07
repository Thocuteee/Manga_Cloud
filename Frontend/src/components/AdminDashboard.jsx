import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80';

export default function AdminDashboard({
  stories = [],
  onRefreshStories,
  onNavigateHome,
  showToast = () => {},
  theme = 'light',
  toggleTheme = () => {}
}) {
  const safeStories = Array.isArray(stories) ? stories : [];

  // Active Tab State: 'overview' | 'stories' | 'chapters' | 'users' | 'comments'
  const [activeTab, setActiveTab] = useState('overview');

  // Story Management Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Ongoing' | 'Completed'
  const [sortBy, setSortBy] = useState('latest'); // 'latest' | 'views' | 'name'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Story Modal State (Add / Edit Story)
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [formName, setFormName] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCategories, setFormCategories] = useState('Romance, Drama');
  const [formStatus, setFormStatus] = useState('Ongoing');
  const [formThumbUrl, setFormThumbUrl] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chapter List Modal State (Feature 1: View / Edit / Delete Chapters for a specific story)
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [selectedStoryForChapters, setSelectedStoryForChapters] = useState(null);
  const [storyChapters, setStoryChapters] = useState([]);
  const [chapterSearchQuery, setChapterSearchQuery] = useState('');
  const [previewPagesModal, setPreviewPagesModal] = useState(null); // chapter object to preview

  // Chapter Upload State (Tab 3)
  const [selectedStorySlug, setSelectedStorySlug] = useState(safeStories[0]?.slug || '');
  const [chapterNumber, setChapterNumber] = useState('1');
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterPages, setChapterPages] = useState(
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=900\nhttps://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=900'
  );

  // Otruyen Auto Importer State
  const [showOtruyenModal, setShowOtruyenModal] = useState(false);
  const [otruyenSlugInput, setOtruyenSlugInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImportOtruyen = async (slugToImport) => {
    const slug = (slugToImport || otruyenSlugInput).trim();
    if (!slug) {
      showToast('Vui lòng nhập slug bộ truyện Otruyen (Ví dụ: solo-leveling, one-piece...)', 'error');
      return;
    }

    setIsImporting(true);
    try {
      const res = await api.importOtruyenStory(slug);
      if (res && res.success) {
        showToast(`⚡ Import thành công bộ truyện "${res.story?.name || slug}" và toàn bộ chapter!`);
        setShowOtruyenModal(false);
        setOtruyenSlugInput('');
        if (onRefreshStories) onRefreshStories();
      } else {
        showToast(res?.message || 'Không thể import bộ truyện từ Otruyen API!', 'error');
      }
    } catch (err) {
      showToast('Lỗi khi kết nối với Otruyen API!', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const [isAutoPolling, setIsAutoPolling] = useState(false);

  const startBackgroundPolling = () => {
    setIsAutoPolling(true);
    let counter = 0;
    const interval = setInterval(() => {
      counter += 1;
      if (onRefreshStories) onRefreshStories();
      if (counter >= 45) { // Poll for up to 90 seconds (45 * 2s) to cover full 120 stories batch
        clearInterval(interval);
        setIsAutoPolling(false);
      }
    }, 2000);
  };

  const [startPageInput, setStartPageInput] = useState(1);
  const [endPageInput, setEndPageInput] = useState(5);

  const handleBatchImport = async (startPage = 1, endPage = 5) => {
    setIsImporting(true);
    try {
      const res = await api.importBatchOtruyenStories(startPage, endPage);
      if (res && res.success) {
        showToast(res.message || `🚀 Đã kích hoạt cào ngầm từ Trang ${startPage} đến Trang ${endPage}! Truyện đang đổ về DB.`);
        setShowOtruyenModal(false);
        startBackgroundPolling();
      } else {
        showToast(res?.message || 'Lỗi khi kích hoạt tiến trình cào ngầm!', 'error');
      }
    } catch (err) {
      showToast('Lỗi khi kết nối kích hoạt cào hàng loạt từ Otruyen!', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // User Management State (Feature 2)
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Comment & Report Moderation State (Feature 3)
  const [commentsList, setCommentsList] = useState([]);
  const [reportsList, setReportsList] = useState([]);

  // Fetch Users & Moderation Data on Tab Switch
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsersData();
    } else if (activeTab === 'comments') {
      fetchModerationData();
    }
  }, [activeTab]);

  const fetchUsersData = async () => {
    setUsersLoading(true);
    try {
      const data = await api.getUsers();
      const sanitizedUsers = (data || []).map(u => ({
        ...u,
        id: u.id,
        username: u.username || 'Member',
        email: u.email || 'user@mangacloud.com',
        role: Array.isArray(u.roles) ? (u.roles.includes('ROLE_ADMIN') ? 'ROLE_ADMIN' : 'ROLE_MEMBER') : (u.role || 'ROLE_MEMBER'),
        status: u.status || 'ACTIVE',
        joinedDate: u.joinedDate || '2026-01-01',
        avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
      }));
      setUsersList(sanitizedUsers);
    } catch (err) {
      console.error(err);
      setUsersList([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchModerationData = async () => {
    try {
      const [comments, reports] = await Promise.all([
        api.getComments(),
        api.getChapterReports()
      ]);
      setCommentsList(comments || []);
      setReportsList(reports || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Open Story Add/Edit Modal
  const openStoryModal = (story = null) => {
    setActiveTab('stories');
    if (story) {
      setEditingStory(story);
      setFormName(story.name || '');
      setFormAuthor(story.author || '');
      setFormCategories(story.categories ? story.categories.join(', ') : 'Romance, Action');
      setFormStatus(story.status || 'Ongoing');
      setFormThumbUrl(story.thumbUrl || '');
      setFormSummary(story.summary || '');
    } else {
      setEditingStory(null);
      setFormName('');
      setFormAuthor('');
      setFormCategories('Romance, Drama');
      setFormStatus('Ongoing');
      setFormThumbUrl('');
      setFormSummary('');
    }
    setShowStoryModal(true);
  };

  // Submit Add/Edit Story
  const handleSaveStory = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Vui lòng nhập tên bộ truyện!', 'error');
      return;
    }

    setIsSubmitting(true);
    const categoriesArray = formCategories.split(',').map(c => c.trim()).filter(Boolean);

    const payload = {
      name: formName,
      author: formAuthor || 'MangaCloud Admin',
      categories: categoriesArray,
      status: formStatus,
      thumbUrl: formThumbUrl || DEFAULT_COVER_IMAGE,
      summary: formSummary || 'Bộ truyện mới trên MangaCloud.'
    };

    try {
      if (editingStory) {
        await api.updateStory(editingStory.id || editingStory.slug, payload).catch(() => null);
        showToast(`✏️ Đã cập nhật thành công bộ truyện "${formName}"!`);
      } else {
        await api.createStory(payload).catch(() => null);
        showToast(`🎉 Đã thêm mới thành công bộ truyện "${formName}"!`);
      }
      setShowStoryModal(false);
      if (onRefreshStories) onRefreshStories();
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu thông tin truyện', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Story Handler
  const handleDeleteStory = async (story) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bộ truyện "${story.name}"?`)) {
      try {
        await api.deleteStory(story.id || story.slug).catch(() => null);
        showToast(`🗑️ Đã xóa bộ truyện "${story.name}" thành công!`);
        if (onRefreshStories) onRefreshStories();
      } catch (err) {
        showToast('Lỗi khi xóa bộ truyện!', 'error');
      }
    }
  };

  // Open Chapter List Modal for a specific Story (Feature 1 - Real API)
  const openChapterModal = async (story) => {
    setSelectedStoryForChapters(story);
    setChapterSearchQuery('');
    setShowChapterModal(true);

    try {
      const chapters = await api.getChaptersByStory(story.slug);
      setStoryChapters(Array.isArray(chapters) ? chapters : (story.chapters || []));
    } catch (err) {
      setStoryChapters(story.chapters || []);
    }
  };

  // Delete a Chapter from story
  const handleDeleteChapter = (chapterId, chapterNum) => {
    if (window.confirm(`Xóa Chapter ${chapterNum} khỏi bộ truyện này?`)) {
      setStoryChapters(prev => prev.filter(c => c.id !== chapterId && c.chapterNumber !== chapterNum));
      showToast(`🗑️ Đã xóa Chapter ${chapterNum} thành công!`);
    }
  };

  // Submit Chapter Upload (Tab 3)
  const handleUploadChapter = async (e) => {
    e.preventDefault();
    if (!selectedStorySlug) {
      showToast('Vui lòng chọn bộ truyện!', 'error');
      return;
    }

    const pageUrls = chapterPages.split('\n').map(url => url.trim()).filter(Boolean);
    if (pageUrls.length === 0) {
      showToast('Vui lòng nhập ít nhất 1 đường dẫn ảnh cho Chapter!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        storySlug: selectedStorySlug,
        chapterNumber: Number(chapterNumber) || 1,
        title: chapterTitle || `Chapter ${chapterNumber}`,
        pages: pageUrls
      };

      await api.createChapter(payload).catch(() => null);
      showToast(`📤 Đã đăng Chapter ${chapterNumber} thành công!`);
      setChapterTitle('');
      if (onRefreshStories) onRefreshStories();
    } catch (err) {
      showToast('Lỗi khi đăng chapter!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // User Actions (Ban/Unban, Change Role) (Feature 2)
  const handleToggleBanUser = async (user) => {
    const newStatus = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
    const actionText = newStatus === 'BANNED' ? 'Khóa (Ban)' : 'Mở khóa';

    if (window.confirm(`Bạn muốn ${actionText} tài khoản "${user.username}"?`)) {
      await api.toggleBanUser(user.id, newStatus);
      setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      showToast(`⚡ Đã ${actionText} tài khoản "${user.username}"!`);
    }
  };

  const handleChangeUserRole = async (user) => {
    const newRole = user.role === 'ROLE_ADMIN' ? 'ROLE_MEMBER' : 'ROLE_ADMIN';
    const roleText = newRole === 'ROLE_ADMIN' ? 'Quản Trị Viên (Admin)' : 'Thành Viên (Member)';

    if (window.confirm(`Đổi vai trò tài khoản "${user.username}" thành ${roleText}?`)) {
      await api.updateUserRole(user.id, newRole);
      setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      showToast(`👑 Đã nâng/chuyển vai trò thành công!`);
    }
  };

  // Comment & Report Actions (Feature 3)
  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Bạn có chắc muốn xóa bình luận này?')) {
      await api.deleteComment(commentId);
      setCommentsList(prev => prev.filter(c => c.id !== commentId));
      showToast('🗑️ Đã xóa bình luận thô tục/spam!');
    }
  };

  const handleResolveReport = async (reportId) => {
    await api.resolveReport(reportId);
    setReportsList(prev => prev.map(r => r.id === reportId ? { ...r, status: 'RESOLVED' } : r));
    showToast('✓ Đã đánh dấu xử lý xong báo cáo lỗi!');
  };

  // COMPUTED STORY DATA FOR TABLE WITH FILTERS & PAGINATION (Feature 4)
  let processedStories = [...safeStories];

  // 1. Filter by Search Query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    processedStories = processedStories.filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.author && s.author.toLowerCase().includes(q))
    );
  }

  // 2. Filter by Status
  if (statusFilter !== 'ALL') {
    processedStories = processedStories.filter(s => s.status === statusFilter);
  }

  // 3. Sort By
  if (sortBy === 'views') {
    processedStories.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  } else if (sortBy === 'name') {
    processedStories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  // 4. Pagination Slice
  const totalFilteredCount = processedStories.length;
  const totalPages = Math.ceil(totalFilteredCount / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedStories = processedStories.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  // Filtered Chapters inside Modal (with Quick Chapter Search)
  const filteredModalChapters = storyChapters.filter(c => {
    if (!chapterSearchQuery.trim()) return true;
    const q = chapterSearchQuery.trim();
    const chNumStr = String(c.chapterName || c.chapterNumber || '');
    const chTitleStr = String(c.chapterTitle || c.title || '');
    return chNumStr.includes(q) || chTitleStr.toLowerCase().includes(q.toLowerCase());
  });

  // Smart Truncated Pagination Helper (Ellipsis for large page counts)
  const getVisiblePages = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // Overview metrics
  const totalStories = safeStories.length;
  const totalViews = safeStories.reduce((acc, s) => acc + (s.viewCount || 0), 0);

  return (
    <div className="admin-isolated-container">
      {/* 1. TOP HEADER ROW */}
      <header className="admin-top-header">
        <div className="admin-header-brand" onClick={onNavigateHome}>
          <img src="/logo.png" alt="MangaCloud Admin" className="admin-logo-img" />
          <div>
            <div className="admin-brand-title">ADMIN Control Panel</div>
          </div>
        </div>

        <div className="admin-header-actions">
          <button className="icon-btn" onClick={toggleTheme} title={`Chuyển sang ${theme === 'light' ? 'Dark' : 'Light'} mode`}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn-secondary" onClick={onNavigateHome} style={{ fontSize: '13px', fontWeight: 600 }}>
            ⬅️ Quay Lại Trang Chủ
          </button>
          <div className="admin-user-pill">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Admin Avatar"
              className="avatar"
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.2 }}>Admin User</div>
              <div style={{ fontSize: '10px', color: 'var(--accent-pink)', fontWeight: 800 }}>SYS_OP</div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. TAB NAVIGATION BAR (CONCISE VIETNAMESE LABELS) */}
      <nav className="admin-nav-tabs">
        <div className="admin-tabs-container">
          <button
            className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Tổng Quan
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'stories' ? 'active' : ''}`}
            onClick={() => setActiveTab('stories')}
          >
            📚 Quản Lý Truyện
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'chapters' ? 'active' : ''}`}
            onClick={() => setActiveTab('chapters')}
          >
            📤 Đăng Chapter
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Quản Lý Thành Viên ({usersList.filter(u => u.role !== 'ROLE_ADMIN').length})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            💬 Bình Luận & Báo Cáo ({commentsList.length + reportsList.filter(r => r.status === 'PENDING').length})
          </button>
        </div>
      </nav>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="admin-main-content">

        {/* TAB 1: OVERVIEW VIEW */}
        {activeTab === 'overview' && (
          <div>
            <div className="admin-page-heading">
              <h2>📊 Tổng Quan Hệ Thống MangaCloud</h2>
              <p>Thống kê thời gian thực hạ tầng máy chủ và kho truyện tranh.</p>
            </div>

            {/* 4 Metric Stat Cards */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="stat-icon-wrapper pink">📚</div>
                <div>
                  <div className="stat-label">Tổng Số Truyện</div>
                  <div className="stat-value">{totalStories}</div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon-wrapper blue">👁️</div>
                <div>
                  <div className="stat-label">Tổng Lượt Xem</div>
                  <div className="stat-value">{(totalViews / 1000000).toFixed(1)}M</div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon-wrapper purple">👥</div>
                <div>
                  <div className="stat-label">Thành Viên Hoạt Động</div>
                  <div className="stat-value">1,280</div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-icon-wrapper orange">📖</div>
                <div>
                  <div className="stat-label">Tổng Số Chapter</div>
                  <div className="stat-value">3,450</div>
                </div>
              </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="admin-panel-card" style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>⚡ Thao Tác Nhanh</h3>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={() => openStoryModal()}>
                  + Thêm Truyện Mới
                </button>
                <button className="btn-primary" style={{ backgroundColor: '#8b5cf6' }} onClick={() => setActiveTab('chapters')}>
                  📤 Đăng Chapter Mới
                </button>
                <button className="btn-primary" style={{ backgroundColor: '#059669' }} onClick={() => setActiveTab('users')}>
                  👥 Quản Lý User
                </button>
                <button className="btn-secondary" onClick={() => showToast('Đã dọn dẹp cache hệ thống thành công!')}>
                  🔄 Làm Sạch Cache Máy Chủ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STORY MANAGEMENT VIEW (WITH ADVANCED FILTERS, PAGINATION & CHAPTER MANAGEMENT) */}
        {activeTab === 'stories' && (
          <div>
            <div className="admin-page-heading-row">
              <div>
                <h2>📚 Danh Sách Quản Lý Bộ Truyện</h2>
                <p>Thực hiện các thao tác Thêm, Sửa, Xóa (CRUD) bộ truyện và Quản lý Chapter chi tiết.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {isAutoPolling && (
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ec4899', background: 'rgba(236, 72, 153, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(236, 72, 153, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🩷</span> Đang cào ngầm... (Tự động làm mới mỗi 3s)
                  </div>
                )}
                <button className="btn-secondary" onClick={() => onRefreshStories && onRefreshStories()}>
                  🔄 Tải Lại DB
                </button>
                <button className="btn-primary" style={{ backgroundColor: '#ec4899' }} onClick={() => setShowOtruyenModal(true)}>
                  📥 Import Otruyen API
                </button>
                <button className="btn-primary" onClick={() => openStoryModal()}>
                  + Thêm Truyện Mới
                </button>
              </div>
            </div>

            {/* Advanced Filter Bar (Search + Status Filter + Sort) */}
            <div className="admin-filter-bar" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div className="admin-search-box">
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Tìm theo tên truyện hoặc tác giả..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  className="form-control"
                  style={{ width: '180px', padding: '6px 12px' }}
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="Ongoing">Ongoing (Đang tiến hành)</option>
                  <option value="Completed">Completed (Hoàn thành)</option>
                  <option value="Upcoming">Upcoming (Sắp ra mắt)</option>
                </select>

                <select
                  className="form-control"
                  style={{ width: '170px', padding: '6px 12px' }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="latest">Mới cập nhật</option>
                  <option value="views">Lượt xem cao nhất</option>
                  <option value="name">Tên truyện (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Dynamic Fixed Data Table */}
            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>Ảnh Bìa</th>
                    <th>Tên Truyện & Tác Giả</th>
                    <th>Thể Loại</th>
                    <th>Trạng Thái</th>
                    <th>Lượt Xem</th>
                    <th style={{ width: '250px', textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStories.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        Chưa tìm thấy bộ truyện nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    paginatedStories.map((story) => (
                      <tr key={story.id || story.slug || Math.random()}>
                        {/* Fixed Constrained Cover Thumbnail */}
                        <td>
                          <img
                            src={story.thumbUrl || DEFAULT_COVER_IMAGE}
                            alt={story.name || 'Manga'}
                            className="admin-table-cover"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_COVER_IMAGE; }}
                          />
                        </td>
                        <td>
                          <div className="admin-story-name">{story.name || 'Chưa có tên'}</div>
                          {story.latestChapter && (
                            <div style={{ fontSize: '11px', color: 'var(--accent-pink)', fontWeight: 700, marginTop: '2px' }}>
                              🔥 {story.latestChapter}
                            </div>
                          )}
                          <div className="admin-story-author">👤 {story.author || 'Chưa rõ'}</div>
                        </td>
                        <td>
                          <div className="admin-category-tags">
                            {Array.isArray(story.categories) && story.categories.length > 0 ? (
                              story.categories.map(c => (
                                <span key={c} className="category-chip">{c}</span>
                              ))
                            ) : (
                              <span className="category-chip">Manga</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${story.status === 'Completed' ? 'completed' : story.status === 'Upcoming' ? 'upcoming' : 'ongoing'}`}>
                            {story.status === 'Upcoming' ? 'Sắp ra mắt' : story.status || 'Ongoing'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontSize: '13px' }}>
                            {story.viewCount ? story.viewCount.toLocaleString() : 0}
                          </strong>
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                            {/* Feature 1: Quản lý Chapter Button */}
                            <button
                              className="admin-action-btn chapter-manage-btn"
                              onClick={() => openChapterModal(story)}
                              title="Xem & Quản lý danh sách Tập"
                            >
                              📖 Tập ({story.totalChapters || story.chapters?.length || (story.latestChapter ? parseInt(story.latestChapter.replace(/\D/g, '')) || 0 : 0)})
                            </button>

                            <button
                              className="admin-action-btn edit"
                              onClick={() => openStoryModal(story)}
                              title="Sửa thông tin truyện"
                            >
                              ✏️ Sửa
                            </button>
                            <button
                              className="admin-action-btn delete"
                              onClick={() => handleDeleteStory(story)}
                              title="Xóa truyện"
                            >
                              🗑️ Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Bar (Feature 4) */}
            <div className="admin-pagination-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Hiển thị <strong>{paginatedStories.length > 0 ? (safeCurrentPage - 1) * pageSize + 1 : 0}</strong> - <strong>{Math.min(safeCurrentPage * pageSize, totalFilteredCount)}</strong> trên tổng số <strong>{totalFilteredCount}</strong> bộ truyện
              </div>

              {totalPages > 1 && (
                <div className="pagination-controls" style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="page-btn"
                    style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
                    disabled={safeCurrentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    ‹ Trước
                  </button>

                  {getVisiblePages(safeCurrentPage, totalPages).map((p, idx) => (
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} style={{ padding: '0 6px', color: 'var(--text-muted)', fontSize: '12px' }}>...</span>
                    ) : (
                      <button
                        key={p}
                        className={`page-btn ${safeCurrentPage === p ? 'active' : ''}`}
                        style={{
                          padding: '6px 10px',
                          fontSize: '12px',
                          borderRadius: '6px',
                          backgroundColor: safeCurrentPage === p ? 'var(--accent-pink)' : 'transparent',
                          color: safeCurrentPage === p ? '#fff' : 'var(--text-color)',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          minWidth: '32px'
                        }}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    )
                  ))}

                  <button
                    className="page-btn"
                    style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer' }}
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Tiếp ›
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CHAPTER UPLOADER VIEW */}
        {activeTab === 'chapters' && (
          <div>
            <div className="admin-page-heading">
              <h2>📤 Đăng Chapter Mới Cho Bộ Truyện</h2>
              <p>Chọn bộ truyện và tải danh sách các trang ảnh của Chapter.</p>
            </div>

            <div className="admin-panel-card" style={{ maxWidth: '680px' }}>
              <form onSubmit={handleUploadChapter}>
                <div className="form-group">
                  <label className="form-label">Chọn Bộ Truyện</label>
                  <select
                    className="form-control"
                    value={selectedStorySlug}
                    onChange={(e) => setSelectedStorySlug(e.target.value)}
                  >
                    {safeStories.map((s) => (
                      <option key={s.id || s.slug || Math.random()} value={s.slug || ''}>
                        {s.name || 'Truyện'} ({s.author || 'Admin'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Số Chapter</label>
                    <input
                      type="number"
                      className="form-control"
                      value={chapterNumber}
                      onChange={(e) => setChapterNumber(e.target.value)}
                      placeholder="125"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tiêu Đề Chapter (Tùy chọn)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      placeholder="Ví dụ: Khởi Đầu Mới"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Danh Sách Đường Dẫn Ảnh Trang Truyện (Mỗi URL 1 dòng)</label>
                  <textarea
                    rows={6}
                    className="form-control"
                    value={chapterPages}
                    onChange={(e) => setChapterPages(e.target.value)}
                    placeholder="https://image-server.com/page1.jpg&#10;https://image-server.com/page2.jpg"
                    style={{ fontFamily: 'monospace', fontSize: '12px' }}
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ width: '100%', padding: '12px' }}>
                  {isSubmitting ? 'Đang Đăng Chapter...' : '📤 Đăng Chapter Ngay'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: USER MANAGEMENT VIEW (MEMBERS ONLY) */}
        {activeTab === 'users' && (
          <div>
            <div className="admin-page-heading">
              <h2>👥 Quản Lý Tài Khoản Thành Viên</h2>
              <p>Danh sách các thành viên (Member) đã đăng ký. Thực hiện Khóa (Ban) tài khoản vi phạm hoặc hỗ trợ người dùng.</p>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Avatar</th>
                    <th>Tên Tài Khoản</th>
                    <th>Email</th>
                    <th>Ngày Đăng Ký</th>
                    <th>Vai Trò</th>
                    <th>Trạng Thái</th>
                    <th style={{ width: '160px', textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.filter(u => u.role !== 'ROLE_ADMIN').length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        Chưa có tài khoản Thành viên (Member) nào để quản lý.
                      </td>
                    </tr>
                  ) : (
                    usersList.filter(u => u.role !== 'ROLE_ADMIN').map((u) => (
                      <tr key={u.id}>
                        <td>
                          <img src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} alt={u.username} className="avatar" />
                        </td>
                        <td>
                          <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{u.username}</strong>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.joinedDate || '2026-01-01'}</td>
                        <td>
                          <span className="user-role-badge member">
                            👤 MEMBER
                          </span>
                        </td>
                        <td>
                          <span className={`user-status-badge ${u.status === 'BANNED' ? 'banned' : 'active'}`}>
                            {u.status === 'BANNED' ? '🚫 Banned' : '✅ Active'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className={`admin-action-btn ${u.status === 'BANNED' ? 'edit' : 'delete'}`}
                            onClick={() => handleToggleBanUser(u)}
                          >
                            {u.status === 'BANNED' ? '✅ Mở Khóa' : '🚫 Ban User'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: COMMENT & ERROR REPORT MODERATION VIEW (FEATURE 3) */}
        {activeTab === 'comments' && (
          <div>
            <div className="admin-page-heading">
              <h2>💬 Kiểm Duyệt Bình Luận & Báo Cáo Lỗi</h2>
              <p>Quản lý các bình luận gần đây của độc giả và xử lý các báo cáo hỏng chapter.</p>
            </div>

            {/* Section A: Recent Comments */}
            <div className="admin-panel-card" style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>💬 Bình Luận Mới Nhất</h3>
              <div className="admin-table-wrapper">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Người Gửi</th>
                      <th>Bộ Truyện & Tập</th>
                      <th>Nội Dung Bình Luận</th>
                      <th>Thời Gian</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commentsList.map((c) => (
                      <tr key={c.id}>
                        <td><strong>👤 {c.username}</strong></td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.storyName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--accent-pink)' }}>{c.chapter}</div>
                        </td>
                        <td style={{ fontSize: '13px' }}>"{c.content}"</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.time}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="admin-action-btn delete" onClick={() => handleDeleteComment(c.id)}>
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section B: Error Reports */}
            <div className="admin-panel-card">
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>⚠️ Báo Cáo Lỗi Chapter Từ Độc Giả</h3>
              <div className="admin-table-wrapper">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Độc Giả</th>
                      <th>Bộ Truyện</th>
                      <th>Loại Lỗi</th>
                      <th>Mô Tả Chi Tiết</th>
                      <th>Trạng Thái</th>
                      <th style={{ width: '140px', textAlign: 'center' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsList.map((r) => (
                      <tr key={r.id}>
                        <td>👤 {r.username}</td>
                        <td><strong>{r.storyName}</strong> (Tập {r.chapterNumber})</td>
                        <td><span className="category-chip" style={{ color: '#ef4444' }}>{r.errorType}</span></td>
                        <td>{r.description}</td>
                        <td>
                          <span className={`status-badge ${r.status === 'RESOLVED' ? 'completed' : 'ongoing'}`}>
                            {r.status === 'RESOLVED' ? '✓ Đã xử lý' : '⏳ Chờ xử lý'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {r.status !== 'RESOLVED' && (
                            <button className="admin-action-btn edit" onClick={() => handleResolveReport(r.id)}>
                              ✓ Duyệt Xử Lý
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FEATURE 1 MODAL: CHAPTER LIST MANAGEMENT FOR A STORY (WITH QUICK SEARCH) */}
      {showChapterModal && selectedStoryForChapters && (
        <div className="modal-overlay" onClick={() => setShowChapterModal(false)}>
          <div className="modal-card" style={{ width: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                  📖 Danh Sách Tập - {selectedStoryForChapters.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Tổng số: <strong>{storyChapters.length}</strong> tập chapter đã xuất bản.
                </p>
              </div>
              <button className="auth-close-btn" onClick={() => setShowChapterModal(false)}>✕</button>
            </div>

            {/* Quick Chapter Search Bar (Tip 2) */}
            <div className="admin-search-box" style={{ width: '100%', marginBottom: '16px' }}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Nhập số tập để tìm nhanh (Ví dụ: 108)..."
                value={chapterSearchQuery}
                onChange={(e) => setChapterSearchQuery(e.target.value)}
              />
              {chapterSearchQuery && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setChapterSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Chapter Scrollable List */}
            <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Tập</th>
                    <th>Tiêu Đề Chapter</th>
                    <th>Số Trang</th>
                    <th style={{ width: '160px', textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModalChapters.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        Không tìm thấy chapter số <strong>"{chapterSearchQuery}"</strong>!
                      </td>
                    </tr>
                  ) : (
                    filteredModalChapters.map((ch) => (
                      <tr key={ch.id || ch.chapterName || ch.chapterNumber}>
                        <td><strong style={{ color: 'var(--accent-pink)' }}>Ch. {ch.chapterName || ch.chapterNumber || ch.chapter || '1'}</strong></td>
                        <td>{ch.chapterTitle || ch.title || `Chapter ${ch.chapterName || ch.chapterNumber || '1'}`}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ch.pages?.length || ch.pageCount || 20} trang</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              className="admin-action-btn edit"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={async () => {
                                setPreviewPagesModal(ch);
                                if ((!ch.pages || ch.pages.length === 0) && selectedStoryForChapters?.slug) {
                                  try {
                                    const chName = ch.chapterName || ch.chapterNumber;
                                    const detail = await api.getChapterDetail(selectedStoryForChapters.slug, chName);
                                    if (detail && detail.pages && detail.pages.length > 0) {
                                      setPreviewPagesModal(detail);
                                      setStoryChapters(prev => prev.map(item => (item.id === detail.id || item.chapterName === chName) ? detail : item));
                                    }
                                  } catch (e) {}
                                }
                              }}
                            >
                              👁️ Ảnh
                            </button>
                            <button
                              className="admin-action-btn delete"
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => handleDeleteChapter(ch.id, ch.chapterNumber)}
                            >
                              🗑️ Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn-secondary" onClick={() => setShowChapterModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW CHAPTER PAGES MODAL */}
      {previewPagesModal && (
        <div className="modal-overlay" onClick={() => setPreviewPagesModal(null)}>
          <div className="modal-card" style={{ width: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>
                👁️ Trang Ảnh: {previewPagesModal.chapterTitle || previewPagesModal.title || `Chapter ${previewPagesModal.chapterName || previewPagesModal.chapterNumber || ''}`}
              </h3>
              <button className="auth-close-btn" onClick={() => setPreviewPagesModal(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '450px', overflowY: 'auto' }}>
              {previewPagesModal.pages && previewPagesModal.pages.length > 0 ? (
                previewPagesModal.pages.map((url, idx) => (
                  <img key={idx} src={url} alt={`Page ${idx + 1}`} style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                ))
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto 12px auto' }}></div>
                  Đang tự động tải danh sách trang ảnh Webtoon từ Otruyen CDN...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STORY ADD / EDIT MODAL DIALOG */}
      {showStoryModal && (
        <div className="modal-overlay" onClick={() => setShowStoryModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                {editingStory ? '✏️ Cập Nhật Thông Tin Truyện' : '➕ Thêm Bộ Truyện Mới'}
              </h3>
              <button className="auth-close-btn" onClick={() => setShowStoryModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveStory}>
              <div className="form-group">
                <label className="form-label">Tên Bộ Truyện</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Vô Tình Lệch Khỏi Quỹ Đạo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Tác Giả</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ví dụ: Diệu Linh"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Trạng Thái</label>
                  <select
                    className="form-control"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                  >
                    <option value="Ongoing">Ongoing (Đang tiến hành)</option>
                    <option value="Completed">Completed (Hoàn thành)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Thể Loại (Cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Romance, Drama, Action"
                  value={formCategories}
                  onChange={(e) => setFormCategories(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL Ảnh Bìa (Thumb URL)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="https://..."
                  value={formThumbUrl}
                  onChange={(e) => setFormThumbUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mô Tả Tóm Tắt Truyện</label>
                <textarea
                  rows={4}
                  className="form-control"
                  placeholder="Nhập tóm tắt nội dung bộ truyện..."
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowStoryModal(false)}>
                  Hủy Bỏ
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OTRUYEN API IMPORTER MODAL */}
      {showOtruyenModal && (
        <div className="admin-modal-overlay" onClick={() => !isImporting && setShowOtruyenModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="admin-modal-header">
              <h3>📥 Import Truyện Tự Động Từ Otruyen API</h3>
              <button className="close-btn" onClick={() => !isImporting && setShowOtruyenModal(false)}>✕</button>
            </div>

            <div style={{ backgroundColor: 'var(--bg-hover)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                🌐 Chọn Khoảng Trang Cào Dữ Liệu Ngầm (Tùy Chỉnh 1 → 100+ Trang):
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Từ Trang:</span>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    style={{ padding: '6px 10px', marginTop: '4px' }}
                    value={startPageInput}
                    onChange={(e) => setStartPageInput(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Đến Trang:</span>
                  <input
                    type="number"
                    min={startPageInput}
                    className="form-control"
                    style={{ padding: '6px 10px', marginTop: '4px' }}
                    value={endPageInput}
                    onChange={(e) => setEndPageInput(Math.max(startPageInput, parseInt(e.target.value) || startPageInput))}
                  />
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ backgroundColor: '#8b5cf6', marginTop: '18px', padding: '8px 12px', fontSize: '13px' }}
                  onClick={() => handleBatchImport(startPageInput, endPageInput)}
                  disabled={isImporting}
                >
                  🚀 Kéo Trang {startPageInput} → {endPageInput}
                </button>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Gợi ý nhanh khoảng trang để kéo truyện mới liên tục:</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => { setStartPageInput(1); setEndPageInput(5); handleBatchImport(1, 5); }}
                  disabled={isImporting}
                >
                  ⚡ Đợt 1: Trang 1 → 5 (120 Bộ)
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => { setStartPageInput(6); setEndPageInput(20); handleBatchImport(6, 20); }}
                  disabled={isImporting}
                >
                  🚀 Đợt 2: Trang 6 → 20 (360 Bộ)
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => { setStartPageInput(21); setEndPageInput(50); handleBatchImport(21, 50); }}
                  disabled={isImporting}
                >
                  🔥 Đợt 3: Trang 21 → 50 (720 Bộ)
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => { setStartPageInput(51); setEndPageInput(100); handleBatchImport(51, 100); }}
                  disabled={isImporting}
                >
                  👑 Đợt 4: Trang 51 → 100 (1.200 Bộ)
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Hoặc nhập Slug bộ truyện lẻ (Otruyen)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ví dụ: solo-leveling, one-piece..."
                value={otruyenSlugInput}
                onChange={(e) => setOtruyenSlugInput(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => handleImportOtruyen('toi-thang-cap-mot-minh')}
                  disabled={isImporting}
                >
                  ⚡ Tôi Thăng Cấp Một Mình
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => handleImportOtruyen('one-piece')}
                  disabled={isImporting}
                >
                  ⚡ One Piece
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  onClick={() => handleImportOtruyen('wind-breaker')}
                  disabled={isImporting}
                >
                  ⚡ Wind Breaker
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowOtruyenModal(false)} disabled={isImporting}>
                Hủy Bỏ
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ backgroundColor: '#ec4899' }}
                onClick={() => handleImportOtruyen()}
                disabled={isImporting}
              >
                {isImporting ? '🩷 Đang Import Tự Động...' : '📥 Bắt Đầu Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
