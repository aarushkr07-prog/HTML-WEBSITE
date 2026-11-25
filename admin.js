/**
 * JobTracker - Admin Dashboard & Governance Logic
 */
const AdminPage = {
    allUsers: [],
    allJobs: [],
    allApps: [],

    init() {
        Common.init('admin');

        if (!Storage.isAdmin()) {
            document.getElementById('adminAccessDenied').style.display = 'block';
            document.getElementById('adminMainContent').style.display = 'none';
            return;
        }

        document.getElementById('adminAccessDenied').style.display = 'none';
        document.getElementById('adminMainContent').style.display = 'block';

        this.loadAdminMetrics();
        this.loadUsers();
        this.loadJobs();
        this.loadApplications();
        this.setupSearchListeners();
    },

    switchQuickToAdmin() {
        Storage.setCurrentUser('admin@jobtracker.com');
        window.location.reload();
    },

    loadAdminMetrics() {
        const users = Storage.getUsers();
        const jobs = Storage.getAllJobs();
        const apps = Storage.getAllApplications();
        const acts = Storage.getAllActivities();

        document.getElementById('metricTotalUsers').textContent = users.length;
        document.getElementById('metricTotalJobs').textContent = jobs.length;
        document.getElementById('metricTotalApps').textContent = apps.length;
        document.getElementById('metricTotalActivities').textContent = acts.length;
    },

    setupSearchListeners() {
        const userSearch = document.getElementById('adminUserSearch');
        if (userSearch) {
            userSearch.addEventListener('input', () => this.filterUsers());
        }

        const jobSearch = document.getElementById('adminJobSearch');
        if (jobSearch) {
            jobSearch.addEventListener('input', () => this.filterJobs());
        }

        const appSearch = document.getElementById('adminAppSearch');
        if (appSearch) {
            appSearch.addEventListener('input', () => this.filterApps());
        }
    },

    // --- Users Tab ---
    loadUsers() {
        this.allUsers = Storage.getUsers();
        this.filterUsers();
    },

    filterUsers() {
        const q = (document.getElementById('adminUserSearch')?.value || '').toLowerCase().trim();
        const tbody = document.getElementById('adminUsersTbody');
        const countLabel = document.getElementById('adminUserCountLabel');

        const filtered = this.allUsers.filter(u => 
            !q || (u.fullName && u.fullName.toLowerCase().includes(q)) || (u.email && u.email.toLowerCase().includes(q))
        );

        if (countLabel) countLabel.textContent = `Total: ${filtered.length}`;
        if (!tbody) return;

        const currentUserId = Storage.getCurrentUserId();

        tbody.innerHTML = filtered.map(u => `
            <tr>
                <td>
                    <div style="font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
                        <span style="width:28px;height:28px;border-radius:50%;background:var(--secondary);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:0.75rem;">
                            ${Common.getUserInitials(u.fullName)}
                        </span>
                        ${Common.escapeHtml(u.fullName)}
                    </div>
                </td>
                <td style="color:var(--text-secondary);font-size:0.88rem;">${Common.escapeHtml(u.email)}</td>
                <td>
                    <span class="badge ${u.role === 'admin' ? 'badge-interview' : 'badge-wishlist'}">
                        ${u.role === 'admin' ? 'Administrator' : 'Standard User'}
                    </span>
                </td>
                <td style="color:var(--text-secondary);font-size:0.85rem;">${Common.formatDate(u.createdAt)}</td>
                <td style="text-align:right;">
                    ${u.id === currentUserId ? `
                        <span style="font-size:0.8rem;color:var(--text-muted);font-weight:500;">(Current Session)</span>
                    ` : `
                        <button class="btn btn-secondary btn-sm text-danger" onclick="AdminPage.deleteUser('${u.id}', '${Common.escapeHtml(u.fullName)}')">
                            Delete Account
                        </button>
                    `}
                </td>
            </tr>
        `).join('');
    },

    async deleteUser(userId, userName) {
        const confirmed = await Common.confirm(`Permanently delete user "${userName}" and remove all their associated profile, jobs, applications, and activities?`);
        if (!confirmed) return;

        Storage.deleteUser(userId);
        Common.showToast(`User account deleted.`, 'info');
        this.loadAdminMetrics();
        this.loadUsers();
        this.loadJobs();
        this.loadApplications();
    },

    // --- Jobs Tab ---
    loadJobs() {
        this.allJobs = Storage.getAllJobs();
        this.filterJobs();
    },

    filterJobs() {
        const q = (document.getElementById('adminJobSearch')?.value || '').toLowerCase().trim();
        const tbody = document.getElementById('adminJobsTbody');
        const countLabel = document.getElementById('adminJobCountLabel');

        const filtered = this.allJobs.filter(j => 
            !q || (j.companyName && j.companyName.toLowerCase().includes(q)) || (j.jobTitle && j.jobTitle.toLowerCase().includes(q))
        );

        if (countLabel) countLabel.textContent = `Total: ${filtered.length}`;
        if (!tbody) return;

        tbody.innerHTML = filtered.map(j => `
            <tr>
                <td style="font-weight:700;">${Common.escapeHtml(j.companyName)}</td>
                <td style="font-weight:600;">${Common.escapeHtml(j.jobTitle)}</td>
                <td style="color:var(--text-secondary);font-size:0.88rem;">${Common.escapeHtml(j.jobLocation || 'Remote')}</td>
                <td><span class="badge badge-default">${Common.escapeHtml(j.jobType || 'Full-time')}</span></td>
                <td style="font-size:0.88rem;">${Common.escapeHtml(j.salaryRange || '—')}</td>
                <td style="text-align:right;">
                    <button class="btn btn-secondary btn-sm text-danger" onclick="AdminPage.deleteJob('${j.id}', '${Common.escapeHtml(j.jobTitle)}')">
                        Remove Job
                    </button>
                </td>
            </tr>
        `).join('');
    },

    async deleteJob(jobId, jobTitle) {
        const confirmed = await Common.confirm(`Remove job posting "${jobTitle}" from the platform?`);
        if (!confirmed) return;

        Storage.deleteJob(jobId);
        Common.showToast(`Job posting removed.`, 'info');
        this.loadAdminMetrics();
        this.loadJobs();
    },

    // --- Applications Tab ---
    loadApplications() {
        this.allApps = Storage.getAllApplications();
        this.filterApps();
    },

    filterApps() {
        const q = (document.getElementById('adminAppSearch')?.value || '').toLowerCase().trim();
        const tbody = document.getElementById('adminAppsTbody');
        const countLabel = document.getElementById('adminAppCountLabel');

        const filtered = this.allApps.filter(a => 
            !q || (a.companyName && a.companyName.toLowerCase().includes(q)) || (a.jobTitle && a.jobTitle.toLowerCase().includes(q))
        );

        if (countLabel) countLabel.textContent = `Total: ${filtered.length}`;
        if (!tbody) return;

        tbody.innerHTML = filtered.map(a => {
            const user = Storage.getUserById(a.userId);
            return `
                <tr>
                    <td style="font-weight:600;">${Common.escapeHtml(user ? user.fullName : 'Unknown')}</td>
                    <td style="font-weight:700;">${Common.escapeHtml(a.companyName)}</td>
                    <td>${Common.escapeHtml(a.jobTitle)}</td>
                    <td>${Common.getStatusBadge(a.status)}</td>
                    <td style="color:var(--text-secondary);font-size:0.85rem;">${Common.formatDate(a.applicationDate)}</td>
                    <td style="text-align:right;">
                        <button class="btn btn-secondary btn-sm text-danger" onclick="AdminPage.deleteApp('${a.id}')">
                            Delete Record
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async deleteApp(appId) {
        const confirmed = await Common.confirm(`Delete this application record?`);
        if (!confirmed) return;

        Storage.deleteApplication(appId);
        Common.showToast(`Application record deleted.`, 'info');
        this.loadAdminMetrics();
        this.loadApplications();
    },

    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === tabId));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AdminPage.init();
});

