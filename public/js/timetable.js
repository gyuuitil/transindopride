/**
 * Timetable Page - Production Ready
 * Trans Indopride Fleet Management
 * Loads duty data from API with incentive/bonus payment tracking
 */

const TIMETABLE_INCENTIVE_WEBHOOK = "https://discord.com/api/webhooks/1456256379533660182/P96lscjTfZYaH8fZZCY7zzgH5JB0WhHSOYvZfbiCtUD2p28WeoDq3K6ZJp-JYEaR68hg";
const TIMETABLE_BONUS_WEBHOOK = "https://discord.com/api/webhooks/1466965568740524034/bgKE6383KJlED3z3RpPY7BqzHImbqGgedGkgY15krTnBDsWWJW72vfsQwC0Z2YS2B5ox";

let timetableData = [];
let filteredData = [];

function formatIDP(amount) {
    return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
}

// ==========================================
// LOAD TIMETABLE FROM API
// ==========================================

async function loadTimetableFromAPI() {
    try {
        console.log('📡 Loading timetable from database...');
        
        const result = await API.duties.getAll('?limit=500&order=desc');
        
        if (result.success && result.data) {
            timetableData = result.data.map(duty => ({
                id: duty.id,
                tanggal: duty.duty_date,
                nama: duty.user_name || 'Unknown',
                role: duty.primary_role || 'Ekonomi',
                jamMulai: duty.start_time?.substring(0, 5) || '08:00',
                jamSelesai: duty.end_time?.substring(0, 5) || '17:00',
                durasi: duty.duration_minutes || 0,
                insentif: duty.base_incentive || 0,
                bonus: duty.weekly_bonus || 0,
                totalInsentif: duty.total_incentive || 0,
                insentifDibayar: duty.incentive_paid || false,
                bonusDibayar: duty.bonus_paid || false,
                keterangan: duty.notes || '',
                dutyType: duty.duty_type || 'Motor'
            }));
            
            filteredData = [...timetableData];
            renderTimetable();
            updateStatistics();
            console.log(`✅ Loaded ${timetableData.length} duty records`);
        } else {
            timetableData = [];
            filteredData = [];
            renderTimetable();
            updateStatistics();
            console.log('ℹ️ No timetable data found');
        }
    } catch (error) {
        console.error('❌ Error loading timetable:', error);
        timetableData = [];
        filteredData = [];
        renderTimetable();
        updateStatistics();
    }
}

// ==========================================
// RENDER TIMETABLE
// ==========================================

