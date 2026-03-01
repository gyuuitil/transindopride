/**
 * Add User Page - Production Ready
 * Trans Indopride Fleet Management
 * Creates users via API (no localStorage)
 */

// ==========================================
// SHOW MESSAGES
// ==========================================

function showSuccessMessage(message = 'User berhasil ditambahkan!') {
    const msgEl = document.getElementById('success-message');
    if (msgEl) {
        msgEl.textContent = message;
        msgEl.style.display = 'flex';
        setTimeout(() => {
            msgEl.style.display = 'none';
        }, 4000);
    }
}

function showErrorMessage(message = 'Gagal menambahkan user!') {
    alert(`❌ ${message}`);
}

// ==========================================
// RESET FORM
// ==========================================

function resetForm() {
    const form = document.getElementById('user-form');
    if (form) {
        form.reset();
        // Reset join date to today
        const joinDateInput = document.getElementById('join-date');
        if (joinDateInput) {
            joinDateInput.value = new Date().toISOString().split('T')[0];
        }
    }
}

// ==========================================
// CREATE USER VIA API
// ==========================================

async function createUser(userData) {
    try {
        const result = await API.users.create(userData);
        
        if (result.success) {
            console.log('✅ User created successfully:', result);
            return { success: true, data: result };
        } else {
            console.error('❌ Failed to create user:', result.message);
            return { success: false, message: result.message };
        }
    } catch (error) {
        console.error('❌ Error creating user:', error);
        return { success: false, message: error.message };
    }
}

// ==========================================
// FORM SUBMIT HANDLER
// ==========================================

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn?.textContent;
    
    try {
        // Disable submit button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Memproses...';
        }
        
        // Get form data
        const name = document.getElementById('name')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value || 'password123';
        const primaryRole = document.getElementById('role')?.value;
        const secondaryRole = document.getElementById('secondary-role')?.value || 'None';
        const jabatan = document.getElementById('jabatan')?.value.trim();
        const vehicleType = document.getElementById('vehicle-type')?.value;
        const phone = document.getElementById('phone')?.value.trim();
        const joinDate = document.getElementById('join-date')?.value;
        
        // Validation
        if (!name) {
            showErrorMessage('Nama wajib diisi!');
            return;
        }
        
        if (!jabatan) {
            showErrorMessage('Jabatan wajib diisi!');
            return;
        }
        
        if (!primaryRole) {
            showErrorMessage('Role wajib dipilih!');
            return;
        }
        
        if (!vehicleType) {
            showErrorMessage('Tipe kendaraan wajib dipilih!');
            return;
        }
        
        if (!joinDate) {
            showErrorMessage('Tanggal bergabung wajib diisi!');
            return;
        }
        
        // Email validation (if provided)
        if (email && !isValidEmail(email)) {
            showErrorMessage('Format email tidak valid!');
            return;
        }
        
        // Prepare user data
        const userData = {
            name,
            email: email || null,
            password,
            primary_role: primaryRole,
            secondary_role: secondaryRole,
            jabatan,
            vehicle_type: vehicleType,
            phone: phone || null,
            join_date: joinDate,
            status: 'Aktif'
        };
        
        console.log('📤 Submitting user data:', { ...userData, password: '***' });
        
        // Create user via API
        const result = await createUser(userData);
        
        if (result.success) {
            showSuccessMessage(`✅ ${name} berhasil ditambahkan!`);
            resetForm();
            
            // Redirect to role page after 2 seconds
            setTimeout(() => {
                const roleMenuItem = document.querySelector('[data-page="change-role"]');
                if (roleMenuItem) {
                    roleMenuItem.click();
                }
            }, 2000);
        } else {
            showErrorMessage(result.message || 'Gagal menambahkan user');
        }
        
    } catch (error) {
        console.error('❌ Form submit error:', error);
        showErrorMessage(error.message || 'Terjadi kesalahan');
    } finally {
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }
}

// ==========================================
// VALIDATION HELPERS
// ==========================================

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ==========================================
// SET DEFAULT VALUES
// ==========================================

function setDefaultValues() {
    // Set today as default join date
    const joinDateInput = document.getElementById('join-date');
    if (joinDateInput && !joinDateInput.value) {
        joinDateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Set default password placeholder
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.placeholder = 'Kosongkan untuk password default (password123)';
    }
}

// ==========================================
// INITIALIZATION
// ==========================================

function initializeAddUserPage() {
    const form = document.getElementById('user-form');
    
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        console.log('✅ Add User form event listener attached');
    }
    
    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetForm);
        console.log('✅ Reset button event listener attached');
    }
    
    // Set default values
    setDefaultValues();
    
    console.log('✅ Add User page initialized (Production Mode)');
    console.log('ℹ️  Default password: password123');
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAddUserPage);
} else {
    initializeAddUserPage();
}
