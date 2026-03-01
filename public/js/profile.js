/**
 * Profile Page - Production Ready
 * Trans Indopride Fleet Management
 * Loads user profile and duty history from database
 */

let userProfile = {};
let dutyHistory = [];

function formatIDP(amount) {
    return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
}

// ==========================================
// LOAD PROFILE FROM API
// ==========================================

async function loadProfileFromAPI() {
    try {
        console.log('📡 Loading profile from database...');
        
        const result = await API.auth.me();
        
        if (result.success && result.user) {
            userProfile = result.user;
            localStorage.setItem('user', JSON.stringify(userProfile));
            renderProfileInfo();
            console.log('✅ Profile loaded successfully');
            
            // Load duty history after profile
            await loadDutyHistoryFromAPI();
        } else {
            console.error('❌ Failed to load profile');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        
        // Fallback to localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            userProfile = JSON.parse(savedUser);
            renderProfileInfo();
        } else {
            window.location.href = 'login.html';
        }
    }
}

// ==========================================
// LOAD DUTY HISTORY FROM API
// ==========================================

async function loadDutyHistoryFromAPI() {
    try {
        if (!userProfile.id) {
            console.error('❌ User ID not found');
            return;
        }
        
        console.log('📡 Loading duty history from database...');
        
        const result = await API.duties.getAll(`?user_id=${userProfile.id}&limit=100&order=desc`);
        
        if (result.success && result.data) {
            dutyHistory = result.data;
            renderDutyHistory();
            renderDutyStats();
            console.log(`✅ Loaded ${dutyHistory.length} duty records`);
        } else {
            dutyHistory = [];
            renderDutyHistory();
            renderDutyStats();
            console.log('ℹ️ No duty history found');
        }
    } catch (error) {
        console.error('❌ Error loading duty history:', error);
        dutyHistory = [];
        renderDutyHistory();
        renderDutyStats();
    }
}

// ==========================================
// RENDER PROFILE INFO
// ==========================================

