/**
 * JobTracker - Job Application Management & Status Tracking Logic
 */
const ApplicationsPage = {
    allApps: [],
    currentViewingAppId: null,

    // Status progression definition
    statusOrder: [
        'Wishlist',
        'Applied',
        'Under Review',
        'Interview Scheduled',
        'Assessment',
        'Offer Received',
        'Accepted'
    ],

    init() {
        Common.init('applications');
        this.loadApplications();
        this.setupEventListeners();
    },

    loadApplications() {
        this.allApps = Storage.getApplications();
        this.applyFilters();
    },

    setupEventListeners() {
        const searchInput = document.getElementById('appSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }

        const statusFilter = document.getElementById('filterAppStatus');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }

        const sortFilter = document.getElementById('sortAppsBy');
        if (sortFilter) {
            sortFilter.addEventListener('change', () => this.applyFilters());
        }

        const form = document.getElementById('appForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSaveApplication(e));
        }
    },

    applyFilters() {
        const search = (document.getElementById('appSearchInput')?.value || '').toLowerCase().trim();
        const statusFilter = document.getElementById('filterAppStatus')?.value || '';
        const sortBy = document.getElementById('sortAppsBy')?.value || 'latest';

        let filtered = this.allApps.filter(app => {
            const matchesSearch = !search ||
                (app.companyName && app.companyName.toLowerCase().includes(search)) ||
                (app.jobTitle && app.jobTitle.toLowerCase().includes(search)) ||
                (app.notes && app.notes.toLowerCase().includes(search));

            const matchesStatus = !statusFilter || app.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        // Sorting
        filtered.sort((a, b) => {
            if (sortBy === 'latest') {
                return new Date(b.applicationDate || 0) - new Date(a.applicationDate || 0);
            } else if (sortBy === 'oldest') {
                return new Date(a.applicationDate || 0) - new Date(b.applicationDate || 0);
            } else if (sortBy === 'company-asc') {
                return (a.companyName || '').localeCompare(b.companyName || '');
            } else if (sortBy === 'status') {
                const idxA = this.statusOrder.indexOf(a.status);
                const idxB = this.statusOrder.indexOf(b.status);
                return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
            }
            return 0;
        });

        this.renderTable(filtered);
    },

    clearFilters() {
        const s = document.getElementById('appSearchInput');
        const st = document.getElementById('filterAppStatus');
        const sb = document.getElementById('sortAppsBy');

        if (s) s.value = '';
        if (st) st.value = '';
        if (sb) sb.value = 'latest';

        this.applyFilters();
    },

    renderTable(apps) {
        const tbody = document.getElementById('applicationsTableBody');
        const emptyState = document.getElementById('noApplicationsFound');
        const countHeader = document.getElementById('appResultsCount');

        if (countHeader) {
            countHeader.textContent = `Showing ${apps.length} ${apps.length === 1 ? 'application' : 'applications'}`;
        }

        if (!tbody) return;

        if (apps.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        tbody.innerHTML = apps.map(app => `
            <tr>
                <td>
                    <div style="font-weight:700;color:var(--text-primary);font-size:0.95rem;">${Common.escapeHtml(app.companyName)}</div>
                </td>
                <td>
                    <div style="font-weight:600;">${Common.escapeHtml(app.jobTitle)}</div>
                </td>
                <td style="color:var(--text-secondary);font-size:0.88rem;">
                    ${Common.formatDate(app.applicationDate)}
                </td>
                <td>
                    ${Common.getStatusBadge(app.status)}
                </td>
                <td style="color:var(--text-secondary);font-size:0.85rem;">
                    ${app.contactName ? Common.escapeHtml(app.contactName) : '—'}
                </td>
                <td style="text-align:right;">
                    <div class="table-actions" style="justify-content:flex-end;">
                        <button class="btn btn-secondary btn-sm" onclick="ApplicationsPage.viewApplication('${app.id}')">
                            Details
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="ApplicationsPage.openEditApplicationModal('${app.id}')" title="Edit Application">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-secondary btn-sm text-danger" onclick="ApplicationsPage.deleteApplication('${app.id}')" title="Delete Application">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    viewApplication(appId) {
        const app = Storage.getApplicationById(appId);
        if (!app) return;

        this.currentViewingAppId = appId;

        document.getElementById('viewModalCompanyTitle').textContent = `${app.jobTitle} at ${app.companyName}`;
        document.getElementById('viewModalAppId').textContent = `Application ID: ${app.id}`;
        document.getElementById('quickStatusSelect').value = app.status;

        // Render Stepper Tracker
        this.renderProgressTracker(app.status);

        // Render Details
        const detailsContainer = document.getElementById('viewAppModalDetails');
        detailsContainer.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px;">
                <div>
                    <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Application Date</label>
                    <div style="font-weight:600;margin-top:2px;">${Common.formatDate(app.applicationDate)}</div>
                </div>
                <div>
                    <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Current Stage</label>
                    <div style="margin-top:2px;">${Common.getStatusBadge(app.status)}</div>
                </div>
            </div>

            <div style="margin-bottom:18px;">
                <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Job Description</label>
                <div style="margin-top:4px;font-size:0.92rem;line-height:1.5;background:var(--bg-muted);padding:12px;border-radius:var(--radius-md);white-space:pre-line;">
                    ${Common.escapeHtml(app.jobDescription || 'No description added.')}
                </div>
            </div>

            <div style="background:var(--bg-muted);padding:14px;border-radius:var(--radius-md);margin-bottom:18px;">
                <div style="font-weight:700;font-size:0.85rem;color:var(--text-primary);margin-bottom:8px;text-transform:uppercase;">Contact Information</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;font-size:0.9rem;">
                    <div><strong>Name:</strong> ${Common.escapeHtml(app.contactName || '—')}</div>
                    <div><strong>Email:</strong> ${app.contactEmail ? `<a href="mailto:${Common.escapeHtml(app.contactEmail)}">${Common.escapeHtml(app.contactEmail)}</a>` : '—'}</div>
                    <div><strong>Phone:</strong> ${Common.escapeHtml(app.contactPhone || '—')}</div>
                </div>
            </div>

            <div>
                <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Notes & Key Details</label>
                <div style="margin-top:4px;font-size:0.92rem;line-height:1.5;background:var(--bg-muted);padding:12px;border-radius:var(--radius-md);white-space:pre-line;">
                    ${Common.escapeHtml(app.notes || 'No notes added.')}
                </div>
            </div>
        `;

        const footer = document.getElementById('viewAppModalFooter');
        footer.innerHTML = `
            <button type="button" class="btn btn-secondary" onclick="ApplicationsPage.closeViewModal()">Close</button>
            <button type="button" class="btn btn-secondary" onclick="ApplicationsPage.closeViewModal(); ApplicationsPage.openEditApplicationModal('${app.id}');">Edit Details</button>
        `;

        document.getElementById('viewAppModal').classList.add('active');
    },

    renderProgressTracker(currentStatus) {
        const container = document.getElementById('modalStepperContainer');
        if (!container) return;

        const isRejected = currentStatus === 'Rejected';
        const currentIndex = this.statusOrder.indexOf(currentStatus);

        let stepsToShow = [...this.statusOrder];
        if (isRejected) {
            stepsToShow[stepsToShow.length - 1] = 'Rejected';
        }

        container.innerHTML = `
            <div class="stepper-steps">
                ${stepsToShow.map((step, idx) => {
                    let stateClass = '';
                    let symbol = idx + 1;

                    if (isRejected && step === 'Rejected') {
                        stateClass = 'completed';
                        symbol = '✕';
                    } else if (currentIndex >= 0) {
                        if (idx < currentIndex) {
                            stateClass = 'completed';
                            symbol = '✓';
                        } else if (idx === currentIndex) {
                            stateClass = 'active';
                        }
                    }

                    return `
                        <div class="step-node ${stateClass}">
                            <div class="step-circle" ${isRejected && step === 'Rejected' ? 'style="background:var(--danger);border-color:var(--danger);color:#fff;"' : ''}>${symbol}</div>
                            <span class="step-label">${step}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    updateCurrentStatus() {
        if (!this.currentViewingAppId) return;

        const newStatus = document.getElementById('quickStatusSelect').value;
        const app = Storage.getApplicationById(this.currentViewingAppId);
        if (!app) return;

        const oldStatus = app.status;
        Storage.updateApplication(this.currentViewingAppId, { status: newStatus });

        // Also log an activity event automatically for status progression
        Storage.addActivity({
            id: Storage.generateId('act'),
            userId: Storage.getCurrentUserId(),
            applicationId: app.id,
            type: 'Assessment Updates',
            title: `Status updated to ${newStatus}`,
            date: new Date().toISOString().split('T')[0],
            description: `Application stage changed from ${oldStatus} to ${newStatus}.`,
            createdAt: new Date().toISOString()
        });

        Common.showToast(`Status updated to "${newStatus}"!`, 'success');

        this.viewApplication(this.currentViewingAppId);
        this.loadApplications();
    },

    closeViewModal() {
        document.getElementById('viewAppModal').classList.remove('active');
        this.currentViewingAppId = null;
    },

    openAddApplicationModal() {
        this.clearAppErrors();
        document.getElementById('appForm').reset();
        document.getElementById('formAppId').value = '';
        document.getElementById('appDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('appStatus').value = 'Applied';
        document.getElementById('appModalTitle').textContent = 'Add Job Application';
        document.getElementById('appModal').classList.add('active');
    },

    openEditApplicationModal(appId) {
        const app = Storage.getApplicationById(appId);
        if (!app) return;

        this.clearAppErrors();
        document.getElementById('formAppId').value = app.id;
        document.getElementById('appCompanyName').value = app.companyName || '';
        document.getElementById('appJobTitle').value = app.jobTitle || '';
        document.getElementById('appDate').value = app.applicationDate || '';
        document.getElementById('appStatus').value = app.status || 'Applied';
        document.getElementById('appJobDesc').value = app.jobDescription || '';
        document.getElementById('appContactName').value = app.contactName || '';
        document.getElementById('appContactEmail').value = app.contactEmail || '';
        document.getElementById('appContactPhone').value = app.contactPhone || '';
        document.getElementById('appNotes').value = app.notes || '';

        document.getElementById('appModalTitle').textContent = 'Edit Application';
        document.getElementById('appModal').classList.add('active');
    },

    closeAppModal() {
        document.getElementById('appModal').classList.remove('active');
    },

    handleSaveApplication(e) {
        e.preventDefault();
        this.clearAppErrors();

        const id = document.getElementById('formAppId').value;
        const companyName = document.getElementById('appCompanyName').value.trim();
        const jobTitle = document.getElementById('appJobTitle').value.trim();
        const applicationDate = document.getElementById('appDate').value;
        const status = document.getElementById('appStatus').value;
        const jobDescription = document.getElementById('appJobDesc').value.trim();
        const contactName = document.getElementById('appContactName').value.trim();
        const contactEmail = document.getElementById('appContactEmail').value.trim();
        const contactPhone = document.getElementById('appContactPhone').value.trim();
        const notes = document.getElementById('appNotes').value.trim();

        let isValid = true;

        if (!companyName) {
            this.showAppError('appCompanyName', 'Company name is required');
            isValid = false;
        }

        if (!jobTitle) {
            this.showAppError('appJobTitle', 'Job position is required');
            isValid = false;
        }

        if (!applicationDate) {
            this.showAppError('appDate', 'Application date is required');
            isValid = false;
        }

        if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
            this.showAppError('appContactEmail', 'Invalid email address format');
            isValid = false;
        }

        if (!isValid) return;

        const appData = {
            companyName,
            jobTitle,
            applicationDate,
            status,
            jobDescription,
            contactName,
            contactEmail,
            contactPhone,
            notes
        };

        if (id) {
            Storage.updateApplication(id, appData);
            Common.showToast('Application updated successfully!', 'success');
        } else {
            appData.id = Storage.generateId('app');
            appData.userId = Storage.getCurrentUserId();
            appData.createdAt = new Date().toISOString();
            Storage.addApplication(appData);

            // Automatically log an activity
            Storage.addActivity({
                id: Storage.generateId('act'),
                userId: Storage.getCurrentUserId(),
                applicationId: appData.id,
                type: 'Emails Sent',
                title: `Applied to ${companyName}`,
                date: applicationDate,
                description: `Created new application for ${jobTitle} at ${companyName}. Initial status: ${status}.`,
                createdAt: new Date().toISOString()
            });

            Common.showToast('Job application recorded!', 'success');
        }

        this.closeAppModal();
        this.loadApplications();
    },

    async deleteApplication(appId) {
        const app = Storage.getApplicationById(appId);
        if (!app) return;

        const confirmed = await Common.confirm(`Are you sure you want to delete your application for ${app.jobTitle} at ${app.companyName}? All associated activities will also be removed.`);
        if (!confirmed) return;

        Storage.deleteApplication(appId);
        Common.showToast('Application deleted.', 'info');
        this.loadApplications();
    },

    showAppError(fieldId, msg) {
        const input = document.getElementById(fieldId);
        const err = document.getElementById(`${fieldId}Error`);
        if (input) input.classList.add('is-invalid');
        if (err) {
            err.textContent = msg;
            err.classList.add('show');
        }
    },

    clearAppErrors() {
        document.querySelectorAll('#appModal .form-control').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('#appModal .form-feedback').forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ApplicationsPage.init();
});

