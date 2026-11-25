/**
 * JobTracker - Profile & Resume Logic
 */
const ProfilePage = {
    isEditMode: false,
    currentSkills: [],

    init() {
        Common.init('profile');
        this.loadProfile();
        this.setupEventListeners();
    },

    loadProfile() {
        const user = Storage.getCurrentUser();
        let profile = Storage.getProfile();

        if (!profile && user) {
            profile = {
                userId: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: '',
                location: '',
                skills: '',
                education: '',
                experience: '',
                linkedinUrl: '',
                portfolioUrl: '',
                resumeName: '',
                resumeData: null
            };
            Storage.saveProfile(profile);
        }

        if (!profile) return;

        // Render Header & Initials
        document.getElementById('profileInitials').textContent = Common.getUserInitials(profile.fullName || (user ? user.fullName : 'U'));
        document.getElementById('profileHeaderName').textContent = profile.fullName || (user ? user.fullName : 'User');
        document.getElementById('profileHeaderEmail').textContent = profile.email || (user ? user.email : '');

        // Render View Mode Details
        document.getElementById('viewFullName').textContent = profile.fullName || '—';
        document.getElementById('viewEmail').textContent = profile.email || '—';
        document.getElementById('viewPhone').textContent = profile.phone || '—';
        document.getElementById('viewLocation').textContent = profile.location || '—';

        // Skills Tags
        const skillsContainer = document.getElementById('viewSkills');
        this.currentSkills = profile.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (this.currentSkills.length > 0) {
            skillsContainer.innerHTML = this.currentSkills.map(skill => `
                <span class="skill-tag">${Common.escapeHtml(skill)}</span>
            `).join('');
        } else {
            skillsContainer.innerHTML = `<span style="color:var(--text-muted);font-size:0.9rem;">No skills added yet.</span>`;
        }

        // LinkedIn & Portfolio links
        const linkedInContainer = document.getElementById('viewLinkedIn');
        if (profile.linkedinUrl) {
            linkedInContainer.innerHTML = `<a href="${Common.escapeHtml(profile.linkedinUrl)}" target="_blank" rel="noopener noreferrer" style="font-weight:600;display:inline-flex;align-items:center;gap:6px;">${Common.escapeHtml(profile.linkedinUrl)} ↗</a>`;
        } else {
            linkedInContainer.textContent = '—';
        }

        const portfolioContainer = document.getElementById('viewPortfolio');
        if (profile.portfolioUrl) {
            portfolioContainer.innerHTML = `<a href="${Common.escapeHtml(profile.portfolioUrl)}" target="_blank" rel="noopener noreferrer" style="font-weight:600;display:inline-flex;align-items:center;gap:6px;">${Common.escapeHtml(profile.portfolioUrl)} ↗</a>`;
        } else {
            portfolioContainer.textContent = '—';
        }

        document.getElementById('viewEducation').textContent = profile.education || 'No education details provided.';
        document.getElementById('viewExperience').textContent = profile.experience || 'No previous experience provided.';

        // Render Resume Box
        this.renderResumeStatus(profile);
    },

    renderResumeStatus(profile) {
        const box = document.getElementById('resumeStatusBox');
        if (!box) return;

        if (profile.resumeName && profile.resumeData) {
            box.innerHTML = `
                <div style="background:var(--bg-muted);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
                    <div style="display:flex;align-items:center;gap:16px;">
                        <div style="width:48px;height:48px;border-radius:var(--radius-md);background:rgba(239, 68, 68, 0.12);color:var(--danger);display:flex;align-items:center;justify-content:center;">
                            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        </div>
                        <div>
                            <div style="font-weight:700;font-size:1.05rem;color:var(--text-primary);">${Common.escapeHtml(profile.resumeName)}</div>
                            <div style="font-size:0.8rem;color:var(--success);font-weight:600;display:flex;align-items:center;gap:4px;margin-top:2px;">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Uploaded & Verified
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="ProfilePage.previewResume()">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            Preview
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="ProfilePage.removeResume()">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Remove
                        </button>
                    </div>
                </div>
            `;
        } else {
            box.innerHTML = `
                <div style="padding:16px;border-radius:var(--radius-md);background:var(--bg-muted);color:var(--text-secondary);font-size:0.9rem;text-align:center;">
                    No resume uploaded yet. Upload your PDF resume below to share with applications.
                </div>
            `;
        }
    },

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;

        const viewEl = document.getElementById('profileViewMode');
        const editEl = document.getElementById('profileEditMode');
        const editLabel = document.getElementById('editBtnLabel');

        if (this.isEditMode) {
            viewEl.style.display = 'none';
            editEl.style.display = 'block';
            editLabel.textContent = 'View Profile';
            this.populateEditForm();
        } else {
            viewEl.style.display = 'block';
            editEl.style.display = 'none';
            editLabel.textContent = 'Edit Profile';
        }
    },

    cancelEdit() {
        this.isEditMode = false;
        document.getElementById('profileViewMode').style.display = 'block';
        document.getElementById('profileEditMode').style.display = 'none';
        document.getElementById('editBtnLabel').textContent = 'Edit Profile';
    },

    populateEditForm() {
        const profile = Storage.getProfile() || {};
        const user = Storage.getCurrentUser() || {};

        document.getElementById('editFullName').value = profile.fullName || user.fullName || '';
        document.getElementById('editEmail').value = profile.email || user.email || '';
        document.getElementById('editPhone').value = profile.phone || '';
        document.getElementById('editLocation').value = profile.location || '';
        document.getElementById('editLinkedIn').value = profile.linkedinUrl || '';
        document.getElementById('editPortfolio').value = profile.portfolioUrl || '';
        document.getElementById('editEducation').value = profile.education || '';
        document.getElementById('editExperience').value = profile.experience || '';

        this.renderTagInputs();
    },

    renderTagInputs() {
        const container = document.getElementById('skillsTagContainer');
        const textInput = document.getElementById('skillTextInput');

        // Remove old tags
        container.querySelectorAll('.tag-badge').forEach(t => t.remove());

        // Insert badges before text input
        this.currentSkills.forEach((skill, index) => {
            const badge = document.createElement('span');
            badge.className = 'tag-badge';
            badge.innerHTML = `
                ${Common.escapeHtml(skill)}
                <button type="button" class="tag-remove-btn" onclick="ProfilePage.removeSkill(${index})">&times;</button>
            `;
            container.insertBefore(badge, textInput);
        });
    },

    removeSkill(index) {
        this.currentSkills.splice(index, 1);
        this.renderTagInputs();
    },

    setupEventListeners() {
        // Tag Input Handler
        const textInput = document.getElementById('skillTextInput');
        if (textInput) {
            textInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const val = textInput.value.trim().replace(/^,|,$/g, '');
                    if (val && !this.currentSkills.includes(val)) {
                        this.currentSkills.push(val);
                        textInput.value = '';
                        this.renderTagInputs();
                    }
                }
            });
        }

        // Form Submit
        const form = document.getElementById('profileForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSaveProfile(e));
        }

        // Resume Dropzone & File Input
        const fileInput = document.getElementById('resumeFileInput');
        const dropzone = document.getElementById('resumeDropzone');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.handleResumeUpload(file);
            });
        }

        if (dropzone) {
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });
            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file) this.handleResumeUpload(file);
            });
        }
    },

    handleSaveProfile(e) {
        e.preventDefault();
        this.clearEditErrors();

        const fullName = document.getElementById('editFullName').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const location = document.getElementById('editLocation').value.trim();
        const linkedIn = document.getElementById('editLinkedIn').value.trim();
        const portfolio = document.getElementById('editPortfolio').value.trim();
        const education = document.getElementById('editEducation').value.trim();
        const experience = document.getElementById('editExperience').value.trim();

        let isValid = true;

        if (!fullName) {
            this.showEditError('editFullName', 'Full name is required');
            isValid = false;
        }

        if (phone && !/^[+0-9\s\-()]{7,20}$/.test(phone)) {
            this.showEditError('editPhone', 'Please enter a valid phone number');
            isValid = false;
        }

        if (linkedIn && !/^https?:\/\/.+/.test(linkedIn)) {
            this.showEditError('editLinkedIn', 'URL must start with http:// or https://');
            isValid = false;
        }

        if (portfolio && !/^https?:\/\/.+/.test(portfolio)) {
            this.showEditError('editPortfolio', 'URL must start with http:// or https://');
            isValid = false;
        }

        if (!isValid) return;

        const currentProfile = Storage.getProfile() || {};
        const updated = {
            ...currentProfile,
            fullName,
            phone,
            location,
            skills: this.currentSkills.join(', '),
            linkedinUrl: linkedIn,
            portfolioUrl: portfolio,
            education,
            experience
        };

        Storage.saveProfile(updated);

        // Also update full name in user record if changed
        const user = Storage.getCurrentUser();
        if (user && user.fullName !== fullName) {
            user.fullName = fullName;
            const allUsers = Storage.getUsers().map(u => u.id === user.id ? { ...u, fullName } : u);
            Storage.set('jat_users', allUsers);
        }

        Common.showToast('Profile updated successfully!', 'success');
        this.cancelEdit();
        this.loadProfile();
    },

    handleResumeUpload(file) {
        if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
            Common.showToast('Invalid file format. Please upload a PDF document.', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            Common.showToast('File size exceeds 5MB limit.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const profile = Storage.getProfile() || {};
            profile.resumeName = file.name;
            profile.resumeData = dataUrl;
            Storage.saveProfile(profile);

            Common.showToast(`Resume "${file.name}" uploaded successfully!`, 'success');
            this.renderResumeStatus(profile);
        };
        reader.onerror = () => {
            Common.showToast('Failed to read file. Please try again.', 'error');
        };
        reader.readAsDataURL(file);
    },

    previewResume() {
        const profile = Storage.getProfile();
        if (!profile || !profile.resumeData) {
            Common.showToast('No resume available to preview.', 'warning');
            return;
        }

        // Open data URL in new window/tab
        const win = window.open();
        if (win) {
            win.document.write(`
                <html>
                    <head><title>Resume Preview - ${Common.escapeHtml(profile.resumeName)}</title></head>
                    <body style="margin:0;background:#333;">
                        <iframe src="${profile.resumeData}" frameborder="0" style="width:100%;height:100vh;"></iframe>
                    </body>
                </html>
            `);
        } else {
            // Fallback download if popup blocked
            const link = document.createElement('a');
            link.href = profile.resumeData;
            link.download = profile.resumeName || 'resume.pdf';
            link.click();
        }
    },

    async removeResume() {
        const confirmed = await Common.confirm('Are you sure you want to remove your resume? You can upload a new one anytime.');
        if (!confirmed) return;

        const profile = Storage.getProfile() || {};
        profile.resumeName = '';
        profile.resumeData = null;
        Storage.saveProfile(profile);

        Common.showToast('Resume removed.', 'info');
        this.renderResumeStatus(profile);
    },

    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === tabId));
    },

    showEditError(fieldId, msg) {
        const input = document.getElementById(fieldId);
        const err = document.getElementById(`${fieldId}Error`);
        if (input) input.classList.add('is-invalid');
        if (err) {
            err.textContent = msg;
            err.classList.add('show');
        }
    },

    clearEditErrors() {
        document.querySelectorAll('#profileEditMode .form-control').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('#profileEditMode .form-feedback').forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ProfilePage.init();
});

