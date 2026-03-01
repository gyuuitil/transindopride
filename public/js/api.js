/**
 * API Helper - Production Ready
 * Trans Indopride Fleet Management
 * No dummy data, 100% from database
 */

// Auth Guard - Redirect to login if not authenticated
(function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }
})();

// API Helper Object
const API = {
    baseUrl: '/api',
    
    async call(endpoint, method = 'GET', data = null) {
        const token = localStorage.getItem('token');
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };
        
        if (data) options.body = JSON.stringify(data);
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, options);
        const result = await response.json();
        
        // Handle unauthorized
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            throw new Error('Session expired');
        }
        
        if (!response.ok) {
            throw new Error(result.message || 'Request failed');
        }
        
        return result;
    },
    
    // Auth endpoints
    auth: {
        me: () => API.call('/auth/me'),
        logout: () => API.call('/auth/logout', 'POST'),
    },
    
    // User endpoints
    users: {
        getAll: (params = '') => API.call(`/users${params}`),
        getById: (id) => API.call(`/users/${id}`),
        create: (data) => API.call('/users', 'POST', data),
        update: (id, data) => API.call(`/users/${id}`, 'PUT', data),
        delete: (id) => API.call(`/users/${id}`, 'DELETE'),
        updateRole: (id, data) => API.call(`/users/${id}/role`, 'PATCH', data), // Fixed typo
    },
    
    // Duty endpoints
    duties: {
        getAll: (params = '') => API.call(`/duties${params}`),
        create: (data) => API.call('/duties', 'POST', data),
        markIncentivePaid: (id) => API.call(`/duties/${id}/incentive-paid`, 'PATCH'),
        markBonusPaid: (id) => API.call(`/duties/${id}/bonus-paid`, 'PATCH'),
    }
};

// Load sidebar user info
(function loadSidebarUser() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const nameEl = document.getElementById('sidebar-username');
    const roleEl = document.getElementById('sidebar-userrole');
    if (nameEl) nameEl.textContent = user.name || 'User';
    if (roleEl) roleEl.textContent = user.primary_role || '-';
})();

// Logout handler
document.addEventListener('DOMContentLoaded', function () {
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function () {
            if (!confirm('Yakin ingin logout?')) return;
            
            try {
                await API.auth.logout();
            } catch (e) {
                console.log('Logout error (ignored):', e);
            }
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }
});
