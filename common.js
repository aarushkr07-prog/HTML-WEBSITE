/**
 * JobTracker - Common UI Components, Navigation, Theme, & Notifications
 */
const Common = {
    currentPage: '',

    init(pageName) {
        this.currentPage = pageName;

        // Apply theme immediately before render
        this.applyTheme();

        // Check authentication
        if (!Storage.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        // Render UI Shell
        this.renderSidebar();
        this.renderTopBar();
        this.setupEventListeners();
    },

    renderSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        const user = Storage.getCurrentUser();
        const isAdmin = Storage.isAdmin();

        const navLinks = [
            {
                id: 'dashboard',
                href: 'dashboard.html',
                label: 'Dashboard',
                icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`
            },
            {
                id: 'jobs',
                href: 'jobs.html',
                label: 'Browse Jobs',
                icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`
            },
            {
                id: 'applications',
                href: 'applications.html',
                label: 'Applications',
                icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
            },
            {
                id: 'saved-jobs',
                href: 'saved-jobs.html',
                label: 'Saved Jobs',
                icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
            },
            {
                id: 'activities',
                href: 'activities.html',
                label: 'Activity History',
                icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
            },
            {
                id: 'profile',
                href: 'profile.html',
                label: 'My Profile',
                icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`
            }
        ];

        if (isAdmin) {
            navLinks.push({
                id: 'admin',
                href: 'admin.html',
                label: 'Admin Panel',
                icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`
            });
        }

        const navHtml = navLinks.map(link => `
            <a href="${link.href}" class="nav-item ${this.currentPage === link.id ? 'active' : ''}">
                <span class="nav-icon">${link.icon}</span>
                <span class="nav-label">${link.label}</span>
            </a>
        `).join('');

        sidebar.innerHTML = `
            <div class="sidebar-header">
                <a href="dashboard.html" class="brand-logo">
                    <div class="logo-icon">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                    </div>
                    <div class="logo-text">
                        <span class="brand-name">Job<span class="brand-accent">Tracker</span></span>
                        <span class="brand-tag">SaaS Platform</span>
                    </div>
                </a>
            </div>
            <nav class="sidebar-nav">
                <div class="nav-group-title">MAIN MENU</div>
                ${navHtml}
            </nav>
            <div class="sidebar-footer">
                <div class="user-quick-profile">
                    <div class="user-avatar-chip">
                        ${this.getUserInitials(user ? user.fullName : 'User')}
                    </div>
                    <div class="user-chip-info">
                        <div class="user-chip-name">${this.escapeHtml(user ? user.fullName : 'Guest')}</div>
                        <div class="user-chip-role">${user && user.role === 'admin' ? 'Administrator' : 'Job Seeker'}</div>
                    </div>
                </div>
                <button class="btn-logout" onclick="Common.logout()" title="Logout">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    <span>Sign Out</span>
                </button>
            </div>
        `;
    },

    renderTopBar() {
        const topBar = document.getElementById('topBar');
        if (!topBar) return;

        const user = Storage.getCurrentUser();
        const currentTheme = Storage.getTheme();
        const initials = this.getUserInitials(user ? user.fullName : 'U');

        const pageTitles = {
            'dashboard': 'Dashboard Overview',
            'jobs': 'Job Opportunities',
            'applications': 'My Job Applications',
            'saved-jobs': 'Saved Jobs',
            'activities': 'Interaction Timeline',
            'profile': 'My Profile & Resume',
            'admin': 'Admin Control Center'
        };

        const pageTitle = pageTitles[this.currentPage] || 'Job Application Tracker';

        topBar.innerHTML = `
            <div class="topbar-left">
                <button class="sidebar-toggle-btn" id="sidebarToggle" aria-label="Toggle navigation">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <div class="topbar-title-wrap">
                    <h1 class="topbar-page-title">${pageTitle}</h1>
                </div>
            </div>

            <div class="topbar-right">
                <!-- Theme Toggle Button -->
                <button class="theme-toggle-btn" id="themeToggleBtn" onclick="Common.toggleTheme()" title="Toggle Dark/Light Mode">
                    ${currentTheme === 'dark' 
                        ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
                        : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
                    }
                </button>

                <!-- User Dropdown Menu -->
                <div class="user-menu-dropdown-wrap" id="userMenuDropdownWrap">
                    <button class="user-profile-button" id="userMenuBtn" onclick="Common.toggleUserMenu(event)">
                        <div class="avatar-circle">${initials}</div>
                        <span class="user-display-name">${this.escapeHtml(user ? user.fullName : 'Account')}</span>
                        <svg class="chevron-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div class="user-dropdown-menu" id="userDropdownMenu">
                        <div class="dropdown-header">
                            <div class="dropdown-user-name">${this.escapeHtml(user ? user.fullName : '')}</div>
                            <div class="dropdown-user-email">${this.escapeHtml(user ? user.email : '')}</div>
                        </div>
                        <div class="dropdown-divider"></div>
                        <a href="profile.html" class="dropdown-item">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            My Profile
                        </a>
                        <a href="dashboard.html" class="dropdown-item">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            Dashboard
                        </a>
                        ${user && user.role === 'admin' ? `
                            <a href="admin.html" class="dropdown-item">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                Admin Panel
                            </a>
                        ` : ''}
                        <div class="dropdown-divider"></div>
                        <button onclick="Common.logout()" class="dropdown-item text-danger">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    setupEventListeners() {
        // Sidebar Toggle
        const toggleBtn = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (toggleBtn && sidebar) {
            toggleBtn.onclick = (e) => {
                e.stopPropagation();
                if (window.innerWidth <= 992) {
                    sidebar.classList.toggle('open');
                    if (overlay) overlay.classList.toggle('active');
                } else {
                    document.body.classList.toggle('sidebar-collapsed');
                }
            };
        }

        if (overlay) {
            overlay.onclick = () => {
                if (sidebar) sidebar.classList.remove('open');
                overlay.classList.remove('active');
            };
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('userDropdownMenu');
            const wrap = document.getElementById('userMenuDropdownWrap');
            if (dropdown && wrap && !wrap.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    },

    toggleUserMenu(e) {
        e.stopPropagation();
        const dropdown = document.getElementById('userDropdownMenu');
        if (dropdown) dropdown.classList.toggle('show');
    },

    toggleTheme() {
        const current = Storage.getTheme();
        const newTheme = current === 'dark' ? 'light' : 'dark';
        Storage.setTheme(newTheme);
        this.applyTheme();
        this.renderTopBar();
        this.showToast(`Switched to ${newTheme} mode`, 'info');
    },

    applyTheme() {
        const theme = Storage.getTheme();
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    },

    logout() {
        Storage.logout();
        window.location.href = 'login.html';
    },

    getUserInitials(name) {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // Status Badges
    getStatusBadge(status) {
        const statusMap = {
            'Wishlist': { cls: 'badge-wishlist', label: 'Wishlist' },
            'Applied': { cls: 'badge-applied', label: 'Applied' },
            'Under Review': { cls: 'badge-under-review', label: 'Under Review' },
            'Interview Scheduled': { cls: 'badge-interview', label: 'Interview Scheduled' },
            'Assessment': { cls: 'badge-assessment', label: 'Assessment' },
            'Offer Received': { cls: 'badge-offer', label: 'Offer Received' },
            'Rejected': { cls: 'badge-rejected', label: 'Rejected' },
            'Accepted': { cls: 'badge-accepted', label: 'Accepted' }
        };

        const conf = statusMap[status] || { cls: 'badge-default', label: status || 'Unknown' };
        return `<span class="badge ${conf.cls}">${this.escapeHtml(conf.label)}</span>`;
    },

    // Format Date
    formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    },

    // Toast Notifications
    showToast(message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
            error: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
            warning: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
            info: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-message">${this.escapeHtml(message)}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('toast-hiding');
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 300);
        }, 3500);
    },

    // Modal Confirmation Dialog
    confirm(message, options = {}) {
        return new Promise((resolve) => {
            const title = options.title || 'Confirm Action';
            const confirmText = options.confirmText || 'Yes, Delete';
            const cancelText = options.cancelText || 'Cancel';
            const isDanger = options.danger !== false;

            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'modal-backdrop active';
            modalOverlay.innerHTML = `
                <div class="modal-box confirmation-modal">
                    <div class="confirmation-icon ${isDanger ? 'icon-danger' : 'icon-info'}">
                        ${isDanger 
                            ? `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
                            : `<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
                        }
                    </div>
                    <h3 class="confirmation-title">${Common.escapeHtml(title)}</h3>
                    <p class="confirmation-desc">${Common.escapeHtml(message)}</p>
                    <div class="confirmation-actions">
                        <button type="button" class="btn btn-secondary" id="confirmCancelBtn">${Common.escapeHtml(cancelText)}</button>
                        <button type="button" class="btn ${isDanger ? 'btn-danger' : 'btn-primary'}" id="confirmProceedBtn">${Common.escapeHtml(confirmText)}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modalOverlay);

            const cleanup = (result) => {
                modalOverlay.classList.remove('active');
                setTimeout(() => modalOverlay.remove(), 200);
                resolve(result);
            };

            modalOverlay.querySelector('#confirmCancelBtn').onclick = () => cleanup(false);
            modalOverlay.querySelector('#confirmProceedBtn').onclick = () => cleanup(true);
            modalOverlay.onclick = (e) => {
                if (e.target === modalOverlay) cleanup(false);
            };
        });
    }
};
