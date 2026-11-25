/**
 * JobTracker - User Dashboard Logic
 */
const Dashboard = {
    init() {
        Common.init('dashboard');
        this.renderGreeting();
        this.renderStats();
        this.renderRecentApplications();
        this.renderStatusBreakdown();
    },

    renderGreeting() {
        const user = Storage.getCurrentUser();
        const greetingEl = document.getElementById('welcomeGreeting');
        if (greetingEl && user) {
            greetingEl.textContent = `Welcome back, ${Common.escapeHtml(user.fullName.split(' ')[0])}!`;
        }
    },

    renderStats() {
        const applications = Storage.getApplications();
        const savedJobs = Storage.getSavedJobs();

        // 1. Total Applied
        const total = applications.length;

        // 2. Pending (Applied or Under Review)
        const pending = applications.filter(a => ['Applied', 'Under Review'].includes(a.status)).length;

        // 3. Interview Scheduled
        const interviews = applications.filter(a => a.status === 'Interview Scheduled').length;

        // 4. Selected / Accepted (Offer Received or Accepted)
        const selected = applications.filter(a => ['Offer Received', 'Accepted'].includes(a.status)).length;

        // 5. Rejected
        const rejected = applications.filter(a => a.status === 'Rejected').length;

        // 6. Saved Jobs
        const savedCount = savedJobs.length;

        document.getElementById('statTotalApplied').textContent = total;
        document.getElementById('statPending').textContent = pending;
        document.getElementById('statInterviews').textContent = interviews;
        document.getElementById('statSelected').textContent = selected;
        document.getElementById('statRejected').textContent = rejected;
        document.getElementById('statSaved').textContent = savedCount;
    },

    renderRecentApplications() {
        const tbody = document.getElementById('recentApplicationsTbody');
        const emptyState = document.getElementById('noRecentAppsMessage');
        if (!tbody) return;

        const applications = Storage.getApplications();

        if (applications.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // Sort by date descending and take top 5
        const recent = [...applications].sort((a, b) => new Date(b.applicationDate || b.createdAt) - new Date(a.applicationDate || a.createdAt)).slice(0, 5);

        tbody.innerHTML = recent.map(app => `
            <tr>
                <td>
                    <div style="font-weight:700;color:var(--text-primary);">${Common.escapeHtml(app.companyName)}</div>
                </td>
                <td>
                    <div style="font-weight:500;">${Common.escapeHtml(app.jobTitle)}</div>
                </td>
                <td style="color:var(--text-secondary);font-size:0.85rem;">
                    ${Common.formatDate(app.applicationDate)}
                </td>
                <td>
                    ${Common.getStatusBadge(app.status)}
                </td>
                <td style="text-align:right;">
                    <button class="btn btn-secondary btn-sm" onclick="Dashboard.viewAppDetails('${app.id}')">
                        View
                    </button>
                </td>
            </tr>
        `).join('');
    },

    renderStatusBreakdown() {
        const container = document.getElementById('statusDistributionBars');
        if (!container) return;

        const applications = Storage.getApplications();
        const total = applications.length;

        const statuses = [
            { label: 'Wishlist', color: '#94a3b8' },
            { label: 'Applied', color: '#3b82f6' },
            { label: 'Under Review', color: '#f59e0b' },
            { label: 'Interview Scheduled', color: '#8b5cf6' },
            { label: 'Assessment', color: '#0ea5e9' },
            { label: 'Offer Received', color: '#10b981' },
            { label: 'Accepted', color: '#059669' },
            { label: 'Rejected', color: '#ef4444' }
        ];

        if (total === 0) {
            container.innerHTML = `<div style="font-size:0.88rem;color:var(--text-muted);text-align:center;padding:12px;">No application data recorded yet.</div>`;
            return;
        }

        container.innerHTML = statuses.map(st => {
            const count = applications.filter(a => a.status === st.label).length;
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;

            return `
                <div class="status-bar-row">
                    <div class="status-bar-header">
                        <span>${st.label}</span>
                        <span>${count} (${percent}%)</span>
                    </div>
                    <div class="status-bar-track">
                        <div class="status-bar-fill" style="width: ${percent}%; background-color: ${st.color};"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    viewAppDetails(appId) {
        const app = Storage.getApplicationById(appId);
        if (!app) return;

        document.getElementById('modalAppTitle').textContent = `${app.companyName} — ${app.jobTitle}`;

        const body = document.getElementById('modalAppBody');
        body.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
                <div>
                    <span style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Status</span>
                    <div style="margin-top:4px;">${Common.getStatusBadge(app.status)}</div>
                </div>
                <div>
                    <span style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Date Applied</span>
                    <div style="font-weight:600;margin-top:4px;">${Common.formatDate(app.applicationDate)}</div>
                </div>
            </div>

            <div style="margin-bottom:16px;">
                <label style="font-size:0.82rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;">Job Description</label>
                <p style="margin-top:6px;font-size:0.92rem;line-height:1.5;background:var(--bg-muted);padding:12px;border-radius:var(--radius-md);">
                    ${Common.escapeHtml(app.jobDescription || 'No job description provided.')}
                </p>
            </div>

            <div style="margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div>
                    <label style="font-size:0.82rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;">Contact Person</label>
                    <div style="font-size:0.92rem;font-weight:600;margin-top:4px;">${Common.escapeHtml(app.contactName || '—')}</div>
                </div>
                <div>
                    <label style="font-size:0.82rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;">Contact Email</label>
                    <div style="font-size:0.92rem;margin-top:4px;">${app.contactEmail ? `<a href="mailto:${Common.escapeHtml(app.contactEmail)}">${Common.escapeHtml(app.contactEmail)}</a>` : '—'}</div>
                </div>
            </div>

            ${app.contactPhone ? `
                <div style="margin-bottom:16px;">
                    <label style="font-size:0.82rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;">Contact Phone</label>
                    <div style="font-size:0.92rem;margin-top:4px;">${Common.escapeHtml(app.contactPhone)}</div>
                </div>
            ` : ''}

            <div>
                <label style="font-size:0.82rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;">Application Notes</label>
                <p style="margin-top:6px;font-size:0.92rem;line-height:1.5;background:var(--bg-muted);padding:12px;border-radius:var(--radius-md);">
                    ${Common.escapeHtml(app.notes || 'No notes added yet.')}
                </p>
            </div>
        `;

        document.getElementById('appDetailModal').classList.add('active');
    },

    closeAppDetailModal() {
        document.getElementById('appDetailModal').classList.remove('active');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});

