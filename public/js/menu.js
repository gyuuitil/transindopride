const menuItems = document.querySelectorAll('.menu-group li');
const sidebar = document.querySelector('.sidebar');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileOverlay = document.querySelector('.mobile-overlay');

const ACTIVE_PAGE_KEY = 'trans_indopride_active_page';

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
    });
}

if (mobileOverlay) {
    mobileOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        mobileOverlay.classList.remove('active');
    });
}

menuItems.forEach(item => {
    item.addEventListener('click', function() {
        menuItems.forEach(m => m.classList.remove('active'));
        this.classList.add('active');
        const page = this.getAttribute('data-page');
        try { localStorage.setItem(ACTIVE_PAGE_KEY, page); } catch (e) {}
        renderPage(page);
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
            mobileOverlay.classList.remove('active');
        }
    });
});

function renderPage(page) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById('page-' + page);
    if (targetPage) targetPage.classList.add('active');
}

document.addEventListener('DOMContentLoaded', function() {
    const lastActivePage = localStorage.getItem(ACTIVE_PAGE_KEY) || 'home';
    const activeMenuItem = document.querySelector(`[data-page="${lastActivePage}"]`);
    if (activeMenuItem) activeMenuItem.classList.add('active');
    renderPage(lastActivePage);
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isBossOrHRD = user.primary_role === 'Boss' || user.secondary_role === 'HRD';
    if (!isBossOrHRD) {
        const addUserMenu = document.querySelector('[data-page="add-user"]');
        const changeRoleMenu = document.querySelector('[data-page="change-role"]');
        if (addUserMenu) addUserMenu.closest('.menu-group').style.display = 'none';
        if (changeRoleMenu) changeRoleMenu.closest('.menu-group').style.display = 'none';
    }
});
