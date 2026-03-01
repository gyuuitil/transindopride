if (localStorage.getItem('token')) {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', function() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');

    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.className = 'fas fa-eye-slash';
            } else {
                passwordInput.type = 'password';
                eyeIcon.className = 'fas fa-eye';
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginIcon = document.getElementById('loginIcon');
    const loginText = document.getElementById('loginText');
    const errorBox = document.getElementById('errorBox');

    if (errorBox) errorBox.style.display = 'none';
    if (loginBtn) loginBtn.disabled = true;
    if (loginIcon) loginIcon.className = 'fas fa-spinner fa-spin';
    if (loginText) loginText.textContent = 'Memproses...';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Email atau password salah');
        }

        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        if (loginIcon) loginIcon.className = 'fas fa-check';
        if (loginText) loginText.textContent = 'Berhasil!';
        
        setTimeout(() => { window.location.href = 'index.html'; }, 600);

    } catch (error) {
        if (errorBox) {
            document.getElementById('errorText').textContent = error.message || 'Login gagal. Coba lagi.';
            errorBox.style.display = 'flex';
        }
        if (loginBtn) loginBtn.disabled = false;
        if (loginIcon) loginIcon.className = 'fas fa-sign-in-alt';
        if (loginText) loginText.textContent = 'Masuk';
    }
}
