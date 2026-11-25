/**
 * JobTracker - Authentication & Validation Logic
 */
const Auth = {
    initLogin() {
        // Redirect if already logged in
        if (Storage.isLoggedIn()) {
            window.location.href = 'dashboard.html';
            return;
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        this.setupPasswordToggles();
    },

    initRegister() {
        // Redirect if already logged in
        if (Storage.isLoggedIn()) {
            window.location.href = 'dashboard.html';
            return;
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        this.setupPasswordToggles();
    },

    setupPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.password-toggle-btn');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const input = document.getElementById(targetId);
                if (!input) return;

                if (input.type === 'password') {
                    input.type = 'text';
                    btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
                } else {
                    input.type = 'password';
                    btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
                }
            });
        });
    },

    handleLogin(e) {
        e.preventDefault();
        this.clearErrors();

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        let isValid = true;

        if (!email) {
            this.showError('email', 'Email address is required');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showError('email', 'Please provide a valid email format');
            isValid = false;
        }

        if (!password) {
            this.showError('password', 'Password is required');
            isValid = false;
        }

        if (!isValid) return;

        // Verify credentials in LocalStorage
        const user = Storage.getUserByEmail(email);
        if (!user || user.password !== password) {
            this.showError('password', 'Invalid email address or password');
            return;
        }

        // Set login session
        Storage.setCurrentUser(user.email);

        // Feedback & Redirect
        const submitBtn = document.getElementById('submitLoginBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
        }

        setTimeout(() => {
            window.location.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
        }, 500);
    },

    handleRegister(e) {
        e.preventDefault();
        this.clearErrors();

        const fullNameInput = document.getElementById('fullName');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        const fullName = fullNameInput ? fullNameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

        let isValid = true;

        if (!fullName) {
            this.showError('fullName', 'Full name is required');
            isValid = false;
        }

        if (!email) {
            this.showError('email', 'Email address is required');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showError('email', 'Please provide a valid email format');
            isValid = false;
        } else if (Storage.getUserByEmail(email)) {
            this.showError('email', 'An account with this email already exists');
            isValid = false;
        }

        if (!password) {
            this.showError('password', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            this.showError('password', 'Password must be at least 6 characters');
            isValid = false;
        }

        if (password !== confirmPassword) {
            this.showError('confirmPassword', 'Passwords do not match');
            isValid = false;
        }

        if (!isValid) return;

        // Register user in Storage
        const newUser = {
            id: Storage.generateId('user'),
            fullName: fullName,
            email: email,
            password: password,
            role: 'user',
            createdAt: new Date().toISOString()
        };

        Storage.addUser(newUser);

        // Initialize empty profile for new user
        Storage.saveProfile({
            userId: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            phone: '',
            location: '',
            skills: '',
            education: '',
            experience: '',
            linkedinUrl: '',
            portfolioUrl: '',
            resumeName: '',
            resumeData: null
        });

        // Set session
        Storage.setCurrentUser(newUser.email);

        const submitBtn = document.getElementById('submitRegisterBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';
        }

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 600);
    },

    fillDemoUser(email, password) {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        if (emailInput && passwordInput) {
            emailInput.value = email;
            passwordInput.value = password;
            this.clearErrors();
        }
    },

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    showError(fieldId, message) {
        const input = document.getElementById(fieldId);
        const feedback = document.getElementById(`${fieldId}Error`);
        if (input) input.classList.add('is-invalid');
        if (feedback) {
            feedback.textContent = message;
            feedback.classList.add('show');
        }
    },

    clearErrors() {
        document.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('.form-feedback').forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
    }
};