function renderTimetable() {
    const tbody = document.getElementById('timetable-body');
    if (!tbody) return;
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; padding: 40px; color: #9ca3af;">
                    <i class="fas fa-calendar-times" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    <p>Tidak ada data timetable</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    filteredData.forEach((duty, index) => {
        const hours = Math.floor(duty.durasi / 60);
        const minutes = duty.durasi % 60;
        const durationStr = `${hours}j ${minutes}m`;
        
        const date = new Date(duty.tanggal).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${date}</td>
                <td>
                    <div class="user-cell">
                        <strong>${duty.nama}</strong>
                        <small class="role-badge-small">${duty.role}</small>
                    </div>
                </td>
                <td>
                    <span class="duty-type-badge duty-type-${duty.dutyType.toLowerCase()}">
                        <i class="fas fa-${duty.dutyType === 'Motor' ? 'motorcycle' : 'car'}"></i>
                        ${duty.dutyType}
                    </span>
                </td>
                <td>${duty.jamMulai}</td>
                <td>${duty.jamSelesai}</td>
                <td><strong>${durationStr}</strong></td>
                <td class="text-right">${formatIDP(duty.insentif)}</td>
                <td class="text-right">${duty.bonus > 0 ? formatIDP(duty.bonus) : '-'}</td>
                <td>
                    <input type="checkbox" 
                           class="checkbox-incentive" 
                           data-id="${duty.id}"
                           ${duty.insentifDibayar ? 'checked' : ''}
                           onchange="handleIncentiveCheck(${duty.id}, this.checked)">
                </td>
                <td>
                    <input type="checkbox" 
                           class="checkbox-bonus" 
                           data-id="${duty.id}"
                           ${duty.bonusDibayar ? 'checked' : ''}
                           ${duty.bonus === 0 ? 'disabled' : ''}
                           onchange="handleBonusCheck(${duty.id}, this.checked)">
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// ==========================================
// UPDATE STATISTICS
// ==========================================

function updateStatistics() {
    const totalDuties = filteredData.length;
    const totalInsentif = filteredData.reduce((sum, d) => sum + d.totalInsentif, 0);
    const totalBonus = filteredData.reduce((sum, d) => sum + d.bonus, 0);
    const paidInsentif = filteredData.filter(d => d.insentifDibayar).reduce((sum, d) => sum + d.insentif, 0);
    const paidBonus = filteredData.filter(d => d.bonusDibayar).reduce((sum, d) => sum + d.bonus, 0);
    const unpaidInsentif = filteredData.filter(d => !d.insentifDibayar).reduce((sum, d) => sum + d.insentif, 0);
    const unpaidBonus = filteredData.filter(d => !d.bonusDibayar && d.bonus > 0).reduce((sum, d) => sum + d.bonus, 0);
    
    // Update stats UI
    const statsContainer = document.getElementById('timetable-stats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Total Duty:</span>
                <span class="stat-value">${totalDuties}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Insentif:</span>
                <span class="stat-value">${formatIDP(totalInsentif)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Insentif Dibayar:</span>
                <span class="stat-value stat-success">${formatIDP(paidInsentif)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Belum Dibayar:</span>
                <span class="stat-value stat-warning">${formatIDP(unpaidInsentif)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Bonus:</span>
                <span class="stat-value">${formatIDP(totalBonus)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Bonus Dibayar:</span>
                <span class="stat-value stat-success">${formatIDP(paidBonus)}</span>
            </div>
        `;
    }
}

// ==========================================
// MARK INCENTIVE PAID
// ==========================================

async function handleIncentiveCheck(dutyId, isChecked) {
    try {
        console.log(`📤 Marking duty ${dutyId} incentive as ${isChecked ? 'paid' : 'unpaid'}...`);
        
        if (isChecked) {
            const result = await API.duties.markIncentivePaid(dutyId);
            
            if (result.success) {
                console.log('✅ Incentive marked as paid');
                
                // Update local data
                const duty = timetableData.find(d => d.id === dutyId);
                if (duty) {
                    duty.insentifDibayar = true;
                }
                
                updateStatistics();
                
                // Send to Discord
                await sendIncentiveNotification(duty);
            } else {
                alert('❌ Gagal menandai insentif: ' + result.message);
                // Revert checkbox
                const checkbox = document.querySelector(`input[data-id="${dutyId}"].checkbox-incentive`);
                if (checkbox) checkbox.checked = false;
            }
        } else {
            // User unchecked - you may want to handle this differently
            console.log('ℹ️ Incentive unmarked (feature not implemented)');
        }
        
    } catch (error) {
        console.error('❌ Error marking incentive:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
        
        // Revert checkbox
        const checkbox = document.querySelector(`input[data-id="${dutyId}"].checkbox-incentive`);
        if (checkbox) checkbox.checked = !isChecked;
    }
}

// ==========================================
// MARK BONUS PAID
// ==========================================

async function handleBonusCheck(dutyId, isChecked) {
    try {
        console.log(`📤 Marking duty ${dutyId} bonus as ${isChecked ? 'paid' : 'unpaid'}...`);
        
        if (isChecked) {
            const result = await API.duties.markBonusPaid(dutyId);
            
            if (result.success) {
                console.log('✅ Bonus marked as paid');
                
                // Update local data
                const duty = timetableData.find(d => d.id === dutyId);
                if (duty) {
                    duty.bonusDibayar = true;
                }
                
                updateStatistics();
                
                // Send to Discord
                await sendBonusNotification(duty);
            } else {
                alert('❌ Gagal menandai bonus: ' + result.message);
                // Revert checkbox
                const checkbox = document.querySelector(`input[data-id="${dutyId}"].checkbox-bonus`);
                if (checkbox) checkbox.checked = false;
            }
        } else {
            console.log('ℹ️ Bonus unmarked (feature not implemented)');
        }
        
    } catch (error) {
        console.error('❌ Error marking bonus:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
        
        // Revert checkbox
        const checkbox = document.querySelector(`input[data-id="${dutyId}"].checkbox-bonus`);
        if (checkbox) checkbox.checked = !isChecked;
    }
}

// ==========================================
// DISCORD NOTIFICATIONS
// ==========================================

async function sendIncentiveNotification(duty) {
    try {
        const message = {
            content: "",
            embeds: [{
                title: "✅ Insentif Dibayar",
                color: 0x22c55e,
                fields: [
                    { name: "Driver", value: duty.nama, inline: true },
                    { name: "Role", value: duty.role, inline: true },
                    { name: "Tanggal", value: new Date(duty.tanggal).toLocaleDateString('id-ID'), inline: true },
                    { name: "Jumlah Insentif", value: formatIDP(duty.insentif), inline: false }
                ],
                timestamp: new Date().toISOString()
            }]
        };
        
        await fetch(TIMETABLE_INCENTIVE_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        });
        
        console.log('✅ Incentive notification sent to Discord');
    } catch (error) {
        console.error('❌ Failed to send Discord notification:', error);
    }
}

async function sendBonusNotification(duty) {
    try {
        const message = {
            content: "",
            embeds: [{
                title: "🎁 Bonus Dibayar",
                color: 0x3b82f6,
                fields: [
                    { name: "Driver", value: duty.nama, inline: true },
                    { name: "Role", value: duty.role, inline: true },
                    { name: "Tanggal", value: new Date(duty.tanggal).toLocaleDateString('id-ID'), inline: true },
                    { name: "Jumlah Bonus", value: formatIDP(duty.bonus), inline: false }
                ],
                timestamp: new Date().toISOString()
            }]
        };
        
        await fetch(TIMETABLE_BONUS_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        });
        
        console.log('✅ Bonus notification sent to Discord');
    } catch (error) {
        console.error('❌ Failed to send Discord notification:', error);
    }
}

// ==========================================
// FILTER & SEARCH
// ==========================================

function filterByDateRange(startDate, endDate) {
    if (!startDate && !endDate) {
        filteredData = [...timetableData];
    } else {
        filteredData = timetableData.filter(duty => {
            const dutyDate = new Date(duty.tanggal);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            
            if (start && end) {
                return dutyDate >= start && dutyDate <= end;
            } else if (start) {
                return dutyDate >= start;
            } else if (end) {
                return dutyDate <= end;
            }
            return true;
        });
    }
    
    renderTimetable();
    updateStatistics();
}

function searchTimetable(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredData = [...timetableData];
    } else {
        filteredData = timetableData.filter(duty =>
            duty.nama.toLowerCase().includes(searchTerm) ||
            duty.role.toLowerCase().includes(searchTerm)
        );
    }
    
    renderTimetable();
    updateStatistics();
}

// ==========================================
// INITIALIZATION
// ==========================================

function initializeTimetablePage() {
    // Load timetable from API
    loadTimetableFromAPI();
    
    // Search input
    const searchInput = document.getElementById('search-timetable');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTimetable(e.target.value);
        });
    }
    
    // Date filters
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');
    
    if (startDateInput && endDateInput) {
        const applyFilter = () => {
            filterByDateRange(startDateInput.value, endDateInput.value);
        };
        
        startDateInput.addEventListener('change', applyFilter);
        endDateInput.addEventListener('change', applyFilter);
    }
    
    console.log('✅ Timetable page initialized (Production Mode)');
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTimetablePage);
} else {
    initializeTimetablePage();
}

// Expose functions globally
window.handleIncentiveCheck = handleIncentiveCheck;
window.handleBonusCheck = handleBonusCheck;
window.loadTimetableFromAPI = loadTimetableFromAPI;
window.searchTimetable = searchTimetable;
window.filterByDateRange = filterByDateRange;
