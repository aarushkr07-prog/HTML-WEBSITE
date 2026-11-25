/**
 * JobTracker - Job Records Management Logic
 */
const JobsPage = {
    allJobs: [],

    init() {
        Common.init('jobs');
        this.loadJobs();
        this.setupEventListeners();
    },

    loadJobs() {
        this.allJobs = Storage.getJobs();
        this.populateLocationFilter();
        this.applyFilters();
    },

    populateLocationFilter() {
        const select = document.getElementById('filterLocation');
        if (!select) return;

        const currentVal = select.value;
        const locations = Array.from(new Set(this.allJobs.map(j => j.jobLocation).filter(Boolean)));

        select.innerHTML = '<option value="">All Locations</option>' + 
            locations.map(loc => `<option value="${Common.escapeHtml(loc)}" ${loc === currentVal ? 'selected' : ''}>${Common.escapeHtml(loc)}</option>`).join('');
    },

    setupEventListeners() {
        const searchInput = document.getElementById('jobSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }

        const typeFilter = document.getElementById('filterJobType');
        if (typeFilter) {
            typeFilter.addEventListener('change', () => this.applyFilters());
        }

        const locFilter = document.getElementById('filterLocation');
        if (locFilter) {
            locFilter.addEventListener('change', () => this.applyFilters());
        }

        const sortFilter = document.getElementById('sortJobsBy');
        if (sortFilter) {
            sortFilter.addEventListener('change', () => this.applyFilters());
        }

        const jobForm = document.getElementById('jobForm');
        if (jobForm) {
            jobForm.addEventListener('submit', (e) => this.handleSaveJob(e));
        }
    },

    applyFilters() {
        const searchTerm = (document.getElementById('jobSearchInput')?.value || '').toLowerCase().trim();
        const typeFilter = document.getElementById('filterJobType')?.value || '';
        const locFilter = document.getElementById('filterLocation')?.value || '';
        const sortBy = document.getElementById('sortJobsBy')?.value || 'latest';

        let filtered = this.allJobs.filter(job => {
            // Search match across company, title, location, skills
            const matchesSearch = !searchTerm || 
                (job.companyName && job.companyName.toLowerCase().includes(searchTerm)) ||
                (job.jobTitle && job.jobTitle.toLowerCase().includes(searchTerm)) ||
                (job.jobLocation && job.jobLocation.toLowerCase().includes(searchTerm)) ||
                (job.requiredSkills && job.requiredSkills.toLowerCase().includes(searchTerm));

            // Type filter
            const matchesType = !typeFilter || job.jobType === typeFilter;

            // Location filter
            const matchesLoc = !locFilter || job.jobLocation === locFilter;

            return matchesSearch && matchesType && matchesLoc;
        });

        // Sorting
        filtered.sort((a, b) => {
            if (sortBy === 'latest') {
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            } else if (sortBy === 'oldest') {
                return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            } else if (sortBy === 'company-asc') {
                return (a.companyName || '').localeCompare(b.companyName || '');
            } else if (sortBy === 'company-desc') {
                return (b.companyName || '').localeCompare(a.companyName || '');
            }
            return 0;
        });

        this.renderJobsList(filtered);
    },

    clearFilters() {
        const s = document.getElementById('jobSearchInput');
        const t = document.getElementById('filterJobType');
        const l = document.getElementById('filterLocation');
        const o = document.getElementById('sortJobsBy');

        if (s) s.value = '';
        if (t) t.value = '';
        if (l) l.value = '';
        if (o) o.value = 'latest';

        this.applyFilters();
    },

    renderJobsList(jobs) {
        const grid = document.getElementById('jobsGridContainer');
        const emptyState = document.getElementById('noJobsFound');
        const countHeader = document.getElementById('jobResultsCount');

        if (countHeader) {
            countHeader.textContent = `Showing ${jobs.length} ${jobs.length === 1 ? 'opportunity' : 'opportunities'}`;
        }

        if (!grid) return;

        if (jobs.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        grid.innerHTML = jobs.map(job => {
            const isSaved = Storage.isJobSaved(job.id);
            return `
                <div class="job-card">
                    <div class="job-card-top">
                        <div>
                            <div class="job-company">${Common.escapeHtml(job.companyName)}</div>
                            <h3 class="job-title">${Common.escapeHtml(job.jobTitle)}</h3>
                        </div>
                        <button class="job-bookmark-btn ${isSaved ? 'saved' : ''}" onclick="JobsPage.toggleSaveJob('${job.id}')" title="${isSaved ? 'Remove from Saved' : 'Save Job'}">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </button>
                    </div>

                    <div class="job-meta-chips">
                        <span class="meta-chip">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            ${Common.escapeHtml(job.jobLocation || 'Remote')}
                        </span>
                        <span class="meta-chip">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                            ${Common.escapeHtml(job.jobType || 'Full-time')}
                        </span>
                        ${job.salaryRange ? `
                            <span class="meta-chip">
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                ${Common.escapeHtml(job.salaryRange)}
                            </span>
                        ` : ''}
                        ${job.applicationDeadline ? `
                            <span class="meta-chip">
                                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                Deadline: ${Common.formatDate(job.applicationDeadline)}
                            </span>
                        ` : ''}
                    </div>

                    <div class="job-desc-preview">
                        ${Common.escapeHtml(job.jobDescription)}
                    </div>

                    <div class="job-card-bottom">
                        <div style="display:flex;gap:8px;">
                            <button class="btn btn-secondary btn-sm" onclick="JobsPage.viewJobDetails('${job.id}')">
                                Details
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="JobsPage.quickApply('${job.id}')">
                                Apply Now
                            </button>
                        </div>
                        <div style="display:flex;gap:4px;">
                            <button class="btn btn-secondary btn-sm" onclick="JobsPage.openEditJobModal('${job.id}')" title="Edit Job">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn btn-secondary btn-sm text-danger" onclick="JobsPage.deleteJob('${job.id}')" title="Delete Job">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    toggleSaveJob(jobId) {
        const isSaved = Storage.isJobSaved(jobId);
        if (isSaved) {
            Storage.removeSavedJob(jobId);
            Common.showToast('Job removed from saved list.', 'info');
        } else {
            Storage.addSavedJob(jobId);
            Common.showToast('Job saved to your bookmarks!', 'success');
        }
        this.applyFilters();
    },

    quickApply(jobId) {
        const job = Storage.getJobById(jobId);
        if (!job) return;

        // Check if already applied
        const existingApps = Storage.getApplications();
        const alreadyApplied = existingApps.some(a => a.jobId === jobId || (a.companyName.toLowerCase() === job.companyName.toLowerCase() && a.jobTitle.toLowerCase() === job.jobTitle.toLowerCase()));

        if (alreadyApplied) {
            Common.showToast(`You have already submitted an application for ${job.jobTitle} at ${job.companyName}!`, 'warning');
            return;
        }

        const newApp = {
            id: Storage.generateId('app'),
            userId: Storage.getCurrentUserId(),
            jobId: job.id,
            companyName: job.companyName,
            jobTitle: job.jobTitle,
            applicationDate: new Date().toISOString().split('T')[0],
            status: 'Applied',
            jobDescription: job.jobDescription,
            contactName: '',
            contactEmail: '',
            contactPhone: '',
            notes: 'Applied directly from Job Opportunities browser.',
            createdAt: new Date().toISOString()
        };

        Storage.addApplication(newApp);

        // Also add an activity automatically
        Storage.addActivity({
            id: Storage.generateId('act'),
            userId: Storage.getCurrentUserId(),
            applicationId: newApp.id,
            type: 'Emails Sent',
            title: `Applied to ${job.companyName}`,
            date: newApp.applicationDate,
            description: `Submitted application for ${job.jobTitle}.`,
            createdAt: new Date().toISOString()
        });

        Common.showToast(`Application for ${job.companyName} created successfully!`, 'success');
    },

    viewJobDetails(jobId) {
        const job = Storage.getJobById(jobId);
        if (!job) return;

        document.getElementById('viewJobModalTitle').textContent = `${job.jobTitle} at ${job.companyName}`;

        const body = document.getElementById('viewJobModalBody');
        body.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
                <div>
                    <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Location</label>
                    <div style="font-weight:600;margin-top:2px;">${Common.escapeHtml(job.jobLocation)}</div>
                </div>
                <div>
                    <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Employment Type</label>
                    <div style="font-weight:600;margin-top:2px;">${Common.escapeHtml(job.jobType)}</div>
                </div>
                <div>
                    <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Salary Range</label>
                    <div style="font-weight:600;margin-top:2px;">${Common.escapeHtml(job.salaryRange || 'Not disclosed')}</div>
                </div>
                <div>
                    <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Application Deadline</label>
                    <div style="font-weight:600;margin-top:2px;">${Common.formatDate(job.applicationDeadline)}</div>
                </div>
            </div>

            ${job.companyWebsite ? `
                <div style="margin-bottom:16px;">
                    <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Company Careers Site</label>
                    <div style="margin-top:4px;"><a href="${Common.escapeHtml(job.companyWebsite)}" target="_blank" rel="noopener noreferrer">${Common.escapeHtml(job.companyWebsite)} ↗</a></div>
                </div>
            ` : ''}

            ${job.requiredSkills ? `
                <div style="margin-bottom:20px;">
                    <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:6px;">Required Skills</label>
                    <div class="skills-tags-wrap">
                        ${job.requiredSkills.split(',').map(s => `<span class="skill-tag">${Common.escapeHtml(s.trim())}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

            <div>
                <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Job Description</label>
                <div style="margin-top:6px;font-size:0.92rem;line-height:1.6;background:var(--bg-muted);padding:16px;border-radius:var(--radius-md);white-space:pre-line;">${Common.escapeHtml(job.jobDescription)}</div>
            </div>
        `;

        const footer = document.getElementById('viewJobModalFooter');
        footer.innerHTML = `
            <button type="button" class="btn btn-secondary" onclick="JobsPage.closeViewJobModal()">Close</button>
            <button type="button" class="btn btn-primary" onclick="JobsPage.quickApply('${job.id}'); JobsPage.closeViewJobModal();">Apply for this Job</button>
        `;

        document.getElementById('viewJobModal').classList.add('active');
    },

    closeViewJobModal() {
        document.getElementById('viewJobModal').classList.remove('active');
    },

    openAddJobModal() {
        this.clearJobErrors();
        document.getElementById('jobForm').reset();
        document.getElementById('jobId').value = '';
        document.getElementById('jobModalTitle').textContent = 'Post New Job Opportunity';
        document.getElementById('jobModal').classList.add('active');
    },

    openEditJobModal(jobId) {
        const job = Storage.getJobById(jobId);
        if (!job) return;

        this.clearJobErrors();
        document.getElementById('jobId').value = job.id;
        document.getElementById('companyName').value = job.companyName || '';
        document.getElementById('jobTitle').value = job.jobTitle || '';
        document.getElementById('jobLocation').value = job.jobLocation || '';
        document.getElementById('jobType').value = job.jobType || 'Full-time';
        document.getElementById('salaryRange').value = job.salaryRange || '';
        document.getElementById('applicationDeadline').value = job.applicationDeadline || '';
        document.getElementById('companyWebsite').value = job.companyWebsite || '';
        document.getElementById('requiredSkills').value = job.requiredSkills || '';
        document.getElementById('jobDescription').value = job.jobDescription || '';

        document.getElementById('jobModalTitle').textContent = 'Edit Job Details';
        document.getElementById('jobModal').classList.add('active');
    },

    closeJobModal() {
        document.getElementById('jobModal').classList.remove('active');
    },

    handleSaveJob(e) {
        e.preventDefault();
        this.clearJobErrors();

        const id = document.getElementById('jobId').value;
        const companyName = document.getElementById('companyName').value.trim();
        const jobTitle = document.getElementById('jobTitle').value.trim();
        const jobLocation = document.getElementById('jobLocation').value.trim();
        const jobType = document.getElementById('jobType').value;
        const salaryRange = document.getElementById('salaryRange').value.trim();
        const applicationDeadline = document.getElementById('applicationDeadline').value;
        const companyWebsite = document.getElementById('companyWebsite').value.trim();
        const requiredSkills = document.getElementById('requiredSkills').value.trim();
        const jobDescription = document.getElementById('jobDescription').value.trim();

        let isValid = true;

        if (!companyName) {
            this.showJobError('companyName', 'Company name is required');
            isValid = false;
        }

        if (!jobTitle) {
            this.showJobError('jobTitle', 'Job title is required');
            isValid = false;
        }

        if (!jobLocation) {
            this.showJobError('jobLocation', 'Job location is required');
            isValid = false;
        }

        if (!jobDescription) {
            this.showJobError('jobDescription', 'Job description is required');
            isValid = false;
        }

        if (companyWebsite && !/^https?:\/\/.+/.test(companyWebsite)) {
            this.showJobError('companyWebsite', 'URL must start with http:// or https://');
            isValid = false;
        }

        if (!isValid) return;

        const jobPayload = {
            companyName,
            jobTitle,
            jobLocation,
            jobType,
            salaryRange,
            applicationDeadline,
            companyWebsite,
            requiredSkills,
            jobDescription
        };

        if (id) {
            Storage.updateJob(id, jobPayload);
            Common.showToast('Job record updated successfully!', 'success');
        } else {
            jobPayload.id = Storage.generateId('job');
            jobPayload.userId = Storage.getCurrentUserId();
            jobPayload.createdAt = new Date().toISOString();
            Storage.addJob(jobPayload);
            Common.showToast('New job opportunity added!', 'success');
        }

        this.closeJobModal();
        this.loadJobs();
    },

    async deleteJob(jobId) {
        const job = Storage.getJobById(jobId);
        if (!job) return;

        const confirmed = await Common.confirm(`Are you sure you want to delete the job posting for "${job.jobTitle}" at "${job.companyName}"?`);
        if (!confirmed) return;

        Storage.deleteJob(jobId);
        Common.showToast('Job record deleted.', 'info');
        this.loadJobs();
    },

    showJobError(fieldId, msg) {
        const input = document.getElementById(fieldId);
        const err = document.getElementById(`${fieldId}Error`);
        if (input) input.classList.add('is-invalid');
        if (err) {
            err.textContent = msg;
            err.classList.add('show');
        }
    },

    clearJobErrors() {
        document.querySelectorAll('#jobModal .form-control').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('#jobModal .form-feedback').forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    JobsPage.init();
});

