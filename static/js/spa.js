class MiniLMS {
    constructor() {
        this.init();
    }

    init() {
        this.setupHTMX();
        this.setupGlobalHandlers();
    }

    setupHTMX() {
        // Global HTMX configuration
        htmx.on('htmx:beforeRequest', (e) => {
            this.showLoading(e.detail.elt);
        });

        htmx.on('htmx:afterRequest', (e) => {
            this.hideLoading(e.detail.elt);
            this.updateDocumentTitle();
        });

        htmx.on('htmx:beforeSwap', (e) => {
            // Handle form errors
            if (e.detail.xhr.status === 400) {
                e.detail.shouldSwap = true;
                e.detail.isError = false;
            }
        });
    }

    showLoading(element) {
        element.classList.add('loading', 'opacity-50');
        if (element.tagName === 'FORM') {
            const submitBtn = element.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Loading...';
            }
        }
    }

    hideLoading(element) {
        element.classList.remove('loading', 'opacity-50');
        if (element.tagName === 'FORM') {
            const submitBtn = element.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = submitBtn.dataset.originalText || 'Submit';
            }
        }
    }

    updateDocumentTitle() {
        const newTitle = document.querySelector('h1')?.textContent;
        if (newTitle) {
            document.title = `${newTitle} - Mini LMS`;
        }
    }

    setupGlobalHandlers() {
        // Handle form submissions with JSON responses
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.method.toLowerCase() === 'post' && !form.hasAttribute('hx-post')) {
                e.preventDefault();
                this.handleFormSubmit(form);
            }
        });
    }

    async handleFormSubmit(form) {
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        
        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.dataset.originalText = submitBtn.textContent;
                submitBtn.textContent = 'Loading...';
            }

            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification(data.message, 'success');
                if (data.redirect_url) {
                    setTimeout(() => {
                        htmx.ajax('GET', data.redirect_url, '#main-content');
                    }, 1000);
                }
            } else {
                this.showNotification('Please fix the errors below', 'error');
                this.displayFormErrors(form, data.errors);
            }
        } catch (error) {
            this.showNotification('An error occurred', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset.originalText;
            }
        }
    }

    showNotification(message, type = 'info') {
        // Use Alpine.js notification system
        Alpine.store('addNotification', message, type);
    }

    displayFormErrors(form, errors) {
        // Clear previous errors
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        form.querySelectorAll('.border-red-500').forEach(el => el.classList.remove('border-red-500'));

        // Display new errors
        Object.keys(errors).forEach(fieldName => {
            const input = form.querySelector(`[name="${fieldName}"]`);
            if (input) {
                input.classList.add('border-red-500');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message text-red-500 text-sm mt-1';
                errorDiv.textContent = errors[fieldName][0];
                input.parentNode.appendChild(errorDiv);
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.miniLMS = new MiniLMS();
});