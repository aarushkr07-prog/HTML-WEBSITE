/**
 * JobTracker - LocalStorage Data Storage & Management Layer
 */
const Storage = {
    // Basic Storage Helpers
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error reading from localStorage', e);
            return null;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error writing to localStorage', e);
        }
    },
    remove(key) {
        localStorage.removeItem(key);
    },

    // ID Generator
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    },

    // --- Users & Authentication ---
    getUsers() {
        return this.get('jat_users') || [];
    },
    addUser(user) {
        const users = this.getUsers();
        users.push(user);
        this.set('jat_users', users);
    },
    getUserByEmail(email) {
        if (!email) return null;
        return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    },
    getUserById(id) {
        return this.getUsers().find(u => u.id === id);
    },
    deleteUser(userId) {
        let users = this.getUsers().filter(u => u.id !== userId);
        this.set('jat_users', users);

        // Also clean up user's data
        let jobs = (this.get('jat_jobs') || []).filter(j => j.userId !== userId);
        this.set('jat_jobs', jobs);

        let apps = (this.get('jat_applications') || []).filter(a => a.userId !== userId);
        this.set('jat_applications', apps);

        let saved = (this.get('jat_savedJobs') || []).filter(s => s.userId !== userId);
        this.set('jat_savedJobs', saved);

        let acts = (this.get('jat_activities') || []).filter(a => a.userId !== userId);
        this.set('jat_activities', acts);

        let profiles = this.get('jat_profiles') || {};
        delete profiles[userId];
        this.set('jat_profiles', profiles);
    },
    setCurrentUser(email) {
        this.set('jat_currentUser', email);
    },
    getCurrentUser() {
        const email = this.get('jat_currentUser');
        if (!email) return null;
        return this.getUserByEmail(email);
    },
    getCurrentUserId() {
        const user = this.getCurrentUser();
        return user ? user.id : null;
    },
    isLoggedIn() {
        return !!this.getCurrentUser();
    },
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    },
    logout() {
        this.remove('jat_currentUser');
    },

    // --- Jobs ---
    // Returns jobs belonging to the current user (or public jobs if unassigned)
    getJobs() {
        const all = this.getAllJobs();
        const userId = this.getCurrentUserId();
        return all.filter(j => j.userId === userId || !j.userId);
    },
    getAllJobs() {
        return this.get('jat_jobs') || [];
    },
    getJobById(id) {
        return this.getAllJobs().find(j => j.id === id);
    },
    addJob(job) {
        const jobs = this.getAllJobs();
        jobs.unshift(job);
        this.set('jat_jobs', jobs);
    },
    updateJob(id, updates) {
        let jobs = this.getAllJobs().map(j => {
            if (j.id === id) {
                return { ...j, ...updates, updatedAt: new Date().toISOString() };
            }
            return j;
        });
        this.set('jat_jobs', jobs);
    },
    deleteJob(id) {
        let jobs = this.getAllJobs().filter(j => j.id !== id);
        this.set('jat_jobs', jobs);
        // Also remove from saved
        let saved = (this.get('jat_savedJobs') || []).filter(s => s.jobId !== id);
        this.set('jat_savedJobs', saved);
    },

    // --- Applications ---
    getApplications() {
        const all = this.getAllApplications();
        const userId = this.getCurrentUserId();
        return all.filter(a => a.userId === userId);
    },
    getAllApplications() {
        return this.get('jat_applications') || [];
    },
    getApplicationById(id) {
        return this.getAllApplications().find(a => a.id === id);
    },
    addApplication(app) {
        const apps = this.getAllApplications();
        apps.unshift(app);
        this.set('jat_applications', apps);
    },
    updateApplication(id, updates) {
        let apps = this.getAllApplications().map(a => {
            if (a.id === id) {
                return { ...a, ...updates, updatedAt: new Date().toISOString() };
            }
            return a;
        });
        this.set('jat_applications', apps);
    },
    deleteApplication(id) {
        let apps = this.getAllApplications().filter(a => a.id !== id);
        this.set('jat_applications', apps);
        // Also clean up related activities
        let acts = (this.get('jat_activities') || []).filter(act => act.applicationId !== id);
        this.set('jat_activities', acts);
    },

    // --- Saved Jobs ---
    getSavedJobs() {
        const all = this.get('jat_savedJobs') || [];
        const userId = this.getCurrentUserId();
        return all.filter(s => s.userId === userId);
    },
    addSavedJob(jobId) {
        const userId = this.getCurrentUserId();
        if (!userId) return false;
        const saved = this.get('jat_savedJobs') || [];
        if (saved.some(s => s.jobId === jobId && s.userId === userId)) {
            return false; // already saved
        }
        saved.unshift({
            id: this.generateId('saved'),
            userId: userId,
            jobId: jobId,
            savedAt: new Date().toISOString()
        });
        this.set('jat_savedJobs', saved);
        return true;
    },
    removeSavedJob(jobId) {
        const userId = this.getCurrentUserId();
        let saved = (this.get('jat_savedJobs') || []).filter(s => !(s.jobId === jobId && s.userId === userId));
        this.set('jat_savedJobs', saved);
    },
    isJobSaved(jobId) {
        const userId = this.getCurrentUserId();
        return (this.get('jat_savedJobs') || []).some(s => s.jobId === jobId && s.userId === userId);
    },

    // --- Activities ---
    getActivities() {
        const all = this.getAllActivities();
        const userId = this.getCurrentUserId();
        return all.filter(a => a.userId === userId);
    },
    getAllActivities() {
        return this.get('jat_activities') || [];
    },
    getActivityById(id) {
        return this.getAllActivities().find(a => a.id === id);
    },
    addActivity(activity) {
        const acts = this.getAllActivities();
        acts.unshift(activity);
        this.set('jat_activities', acts);
    },
    updateActivity(id, updates) {
        let acts = this.getAllActivities().map(a => {
            if (a.id === id) {
                return { ...a, ...updates, updatedAt: new Date().toISOString() };
            }
            return a;
        });
        this.set('jat_activities', acts);
    },
    deleteActivity(id) {
        let acts = this.getAllActivities().filter(a => a.id !== id);
        this.set('jat_activities', acts);
    },

    // --- User Profile ---
    getProfile() {
        const userId = this.getCurrentUserId();
        if (!userId) return null;
        const profiles = this.get('jat_profiles') || {};
        return profiles[userId] || null;
    },
    saveProfile(profileData) {
        const userId = this.getCurrentUserId();
        if (!userId) return;
        const profiles = this.get('jat_profiles') || {};
        profiles[userId] = { ...profileData, userId, updatedAt: new Date().toISOString() };
        this.set('jat_profiles', profiles);
    },

    // --- Theme Preference ---
    getTheme() {
        return this.get('jat_theme') || 'light';
    },
    setTheme(theme) {
        this.set('jat_theme', theme);
    },

    // --- Initial Demo Data Population ---
    initDemoData() {
        if (this.get('jat_initialized')) return;

        // 1. Users
        const demoUsers = [
            {
                id: 'user_demo1',
                fullName: 'Alex Johnson',
                email: 'demo@jobtracker.com',
                password: 'password123',
                role: 'user',
                createdAt: '2026-09-01T10:00:00Z'
            },
            {
                id: 'user_admin1',
                fullName: 'Platform Admin',
                email: 'admin@jobtracker.com',
                password: 'adminpassword',
                role: 'admin',
                createdAt: '2026-08-15T09:00:00Z'
            }
        ];
        this.set('jat_users', demoUsers);

        // 2. Jobs
        const demoJobs = [
            {
                id: 'job_1',
                userId: 'user_demo1',
                companyName: 'Google',
                jobTitle: 'Senior Frontend Engineer',
                jobLocation: 'Mountain View, CA (Hybrid)',
                jobType: 'Full-time',
                salaryRange: '$165,000 - $210,000',
                requiredSkills: 'JavaScript, TypeScript, React, Web Performance, CSS3',
                jobDescription: 'Architect and develop modern web applications for Google Cloud Platform tools. Collaborate with UX designers, product managers, and backend engineers.',
                companyWebsite: 'https://careers.google.com',
                applicationDeadline: '2027-02-28',
                createdAt: '2026-10-10T12:00:00Z'
            },
            {
                id: 'job_2',
                userId: 'user_demo1',
                companyName: 'Microsoft',
                jobTitle: 'Full Stack Developer',
                jobLocation: 'Redmond, WA (Remote)',
                jobType: 'Remote',
                salaryRange: '$140,000 - $185,000',
                requiredSkills: 'C#, .NET Core, TypeScript, Azure, RESTful APIs',
                jobDescription: 'Design resilient microservices and frontend portals for Microsoft 365 developer ecosystem. Strong emphasis on test-driven development and CI/CD.',
                companyWebsite: 'https://careers.microsoft.com',
                applicationDeadline: '2027-03-15',
                createdAt: '2026-10-12T08:30:00Z'
            },
            {
                id: 'job_3',
                userId: 'user_demo1',
                companyName: 'Spotify',
                jobTitle: 'Product UI Designer & Developer',
                jobLocation: 'New York, NY',
                jobType: 'Full-time',
                salaryRange: '$130,000 - $170,000',
                requiredSkills: 'Figma, Design Systems, HTML5, CSS Grid, Accessible UI',
                jobDescription: 'Craft intuitive streaming and creator tools used by millions. Maintain and scale design tokens and modular UI components.',
                companyWebsite: 'https://spotifyjobs.com',
                applicationDeadline: '2027-01-31',
                createdAt: '2026-10-15T15:00:00Z'
            },
            {
                id: 'job_4',
                userId: 'user_demo1',
                companyName: 'Amazon Web Services',
                jobTitle: 'Solutions Architect Intern',
                jobLocation: 'Seattle, WA',
                jobType: 'Internship',
                salaryRange: '$48 / hour',
                requiredSkills: 'Cloud Architecture, Python, Networking, Linux',
                jobDescription: 'Partner with enterprise customers to design scalable, secure, and cost-effective cloud architectures across AWS services.',
                companyWebsite: 'https://amazon.jobs',
                applicationDeadline: '2027-02-15',
                createdAt: '2026-10-18T10:15:00Z'
            },
            {
                id: 'job_5',
                userId: 'user_demo1',
                companyName: 'Netflix',
                jobTitle: 'UI Platform Engineer',
                jobLocation: 'Los Gatos, CA (Remote)',
                jobType: 'Remote',
                salaryRange: '$180,000 - $240,000',
                requiredSkills: 'JavaScript, WebGL, Node.js, Performance Optimization',
                jobDescription: 'Build next-generation TV and mobile streaming experiences. Deliver flawless 60fps animations across hundreds of client devices.',
                companyWebsite: 'https://jobs.netflix.com',
                applicationDeadline: '2027-04-01',
                createdAt: '2026-10-22T14:40:00Z'
            },
            {
                id: 'job_6',
                userId: 'user_demo1',
                companyName: 'Stripe',
                jobTitle: 'Developer Advocate',
                jobLocation: 'San Francisco, CA',
                jobType: 'Full-time',
                salaryRange: '$150,000 - $195,000',
                requiredSkills: 'Technical Writing, APIs, JavaScript, Public Speaking',
                jobDescription: 'Empower developers globally by creating exemplary SDK code samples, technical guides, video walk-throughs, and engaging community forums.',
                companyWebsite: 'https://stripe.com/jobs',
                applicationDeadline: '2027-03-10',
                createdAt: '2026-10-25T11:00:00Z'
            }
        ];
        this.set('jat_jobs', demoJobs);

        // 3. Applications
        const demoApps = [
            {
                id: 'app_1',
                userId: 'user_demo1',
                jobId: 'job_1',
                companyName: 'Google',
                jobTitle: 'Senior Frontend Engineer',
                applicationDate: '2026-10-14',
                status: 'Interview Scheduled',
                jobDescription: 'Architect and develop modern web applications for Google Cloud Platform tools.',
                contactName: 'Elena Rostova',
                contactEmail: 'erostova@google.com',
                contactPhone: '+1 (650) 253-0000',
                notes: 'Passed the preliminary recruiter screening. Technical round focused on JavaScript event loop and system architecture scheduled for Nov 10th.',
                createdAt: '2026-10-14T10:00:00Z'
            },
            {
                id: 'app_2',
                userId: 'user_demo1',
                jobId: 'job_2',
                companyName: 'Microsoft',
                jobTitle: 'Full Stack Developer',
                applicationDate: '2026-10-19',
                status: 'Under Review',
                jobDescription: 'Design resilient microservices and frontend portals for Microsoft 365 developer ecosystem.',
                contactName: 'Marcus Vance',
                contactEmail: 'mvance@microsoft.com',
                contactPhone: '+1 (425) 882-8080',
                notes: 'Application submitted via employee referral. Recruiter acknowledged receipt; portfolio review currently in progress.',
                createdAt: '2026-10-19T14:30:00Z'
            },
            {
                id: 'app_3',
                userId: 'user_demo1',
                jobId: 'job_3',
                companyName: 'Spotify',
                jobTitle: 'Product UI Designer & Developer',
                applicationDate: '2026-10-02',
                status: 'Assessment',
                jobDescription: 'Craft intuitive streaming and creator tools used by millions.',
                contactName: 'Clara Lindqvist',
                contactEmail: 'clara.l@spotify.com',
                contactPhone: '+1 (212) 555-0199',
                notes: 'Received design system coding challenge. Required to build responsive, accessible audio visualizer components within 5 days.',
                createdAt: '2026-10-02T09:15:00Z'
            },
            {
                id: 'app_4',
                userId: 'user_demo1',
                jobId: 'job_4',
                companyName: 'Amazon Web Services',
                jobTitle: 'Solutions Architect Intern',
                applicationDate: '2026-09-20',
                status: 'Offer Received',
                jobDescription: 'Partner with enterprise customers to design scalable, secure, and cost-effective cloud architectures.',
                contactName: 'Devon Hughes',
                contactEmail: 'dhughes@amazon.com',
                contactPhone: '+1 (206) 266-1000',
                notes: 'Received official offer letter! Summer internship program starting June. Need to review compensation and benefits packet.',
                createdAt: '2026-09-20T16:00:00Z'
            },
            {
                id: 'app_5',
                userId: 'user_demo1',
                jobId: 'job_5',
                companyName: 'Netflix',
                jobTitle: 'UI Platform Engineer',
                applicationDate: '2026-09-10',
                status: 'Rejected',
                jobDescription: 'Build next-generation TV and mobile streaming experiences.',
                contactName: 'HR Talent Acquisition',
                contactEmail: 'talent@netflix.com',
                contactPhone: '+1 (408) 540-3700',
                notes: 'Position closed internally. Received constructive feedback regarding distributed systems performance. Will reconnect in 6 months.',
                createdAt: '2026-09-10T11:20:00Z'
            },
            {
                id: 'app_6',
                userId: 'user_demo1',
                jobId: 'job_6',
                companyName: 'Stripe',
                jobTitle: 'Developer Advocate',
                applicationDate: '2026-10-28',
                status: 'Applied',
                jobDescription: 'Empower developers globally by creating exemplary SDK code samples.',
                contactName: 'Liam O’Connor',
                contactEmail: 'loconnor@stripe.com',
                contactPhone: '+1 (415) 555-0142',
                notes: 'Submitted application along with link to personal tech blog and open-source contributions.',
                createdAt: '2026-10-28T13:45:00Z'
            }
        ];
        this.set('jat_applications', demoApps);

        // 4. Saved Jobs
        const demoSaved = [
            {
                id: 'saved_1',
                userId: 'user_demo1',
                jobId: 'job_3',
                savedAt: '2026-10-15T09:00:00Z'
            },
            {
                id: 'saved_2',
                userId: 'user_demo1',
                jobId: 'job_5',
                savedAt: '2026-10-23T11:20:00Z'
            }
        ];
        this.set('jat_savedJobs', demoSaved);

        // 5. Activities
        const demoActivities = [
            {
                id: 'act_1',
                userId: 'user_demo1',
                applicationId: 'app_1',
                type: 'Interview Details',
                title: 'Technical Screen with Staff Engineer',
                date: '2026-11-02',
                description: 'Covered JavaScript async microtasks, memory leak debugging in SPAs, and real-time WebSocket state management.',
                createdAt: '2026-11-02T16:30:00Z'
            },
            {
                id: 'act_2',
                userId: 'user_demo1',
                applicationId: 'app_1',
                type: 'Recruiter Calls',
                title: 'Initial Recruiter Chat with Elena',
                date: '2026-10-20',
                description: 'Reviewed career goals, salary expectations, hybrid policy at Mountain View campus, and interview loop roadmap.',
                createdAt: '2026-10-20T11:00:00Z'
            },
            {
                id: 'act_3',
                userId: 'user_demo1',
                applicationId: 'app_3',
                type: 'Assessment Updates',
                title: 'Submitted Spotify UI Design System Challenge',
                date: '2026-10-25',
                description: 'Completed responsive CSS Grid audio cards with WCAG AAA contrast and keyboard accessibility compliance.',
                createdAt: '2026-10-25T19:00:00Z'
            },
            {
                id: 'act_4',
                userId: 'user_demo1',
                applicationId: 'app_2',
                type: 'Emails Sent',
                title: 'Sent Thank You & Follow-up Note to Marcus',
                date: '2026-10-22',
                description: 'Sent email thanking the engineering manager and reiterating strong interest in the M365 developer tools team.',
                createdAt: '2026-10-22T09:30:00Z'
            },
            {
                id: 'act_5',
                userId: 'user_demo1',
                applicationId: 'app_4',
                type: 'Company Meetings',
                title: 'Offer Package Walkthrough with Devon',
                date: '2026-10-30',
                description: 'Discussed intern housing stipend, mentor matching program, and potential project placement with the Serverless Lambda team.',
                createdAt: '2026-10-30T14:00:00Z'
            }
        ];
        this.set('jat_activities', demoActivities);

        // 6. Profiles
        const demoProfile = {
            userId: 'user_demo1',
            fullName: 'Alex Johnson',
            email: 'demo@jobtracker.com',
            phone: '+1 (555) 234-5678',
            location: 'San Francisco, CA, USA',
            skills: 'JavaScript, HTML5, CSS3, React, TypeScript, Node.js, Web Performance, Git, REST APIs',
            education: 'Bachelor of Science in Computer Science, University of California, Berkeley (2020 - 2024)',
            experience: 'Software Engineer Intern at CloudScale Labs (June 2023 - August 2023)\n- Engineered reusable UI components and optimized client bundle sizes by 28%.\n- Collaborated on GraphQL API integration for real-time analytics monitoring.',
            linkedinUrl: 'https://linkedin.com/in/alexjohnson-dev',
            portfolioUrl: 'https://alexjohnson.dev',
            resumeName: 'Alex_Johnson_Resume_2026.pdf',
            resumeData: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeJwrzk8tUvDRz8xLy8xTKEtNLsnMz1PIyC9KqVTIKs3Jyc/TUUjJTMxWcA3WdQ0OMDQw1HM1MgQAS9sQVwplbmRzdHJlYW0KZW5kb2JqCg==',
            updatedAt: '2026-10-28T12:00:00Z'
        };
        const profiles = {};
        profiles['user_demo1'] = demoProfile;
        this.set('jat_profiles', profiles);

        // Default login session to demo user for seamless preview
        if (!this.get('jat_currentUser')) {
            this.set('jat_currentUser', 'demo@jobtracker.com');
        }

        this.set('jat_initialized', true);
    }
};

// Auto initialize demo data
Storage.initDemoData();