function renderProfileInfo() {
    // Profile photo - Simple avatar with initials
    const photoEl = document.getElementById('profile-photo');
    if (photoEl) {
        const initials = (userProfile.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        photoEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || 'User')}&size=200&background=3498db&color=fff&bold=true&rounded=true`;
        photoEl.alt = initials;
    }
    
    // Name
    const nameEl = document.getElementById('profile-name');
    if (nameEl) nameEl.textContent = userProfile.name || '-';
    
    // Role badge
    const jabatanBadge = document.querySelector('.badge-jabatan');
    if (jabatanBadge) {
        jabatanBadge.innerHTML = `<i class="fas fa-star"></i> ${userProfile.primary_role || '-'}`;
    }
    
    // Status badge
    const statusBadge = document.querySelector('.badge-status');
    if (statusBadge) {
        const statusColor = userProfile.status === 'Aktif' ? 'green' : 'gray';
        statusBadge.innerHTML = `<i class="fas fa-circle" style="color: ${statusColor}"></i> ${userProfile.status || 'Aktif'}`;
    }
    
    // Email
    const emailEl = document.getElementById('profile-email');
    if (emailEl) emailEl.textContent = userProfile.email || '-';
    
    // Phone
    const phoneEl = document.getElementById('profile-phone');
    if (phoneEl) phoneEl.textContent = userProfile.phone || '-';
    
    // Jabatan
    const jabatanEl = document.getElementById('profile-jabatan');
    if (jabatanEl) jabatanEl.textContent = userProfile.jabatan || '-';
    
    // Vehicle Type
    const vehicleEl = document.getElementById('profile-vehicle');
    if (vehicleEl) vehicleEl.textContent = userProfile.vehicle_type || '-';
    
    // Join Date
    const joinEl = document.getElementById('profile-join');
    if (joinEl && userProfile.join_date) {
        joinEl.textContent = new Date(userProfile.join_date).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    }
    
    // Secondary Role
    const secondaryRoleEl = document.getElementById('profile-secondary-role');
    if (secondaryRoleEl) {
        secondaryRoleEl.textContent = userProfile.secondary_role && userProfile.secondary_role !== 'None' 
            ? userProfile.secondary_role 
            : '-';
    }
    
    // Render Duty Status & Off Duty Button
    renderDutyStatus();
}

// ==========================================
// RENDER DUTY STATUS & OFF DUTY BUTTON
// ==========================================

function renderDutyStatus() {
    const dutyStatusContainer = document.getElementById('duty-status-container');
    if (!dutyStatusContainer) return;
    
    const dutyStatus = userProfile.duty_status || 'Off Duty';
    const isOnDutyOrStandby = dutyStatus === 'On Duty' || dutyStatus === 'Standby';
    
    let statusIcon = '';
    let statusColor = '';
    let statusText = '';
    
    if (dutyStatus === 'On Duty') {
        statusIcon = 'fa-briefcase';
        statusColor = '#22c55e'; // Green
        statusText = 'Sedang On Duty';
    } else if (dutyStatus === 'Standby') {
        statusIcon = 'fa-pause-circle';
        statusColor = '#3b82f6'; // Blue
        statusText = 'Standby';
    } else {
        statusIcon = 'fa-home';
        statusColor = '#9ca3af'; // Gray
        statusText = 'Off Duty';
    }
    
    dutyStatusContainer.innerHTML = `
        <div class="duty-status-card">
            <div class="duty-status-header">
                <i class="fas ${statusIcon}" style="color: ${statusColor}; font-size: 24px;"></i>
                <div class="duty-status-info">
                    <div class="duty-status-label">Status Duty</div>
                    <div class="duty-status-value" style="color: ${statusColor};">
                        <strong>${statusText}</strong>
                    </div>
                </div>
            </div>
            
            ${isOnDutyOrStandby ? `
                <button class="btn-off-duty" onclick="handleOffDutyClick()">
                    <i class="fas fa-power-off"></i> Off Duty Sekarang
                </button>
            ` : `
                <div class="duty-info-message">
                    <i class="fas fa-info-circle"></i>
                    Anda sedang tidak dalam status duty
                </div>
            `}
        </div>
    `;
}

// ==========================================
// HANDLE OFF DUTY BUTTON CLICK
// ==========================================

async function handleOffDutyClick() {
    if (!confirm('Yakin ingin Off Duty sekarang?')) {
        return;
    }
    
    try {
        console.log('🔴 Off Duty request...');
        
        const offDutyBtn = document.querySelector('.btn-off-duty');
        if (offDutyBtn) {
            offDutyBtn.disabled = true;
            offDutyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        }
        
        // Update duty_status via API
        const result = await API.users.update(userProfile.id, {
            duty_status: 'Off Duty'
        });
        
        if (result.success) {
            console.log('✅ Off Duty berhasil');
            
            // Update local data
            userProfile.duty_status = 'Off Duty';
            localStorage.setItem('user', JSON.stringify(userProfile));
            
            // Re-render duty status
            renderDutyStatus();
            
            alert('✅ Anda berhasil Off Duty!');
        } else {
            alert('❌ Gagal Off Duty: ' + result.message);
            
            // Re-enable button
            if (offDutyBtn) {
                offDutyBtn.disabled = false;
                offDutyBtn.innerHTML = '<i class="fas fa-power-off"></i> Off Duty Sekarang';
            }
        }
    } catch (error) {
        console.error('❌ Error off duty:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
        
        // Re-enable button
        const offDutyBtn = document.querySelector('.btn-off-duty');
        if (offDutyBtn) {
            offDutyBtn.disabled = false;
            offDutyBtn.innerHTML = '<i class="fas fa-power-off"></i> Off Duty Sekarang';
        }
    }
}

// ==========================================
// RENDER DUTY HISTORY
// ==========================================

function renderDutyHistory() {
    const historyContainer = document.getElementById('duty-history-list');
    if (!historyContainer) return;
    
    if (dutyHistory.length === 0) {
        historyContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #9ca3af;">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p>Belum ada riwayat duty</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    dutyHistory.forEach(duty => {
        const date = new Date(duty.duty_date).toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
        
        const hours = Math.floor(duty.duration_minutes / 60);
        const minutes = duty.duration_minutes % 60;
        const duration = `${hours}j ${minutes}m`;
        
        html += `
            <div class="duty-history-item">
                <div class="duty-date">
                    <i class="fas fa-calendar"></i> ${date}
                </div>
                <div class="duty-details">
                    <span class="duty-type">
                        <i class="fas fa-${duty.duty_type === 'Motor' ? 'motorcycle' : 'car'}"></i>
                        ${duty.duty_type}
                    </span>
                    <span class="duty-time">
                        <i class="fas fa-clock"></i>
                        ${duty.start_time} - ${duty.end_time} (${duration})
                    </span>
                    <span class="duty-incentive">
                        <i class="fas fa-money-bill-wave"></i>
                        ${formatIDP(duty.total_incentive || 0)}
                    </span>
                </div>
                ${duty.notes ? `<div class="duty-notes">${duty.notes}</div>` : ''}
            </div>
        `;
    });
    
    historyContainer.innerHTML = html;
}

// ==========================================
// RENDER DUTY STATS
// ==========================================

function renderDutyStats() {
    // Calculate stats
    const totalDuties = dutyHistory.length;
    const totalHours = Math.round(dutyHistory.reduce((sum, d) => sum + (d.duration_minutes || 0), 0) / 60);
    const totalIncentive = dutyHistory.reduce((sum, d) => sum + (d.total_incentive || 0), 0);
    const totalPaid = dutyHistory
        .filter(d => d.incentive_paid)
        .reduce((sum, d) => sum + (d.total_incentive || 0), 0);
    
    // This month
    const now = new Date();
    const thisMonth = dutyHistory.filter(d => {
        const dutyDate = new Date(d.duty_date);
        return dutyDate.getMonth() === now.getMonth() && dutyDate.getFullYear() === now.getFullYear();
    });
    
    const monthDuties = thisMonth.length;
    const monthHours = Math.round(thisMonth.reduce((sum, d) => sum + (d.duration_minutes || 0), 0) / 60);
    const monthIncentive = thisMonth.reduce((sum, d) => sum + (d.total_incentive || 0), 0);
    
    // Render stats
    const statsContainer = document.getElementById('duty-stats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-briefcase"></i></div>
                <div class="stat-info">
                    <div class="stat-value">${totalDuties}</div>
                    <div class="stat-label">Total Duty</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-clock"></i></div>
                <div class="stat-info">
                    <div class="stat-value">${totalHours} Jam</div>
                    <div class="stat-label">Total Waktu</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
                <div class="stat-info">
                    <div class="stat-value">${formatIDP(totalIncentive)}</div>
                    <div class="stat-label">Total Insentif</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                <div class="stat-info">
                    <div class="stat-value">${formatIDP(totalPaid)}</div>
                    <div class="stat-label">Sudah Dibayar</div>
                </div>
            </div>
        `;
    }
    
    // Monthly stats
    const monthStatsEl = document.getElementById('month-stats');
    if (monthStatsEl) {
        monthStatsEl.innerHTML = `
            <h4>Bulan Ini</h4>
            <p>${monthDuties} duty • ${monthHours} jam • ${formatIDP(monthIncentive)}</p>
        `;
    }
}

// ==========================================
// INITIALIZATION
// ==========================================

async function initializeProfilePage() {
    await loadProfileFromAPI();
    console.log('✅ Profile page initialized (Production Mode - No Photo Upload)');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProfilePage);
} else {
    initializeProfilePage();
}

// Expose functions
window.loadProfileFromAPI = loadProfileFromAPI;
window.loadDutyHistoryFromAPI = loadDutyHistoryFromAPI;
window.handleOffDutyClick = handleOffDutyClick;
