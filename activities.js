/**
 * JobTracker - Activity & Interaction Timeline Logic
 */
const ActivitiesPage = {
    allActivities: [],

    init() {
        Common.init('activities');
        this.loadActivities();
        this.populateApplicationsDropdowns();
        this.setupEventListeners();
    },

    loadActivities() {
        this.allActivities = Storage.getActivities();
        this.applyFilters();
    },

    populateApplicationsDropdowns() {
        const apps = Storage.getApplications();

        const filterSelect = document.getElementById('filterAppRelated');
        const formSelect = document.getElementById('relatedAppSelect');

        const optionsHtml = apps.map(a => `
            <option value="${a.id}">${Common.escapeHtml(a.companyName)} — ${Common.escapeHtml(a.jobTitle)}</option>
        `).join('');

        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Applications</option>' + optionsHtml;
        }

        if (formSelect) {
            formSelect.innerHTML = '<option value="">General / None</option>' + optionsHtml;
        }
    },

    setupEventListeners() {
        const searchInput = document.getElementById('activitySearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }

        const typeFilter = document.getElementById('filterActivityType');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.applyFilters());
        }

        const appFilter = document.getElementById('filterAppRelated');
        if (appFilter) {
            appFilter.addEventListener('change', () => this.applyFilters());
        }

        const sortFilter = document.getElementById('sortActivitiesBy');
        if (sortFilter) {
            sortFilter.addEventListener('change', () => this.applyFilters());
        }

        const form = document.getElementById('activityForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSaveActivity(e));
        }
    },

    applyFilters() {
        const search = (document.getElementById('activitySearchInput')?.value || '').toLowerCase().trim();
        const typeFilter = document.getElementById('filterActivityType')?.value || '';
        const appFilter = document.getElementById('filterAppRelated')?.value || '';
        const sortBy = document.getElementById('sortActivitiesBy')?.value || 'latest';

        let filtered = this.allActivities.filter(act => {
            const matchesSearch = !search ||
                (act.title && act.title.toLowerCase().includes(search)) ||
                (act.description && act.description.toLowerCase().includes(search));

            const matchesType = !typeFilter || act.type === typeFilter;
            const matchesApp = !appFilter || act.applicationId === appFilter;

            return matchesSearch && matchesType && matchesApp;
        });

        // Sorting
        filtered.sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt || 0);
            const dateB = new Date(b.date || b.createdAt || 0);
            return sortBy === 'latest' ? dateB - dateA : dateA - dateB;
        });

        this.renderTimeline(filtered);
    },

    clearFilters() {
        const s = document.getElementById('activitySearchInput');
        const t = document.getElementById('filterActivityType');
        const a = document.getElementById('filterAppRelated');
        const o = document.getElementById('sortActivitiesBy');

        if (s) s.value = '';
        if (t) t.value = '';
        if (a) a.value = '';
        if (o) o.value = 'latest';

        this.applyFilters();
    },

    renderTimeline(activities) {
        const container = document.getElementById('activitiesTimeline');
        const emptyState = document.getElementById('noActivitiesFound');

        if (!container) return;

        if (activities.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = activities.map(act => {
            const relatedApp = act.applicationId ? Storage.getApplicationById(act.applicationId) : null;
            const iconSvg = this.getActivityIcon(act.type);

            return `
                <div class="timeline-item">
                    <div class="timeline-bullet">
                        ${iconSvg}
                    </div>
                    <div class="timeline-card">
                        <div class="timeline-header">
                            <div>
                                <span class="badge" style="${this.getTypeBadgeStyle(act.type)};margin-bottom:6px;">
                                    ${Common.escapeHtml(act.type)}
                                </span>
                                <h4 class="timeline-title">${Common.escapeHtml(act.title)}</h4>
                            </div>
                            <span class="timeline-date-chip">
                                📅 ${Common.formatDate(act.date)}
                            </span>
                        </div>

                        <div class="timeline-body">
                            ${Common.escapeHtml(act.description)}
                        </div>

                        <div class="timeline-footer">
                            <div>
                                ${relatedApp ? `
                                    <span style="font-size:0.8rem;color:var(--text-secondary);display:inline-flex;align-items:center;gap:4px;">
                                        💼 <strong>${Common.escapeHtml(relatedApp.companyName)}</strong> (${Common.escapeHtml(relatedApp.jobTitle)})
                                    </span>
                                ` : `
                                    <span style="font-size:0.8rem;color:var(--text-muted);">
                                        📌 General Career Activity
                                    </span>
                                `}
                            </div>
                            <div style="display:flex;gap:6px;">
                                <button class="btn btn-secondary btn-sm" onclick="ActivitiesPage.openEditActivityModal('${act.id}')" title="Edit">
                                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button class="btn btn-secondary btn-sm text-danger" onclick="ActivitiesPage.deleteActivity('${act.id}')" title="Delete">
                                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    getActivityIcon(type) {
        switch (type) {
            case 'Recruiter Calls':
                return `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
            case 'Interview Details':
                return `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
            case 'Emails Sent':
                return `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
            default:
                return `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
        }
    },

    getTypeBadgeStyle(type) {
        const styles = {
            'Recruiter Calls': 'background: rgba(59, 130, 246, 0.15); color: #2563eb;',
            'Interview Details': 'background: rgba(124, 77, 255, 0.15); color: #7c4dff;',
            'Emails Sent': 'background: rgba(16, 185, 129, 0.15); color: #059669;',
            'Follow-up Dates': 'background: rgba(245, 158, 11, 0.15); color: #d97706;',
            'Assessment Updates': 'background: rgba(14, 165, 233, 0.15); color: #0284c7;',
            'Company Meetings': 'background: rgba(236, 72, 153, 0.15); color: #db2777;',
            'Personal Notes': 'background: rgba(100, 116, 139, 0.15); color: #475569;'
        };
        return styles[type] || 'background: var(--bg-muted); color: var(--text-secondary);';
    },

    openAddActivityModal() {
        this.clearActivityErrors();
        document.getElementById('activityForm').reset();
        document.getElementById('activityId').value = '';
        document.getElementById('activityDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('activityModalTitle').textContent = 'Log Interaction Activity';
        document.getElementById('activityModal').classList.add('active');
    },

    openEditActivityModal(actId) {
        const act = Storage.getActivityById(actId);
        if (!act) return;

        this.clearActivityErrors();
        document.getElementById('activityId').value = act.id;
        document.getElementById('activityType').value = act.type || 'Recruiter Calls';
        document.getElementById('activityDate').value = act.date || '';
        document.getElementById('relatedAppSelect').value = act.applicationId || '';
        document.getElementById('activityTitle').value = act.title || '';
        document.getElementById('activityDescription').value = act.description || '';

        document.getElementById('activityModalTitle').textContent = 'Edit Activity';
        document.getElementById('activityModal').classList.add('active');
    },

    closeActivityModal() {
        document.getElementById('activityModal').classList.remove('active');
    },

    handleSaveActivity(e) {
        e.preventDefault();
        this.clearActivityErrors();

        const id = document.getElementById('activityId').value;
        const type = document.getElementById('activityType').value;
        const date = document.getElementById('activityDate').value;
        const applicationId = document.getElementById('relatedAppSelect').value;
        const title = document.getElementById('activityTitle').value.trim();
        const description = document.getElementById('activityDescription').value.trim();

        let isValid = true;

        if (!date) {
            this.showActivityError('activityDate', 'Date is required');
            isValid = false;
        }

        if (!title) {
            this.showActivityError('activityTitle', 'Title is required');
            isValid = false;
        }

        if (!description) {
            this.showActivityError('activityDescription', 'Description is required');
            isValid = false;
        }

        if (!isValid) return;

        const payload = {
            type,
            date,
            applicationId,
            title,
            description
        };

        if (id) {
            Storage.updateActivity(id, payload);
            Common.showToast('Activity record updated!', 'success');
        } else {
            payload.id = Storage.generateId('act');
            payload.userId = Storage.getCurrentUserId();
            payload.createdAt = new Date().toISOString();
            Storage.addActivity(payload);
            Common.showToast('New activity logged!', 'success');
        }

        this.closeActivityModal();
        this.loadActivities();
    },

    async deleteActivity(actId) {
        const act = Storage.getActivityById(actId);
        if (!act) return;

        const confirmed = await Common.confirm(`Are you sure you want to delete "${act.title}"?`);
        if (!confirmed) return;

        Storage.deleteActivity(actId);
        Common.showToast('Activity deleted.', 'info');
        this.loadActivities();
    },

    showActivityError(fieldId, msg) {
        const input = document.getElementById(fieldId);
        const err = document.getElementById(`${fieldId}Error`);
        if (input) input.classList.add('is-invalid');
        if (err) {
            err.textContent = msg;
            err.classList.add('show');
        }
    },

    clearActivityErrors() {
        document.querySelectorAll('#activityModal .form-control').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('#activityModal .form-feedback').forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ActivitiesPage.init();
});

