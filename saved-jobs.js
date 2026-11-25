/**
 * JobTracker - Saved Jobs Logic
 */
const SavedJobsPage = {
    init() {
        Common.init('saved-jobs');
        this.loadSavedJobs();
    },

    loadSavedJobs() {
        const savedRecords = Storage.getSavedJobs();
        const grid = document.getElementById('savedJobsGrid');
        const emptyState = document.getElementById('noSavedJobs');
        const countHeader = document.getElementById('savedCountHeader');

        // Resolve job details
        const jobs = savedRecords.map(record => {
            const jobData = Storage.getJobById(record.jobId);
            return {
                ...jobData,
                savedRecordId: record.id,
                savedAt: record.savedAt
            };
        }).filter(j => !!j.id); // Filter out any deleted jobs

        if (countHeader) {
            countHeader.textContent = `Saved Jobs (${jobs.length})`;
        }

        if (!grid) return;

        if (jobs.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        grid.innerHTML = jobs.map(job => `
            <div class="job-card">
                <div class="job-card-top">
                    <div>
                        <div class="job-company">${Common.escapeHtml(job.companyName)}</div>
                        <h3 class="job-title">${Common.escapeHtml(job.jobTitle)}</h3>
                    </div>
                    <button class="job-bookmark-btn saved" onclick="SavedJobsPage.removeSaved('${job.id}', '${Common.escapeHtml(job.companyName)}')" title="Remove from Saved">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
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
                    <span class="meta-chip" style="color:var(--text-muted);">
                        Saved: ${Common.formatDate(job.savedAt)}
                    </span>
                </div>

                <div class="job-desc-preview">
                    ${Common.escapeHtml(job.jobDescription)}
                </div>

                <div class="job-card-bottom">
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-secondary btn-sm" onclick="SavedJobsPage.viewJob('${job.id}')">
                            Details
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="SavedJobsPage.moveToApplied('${job.id}')">
                            Apply Now
                        </button>
                    </div>
                    <button class="btn btn-secondary btn-sm text-danger" onclick="SavedJobsPage.removeSaved('${job.id}', '${Common.escapeHtml(job.companyName)}')" title="Remove Saved Job">
                        Remove
                    </button>
                </div>
            </div>
        `).join('');
    },

    async removeSaved(jobId, companyName) {
        const confirmed = await Common.confirm(`Remove "${companyName || 'this job'}" from your saved list?`);
        if (!confirmed) return;

        Storage.removeSavedJob(jobId);
        Common.showToast('Job removed from saved list.', 'info');
        this.loadSavedJobs();
    },

    moveToApplied(jobId) {
        const job = Storage.getJobById(jobId);
        if (!job) return;

        // Check if already applied
        const existingApps = Storage.getApplications();
        const alreadyApplied = existingApps.some(a => a.jobId === jobId || (a.companyName.toLowerCase() === job.companyName.toLowerCase() && a.jobTitle.toLowerCase() === job.jobTitle.toLowerCase()));

        if (alreadyApplied) {
            Common.showToast(`You have already applied to ${job.companyName}!`, 'warning');
            return;
        }

        // 1. Create Application
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
            notes: 'Moved to applied from Saved Jobs.',
            createdAt: new Date().toISOString()
        };
        Storage.addApplication(newApp);

        // 2. Remove from Saved
        Storage.removeSavedJob(job.id);

        // 3. Log Activity
        Storage.addActivity({
            id: Storage.generateId('act'),
            userId: Storage.getCurrentUserId(),
            applicationId: newApp.id,
            type: 'Emails Sent',
            title: `Applied to ${job.companyName}`,
            date: newApp.applicationDate,
            description: `Moved saved job to Applied stage.`,
            createdAt: new Date().toISOString()
        });

        Common.showToast(`Moved to active applications!`, 'success');
        this.loadSavedJobs();
    },

    viewJob(jobId) {
        const job = Storage.getJobById(jobId);
        if (!job) return;

        document.getElementById('savedJobModalTitle').textContent = `${job.jobTitle} at ${job.companyName}`;

        const body = document.getElementById('savedJobModalBody');
        body.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
                <div>
                    <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Location</label>
                    <div style="font-weight:600;margin-top:2px;">${Common.escapeHtml(job.jobLocation)}</div>
                </div>
                <div>
                    <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Job Type</label>
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
                    <label style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Website</label>
                    <div style="margin-top:2px;"><a href="${Common.escapeHtml(job.companyWebsite)}" target="_blank" rel="noopener noreferrer">${Common.escapeHtml(job.companyWebsite)} ↗</a></div>
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

        const footer = document.getElementById('savedJobModalFooter');
        footer.innerHTML = `
            <button type="button" class="btn btn-secondary" onclick="SavedJobsPage.closeModal()">Close</button>
            <button type="button" class="btn btn-primary" onclick="SavedJobsPage.moveToApplied('${job.id}'); SavedJobsPage.closeModal();">Move to Applied</button>
        `;

        document.getElementById('savedJobDetailModal').classList.add('active');
    },

    closeModal() {
        document.getElementById('savedJobDetailModal').classList.remove('active');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    SavedJobsPage.init();
});
