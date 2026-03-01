/**
 * Home Page - Production Ready
 * Trans Indopride Fleet Management
 * Loads all data from database API
 */

const HOME_DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1472820662312894515/znfgVZjyraYcXHy_HkuvcF4dJaa6wzaNQ3hk4HdySbV8Am2TclaT1kAKjJG0KxBszUZ1";

// Active drivers loaded from database
let activeDrivers = {
    motor: [],
    mobil: [],
    standby: []
};

let activeVehicleStatus = null;
let lastActiveCategory = null;

// ==========================================
// DATE & TIME
// ==========================================

function updateDateTime() {
    const now = new Date();
    
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = days[now.getDay()];
    
    const date = now.getDate();
    
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthName = months[now.getMonth()];
    
    const year = now.getFullYear();
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const dateElement = document.getElementById('current-date');
    const timeElement = document.getElementById('current-time');
    
    if (dateElement) {
        dateElement.textContent = `${dayName}, ${date} ${monthName} ${year}`;
    }
    
    if (timeElement) {
        timeElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

// ==========================================
// LOAD DRIVERS FROM API
// ==========================================

async function loadDriversFromAPI() {
    try {
        console.log('📡 Loading drivers from database...');
        
        const result = await API.users.getAll('?status=Aktif');
        
        if (!result.success || !result.data) {
            console.error('❌ Failed to load drivers from API');
            clearAllDrivers();
            return;
        }

        const drivers = result.data;
        console.log(`✅ Loaded ${drivers.length} active drivers from database`);
        
        // Clear existing
        clearAllDrivers();

        // Group by duty_status and vehicle_type
        drivers.forEach(driver => {
            const rolePrefix = `[${driver.primary_role.toUpperCase()}]`;
            const driverName = `${rolePrefix} ${driver.name}`;
            
            // Determine category based on duty_status and vehicle_type
            if (driver.duty_status === 'On Duty') {
                if (driver.vehicle_type === 'Motor' || driver.vehicle_type === 'Both') {
                    activeDrivers.motor.push(driverName);
                } else if (driver.vehicle_type === 'Mobil') {
                    activeDrivers.mobil.push(driverName);
                }
            } else if (driver.duty_status === 'Standby') {
                activeDrivers.standby.push(driverName);
            }
            // Off Duty drivers are not shown
        });

        renderStatusTable();
        console.log('✅ Driver table rendered');
        
    } catch (error) {
        console.error('❌ Error loading drivers:', error);
        clearAllDrivers();
    }
}

// ==========================================
// UPDATE DUTY STATUS VIA API
// ==========================================

async function updateDutyStatus(userId, newStatus) {
    try {
        await API.users.update(userId, { duty_status: newStatus });
        console.log(`✅ User ${userId} duty_status updated to ${newStatus}`);
    } catch (error) {
        console.error('❌ Failed to update duty status:', error);
    }
}

// ==========================================
// CHECK USER ROLE (Admin/Pengurus)
// ==========================================

function isAdminOrPengurus() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.primary_role === 'Boss' || 
        user.secondary_role === 'HRD' || 
        user.secondary_role === 'OPS' || 
        user.secondary_role === 'FINANCE';
}

// ==========================================
// RENDER TABLE
// ==========================================

function renderStatusTable() {
    const tbody = document.getElementById('status-table-body');
    if (!tbody) return;
    
    const showForceOffDuty = isAdminOrPengurus();
    
    const maxRows = Math.max(
        activeDrivers.motor.length,
        activeDrivers.mobil.length,
        activeDrivers.standby.length,
        1
    );
    
    let html = '';
    
    for (let i = 0; i < maxRows; i++) {
        html += '<tr>';
        
        // Motor column
        const motorDriver = activeDrivers.motor[i] || '';
        if (motorDriver && showForceOffDuty) {
            const driverName = motorDriver.replace(/\[.*?\]\s*/, ''); // Remove role prefix
            html += `<td class="status-cell driver-cell">
                ${motorDriver}
                <button class="btn-force-off-duty" onclick="forceOffDuty('${driverName}', 'motor', ${i})" title="Force Off Duty">
                    <i class="fas fa-times-circle"></i>
                </button>
            </td>`;
        } else {
            html += `<td class="status-cell ${motorDriver ? '' : 'empty-cell'}">${motorDriver}</td>`;
        }
        
        // Mobil column
        const mobilDriver = activeDrivers.mobil[i] || '';
        if (mobilDriver && showForceOffDuty) {
            const driverName = mobilDriver.replace(/\[.*?\]\s*/, '');
            html += `<td class="status-cell driver-cell">
                ${mobilDriver}
                <button class="btn-force-off-duty" onclick="forceOffDuty('${driverName}', 'mobil', ${i})" title="Force Off Duty">
                    <i class="fas fa-times-circle"></i>
                </button>
            </td>`;
        } else {
            html += `<td class="status-cell ${mobilDriver ? '' : 'empty-cell'}">${mobilDriver}</td>`;
        }
        
        // Standby column
        const standbyDriver = activeDrivers.standby[i] || '';
        if (standbyDriver && showForceOffDuty) {
            const driverName = standbyDriver.replace(/\[.*?\]\s*/, '');
            html += `<td class="status-cell driver-cell">
                ${standbyDriver}
                <button class="btn-force-off-duty" onclick="forceOffDuty('${driverName}', 'standby', ${i})" title="Force Off Duty">
                    <i class="fas fa-times-circle"></i>
                </button>
            </td>`;
        } else {
            html += `<td class="status-cell ${standbyDriver ? '' : 'empty-cell'}">${standbyDriver}</td>`;
        }
        
        html += '</tr>';
    }
    
    tbody.innerHTML = html;
    
    updateTotalCounts();
    renderForceOffDutyAllButton();
}

// ==========================================
// RENDER FORCE OFF DUTY ALL BUTTON
// ==========================================

function renderForceOffDutyAllButton() {
    const container = document.getElementById('force-off-duty-all-container');
    if (!container) return;
    
    const showButton = isAdminOrPengurus();
    const totalOnDuty = activeDrivers.motor.length + activeDrivers.mobil.length + activeDrivers.standby.length;
    
    if (showButton && totalOnDuty > 0) {
        container.innerHTML = `
            <button class="btn-force-off-duty-all" onclick="forceOffDutyAll()">
                <i class="fas fa-power-off"></i> Force Off Duty All (${totalOnDuty} driver)
            </button>
        `;
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

function updateTotalCounts() {
    const totalMotor = document.getElementById('total-motor');
    const totalMobil = document.getElementById('total-mobil');
    const totalStandby = document.getElementById('total-standby');
    
    if (totalMotor) totalMotor.textContent = `Total Motor: ${activeDrivers.motor.length}`;
    if (totalMobil) totalMobil.textContent = `Total Mobil: ${activeDrivers.mobil.length}`;
    if (totalStandby) totalStandby.textContent = `Total Standby: ${activeDrivers.standby.length}`;
}

// ==========================================
// FORCE OFF DUTY FUNCTIONS (Admin/Pengurus)
// ==========================================

async function forceOffDuty(driverName, category, index) {
    if (!confirm(`Force Off Duty untuk ${driverName}?`)) {
        return;
    }
    
    try {
        console.log(`🔴 Force Off Duty: ${driverName} from ${category}`);
        
        // Find user by name
        const result = await API.users.getAll(`?limit=1000`);
        
        if (result.success && result.data) {
            const user = result.data.find(u => u.name === driverName);
            
            if (user) {
                // Update duty_status to Off Duty
                await API.users.update(user.id, { duty_status: 'Off Duty' });
                
                // Remove from local array
                activeDrivers[category].splice(index, 1);
                renderStatusTable();
                
                console.log(`✅ ${driverName} berhasil di-off duty-kan`);
                showNotification(`✅ ${driverName} berhasil Off Duty`, 'success');
                
                // Send to Discord
                setTimeout(() => sendTableScreenshotToDiscord('force-off-duty'), 500);
            } else {
                alert('❌ User tidak ditemukan di database');
            }
        }
    } catch (error) {
        console.error('❌ Error force off duty:', error);
        alert('❌ Gagal: ' + error.message);
    }
}

async function forceOffDutyAll() {
    const totalDrivers = activeDrivers.motor.length + activeDrivers.mobil.length + activeDrivers.standby.length;
    
    if (!confirm(`Force Off Duty untuk SEMUA ${totalDrivers} driver?\n\nSemua driver yang sedang On Duty/Standby akan di-off duty-kan.`)) {
        return;
    }
    
    try {
        console.log(`🔴 Force Off Duty All: ${totalDrivers} drivers`);
        
        // Get all drivers
        const allDriverNames = [
            ...activeDrivers.motor.map(d => d.replace(/\[.*?\]\s*/, '')),
            ...activeDrivers.mobil.map(d => d.replace(/\[.*?\]\s*/, '')),
            ...activeDrivers.standby.map(d => d.replace(/\[.*?\]\s*/, ''))
        ];
        
        // Get all users
        const result = await API.users.getAll(`?limit=1000`);
        
        if (result.success && result.data) {
            let successCount = 0;
            
            for (const driverName of allDriverNames) {
                const user = result.data.find(u => u.name === driverName);
                
                if (user) {
                    try {
                        await API.users.update(user.id, { duty_status: 'Off Duty' });
                        successCount++;
                    } catch (error) {
                        console.error(`❌ Failed to off duty ${driverName}:`, error);
                    }
                }
            }
            
            // Clear all local arrays
            activeDrivers.motor = [];
            activeDrivers.mobil = [];
            activeDrivers.standby = [];
            
            renderStatusTable();
            
            console.log(`✅ ${successCount}/${totalDrivers} driver berhasil di-off duty-kan`);
            alert(`✅ ${successCount} dari ${totalDrivers} driver berhasil Off Duty`);
            
            // Send to Discord
            setTimeout(() => sendTableScreenshotToDiscord('force-off-duty-all'), 500);
        }
    } catch (error) {
        console.error('❌ Error force off duty all:', error);
        alert('❌ Gagal: ' + error.message);
    }
}

// ==========================================
// DISCORD WEBHOOK
// ==========================================

function showNotification(message, type) {
    const color = type === 'success' ? '✅' : type === 'error' ? '❌' : '🔸';
    console.log(`${color} ${message}`);
}

async function sendTableScreenshotToDiscord(status) {
    let wrapper = null;
    let retryCount = 0;
    const MAX_RETRIES = 2;
    
    try {
        const tableElement = document.querySelector('.status-info-table');
        
        if (!tableElement) {
            console.error('❌ Tabel tidak ditemukan');
            showNotification('Tabel tidak ditemukan', 'error');
            return;
        }

        showNotification('📸 Mengambil screenshot...', 'info');

        // Calculate optimal dimensions
        const tableRect = tableElement.getBoundingClientRect();
        const tableWidth = Math.max(
            tableElement.scrollWidth,
            tableElement.offsetWidth,
            tableRect.width,
            900 // Minimum width
        );
        const tableHeight = Math.max(
            tableElement.scrollHeight,
            tableElement.offsetHeight,
            tableRect.height
        );

        console.log(`📐 Table dimensions: ${tableWidth}x${tableHeight}`);

        // Deep clone
        const cloneElement = tableElement.cloneNode(true);

        // Create wrapper with calculated dimensions
        wrapper = document.createElement('div');
        wrapper.style.cssText = `
            position: fixed;
            left: -99999px;
            top: -99999px;
            width: ${tableWidth}px;
            height: auto;
            min-height: ${tableHeight}px;
            background: white;
            padding: 24px;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: visible;
            z-index: 999999;
        `;

        // Copy computed styles
        const computedStyle = getComputedStyle(tableElement);
        wrapper.style.background = computedStyle.background || '#ffffff';
        wrapper.style.borderRadius = computedStyle.borderRadius || '12px';
        wrapper.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)';

        wrapper.appendChild(cloneElement);
        document.body.appendChild(wrapper);

        // Wait for render & layout
        await new Promise(resolve => setTimeout(resolve, 500));

        // Capture with html2canvas
        const canvas = await captureWithRetry();

        // Remove wrapper
        if (wrapper && wrapper.parentNode) {
            document.body.removeChild(wrapper);
            wrapper = null;
        }

        // Convert & send
        await sendToDiscord(canvas, status);

    } catch (error) {
        console.error('❌ Screenshot error:', error);
        showNotification('❌ Gagal capture: ' + error.message, 'error');
        
        // Cleanup
        if (wrapper && wrapper.parentNode) {
            document.body.removeChild(wrapper);
        }
    }

    // Helper: Capture with retry
    async function captureWithRetry() {
        while (retryCount <= MAX_RETRIES) {
            try {
                console.log(`📸 Capture attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
                
                const canvas = await html2canvas(wrapper, {
                    backgroundColor: '#ffffff',
                    scale: Math.min(window.devicePixelRatio || 2, 3), // Max scale 3
                    logging: false,
                    useCORS: true,
                    allowTaint: true,
                    removeContainer: false,
                    width: wrapper.scrollWidth,
                    height: wrapper.scrollHeight,
                    windowWidth: wrapper.scrollWidth,
                    windowHeight: wrapper.scrollHeight,
                    x: 0,
                    y: 0,
                    scrollX: 0,
                    scrollY: 0,
                    imageTimeout: 15000,
                    onclone: function(clonedDoc) {
                        // Ensure all styles are applied in cloned document
                        const clonedWrapper = clonedDoc.querySelector('div');
                        if (clonedWrapper) {
                            clonedWrapper.style.display = 'block';
                            clonedWrapper.style.visibility = 'visible';
                        }
                    }
                });

                console.log(`✅ Canvas created: ${canvas.width}x${canvas.height}`);
                return canvas;

            } catch (error) {
                retryCount++;
                console.error(`❌ Capture failed (attempt ${retryCount}):`, error);
                
                if (retryCount > MAX_RETRIES) {
                    throw new Error(`Capture failed after ${MAX_RETRIES + 1} attempts: ${error.message}`);
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    async function sendToDiscord(canvas, status) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    reject(new Error('Failed to create blob from canvas'));
                    return;
                }

                try {
                    const formData = new FormData();
                    const now = new Date();
                    
                    // Format waktu
                    const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });
                    const dateStr = now.toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    }).replace(/,/g, '');

                    // Status label
                    const statusLabel = {
                        'motor': '-',
                        'mobil': '-',
                        'standby': '-',
                        'off-duty': '-',
                        'force-off-duty': '-',
                        'force-off-duty-all': '-',
                        'auto': '-'
                    }[status] || '-';

                    // File name
                    const fileName = `Status_Armada_${dateStr.replace(/\s+/g, '_')}_${timeStr.replace(/:/g, '-')}.png`;

                    // Discord payload
                    const payload = {
                        username: "Trans Indopride - Status Armada"
                    };

                    formData.append('file', blob, fileName);
                    formData.append('payload_json', JSON.stringify(payload));

                    console.log('📤 Sending to Discord...');

                    const response = await fetch(HOME_DISCORD_WEBHOOK_URL, {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        console.log('✅ Screenshot sent to Discord');
                        showNotification('✅ Screenshot terkirim ke Discord!', 'success');
                        resolve();
                    } else {
                        const errorText = await response.text();
                        throw new Error(`Discord returned ${response.status}: ${errorText}`);
                    }

                } catch (error) {
                    console.error('❌ Discord send error:', error);
                    reject(error);
                }

            }, 'image/png', 0.95); // Quality 95%
        });
    }
}

// ==========================================
// VEHICLE STATUS BUTTONS
// ==========================================

function handleVehicleStatus(status) {
    const motorBtn = document.getElementById('btn-motor');
    const mobilBtn = document.getElementById('btn-mobil');
    const standbyBtn = document.getElementById('btn-standby');
    const offDutyBtn = document.getElementById('btn-off-duty');

    // Reset all buttons
    if (motorBtn) motorBtn.style.backgroundColor = '#22c55e';
    if (mobilBtn) mobilBtn.style.backgroundColor = '#22c55e';
    if (standbyBtn) standbyBtn.style.backgroundColor = '#1e40af';

    if (status === 'off-duty') {
        if (lastActiveCategory) {
            activeDrivers[lastActiveCategory] = [];
            renderStatusTable();
        }

        activeVehicleStatus = null;
        lastActiveCategory = null;

        if (offDutyBtn) offDutyBtn.style.display = 'none';

        setTimeout(() => {
            sendTableScreenshotToDiscord('off-duty');
        }, 500);
        return;
    }

    activeVehicleStatus = status;
    lastActiveCategory = status;

    if (status === 'motor' && motorBtn) {
        motorBtn.style.backgroundColor = '#6b7280';
    } else if (status === 'mobil' && mobilBtn) {
        mobilBtn.style.backgroundColor = '#6b7280';
    } else if (status === 'standby' && standbyBtn) {
        standbyBtn.style.backgroundColor = '#6b7280';
    }

    if (offDutyBtn) {
        offDutyBtn.style.display = 'block';
    }

    renderStatusTable();
    
    setTimeout(() => {
        sendTableScreenshotToDiscord(status);
    }, 500);
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function addDriver(driverName, role, category) {
    if (!activeDrivers[category]) {
        console.error('❌ Kategori tidak valid. Gunakan: motor, mobil, atau standby');
        return;
    }
    
    const formattedName = `[${role.toUpperCase()}] ${driverName}`;
    activeDrivers[category].push(formattedName);
    console.log(`✅ Driver ditambahkan: ${formattedName} ke kategori ${category}`);
    
    renderStatusTable();
    
    if (activeVehicleStatus === category) {
        setTimeout(() => sendTableScreenshotToDiscord(category), 500);
    }
}

function removeDriver(category, index) {
    if (!activeDrivers[category]) {
        console.error('❌ Kategori tidak valid');
        return;
    }
    
    if (index >= 0 && index < activeDrivers[category].length) {
        const removed = activeDrivers[category].splice(index, 1);
        console.log(`✅ Driver dihapus: ${removed[0]}`);
        
        renderStatusTable();
        
        if (activeVehicleStatus === category) {
            setTimeout(() => sendTableScreenshotToDiscord(category), 500);
        }
    } else {
        console.error('❌ Index tidak valid');
    }
}

function clearDrivers(category) {
    if (category) {
        if (!activeDrivers[category]) {
            console.error('❌ Kategori tidak valid');
            return;
        }
        activeDrivers[category] = [];
        console.log(`✅ Semua driver di kategori ${category} dihapus`);
    } else {
        // Clear all
        clearAllDrivers();
    }
    
    renderStatusTable();
    
    if (activeVehicleStatus === category) {
        setTimeout(() => sendTableScreenshotToDiscord(category), 500);
    }
}

function clearAllDrivers() {
    activeDrivers.motor = [];
    activeDrivers.mobil = [];
    activeDrivers.standby = [];
    renderStatusTable();
}

function showAllDrivers() {
    console.log('📊 STATUS DRIVER SAAT INI:');
    console.log('🏍️ MOTOR:', activeDrivers.motor);
    console.log('🚗 MOBIL:', activeDrivers.mobil);
    console.log('⏸️ STANDBY:', activeDrivers.standby);
    console.log(`📈 Total: ${activeDrivers.motor.length + activeDrivers.mobil.length + activeDrivers.standby.length} driver`);
}

// ==========================================
// AUTO REFRESH
// ==========================================

let autoUpdateInterval = null;

function startAutoUpdate() {
    if (autoUpdateInterval) {
        console.log('⚠️ Auto-update sudah berjalan');
        return;
    }
    
    autoUpdateInterval = setInterval(() => {
        console.log('🔄 Auto-updating drivers from database...');
        loadDriversFromAPI();
    }, 60000); // Every 60 seconds
    
    console.log('✅ Auto-update started (every 60 seconds)');
}

function stopAutoUpdate() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
        autoUpdateInterval = null;
        console.log('⏸️ Auto-update stopped');
    }
}

// ==========================================
// INITIALIZATION
// ==========================================

function initializeHomePage() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Load drivers from database
    loadDriversFromAPI();
    
    // Start auto-refresh
    startAutoUpdate();

    const motorBtn = document.getElementById('btn-motor');
    const mobilBtn = document.getElementById('btn-mobil');
    const standbyBtn = document.getElementById('btn-standby');
    const offDutyBtn = document.getElementById('btn-off-duty');
    
    if (motorBtn) {
        motorBtn.addEventListener('click', () => handleVehicleStatus('motor'));
    }
    
    if (mobilBtn) {
        mobilBtn.addEventListener('click', () => handleVehicleStatus('mobil'));
    }
    
    if (standbyBtn) {
        standbyBtn.addEventListener('click', () => handleVehicleStatus('standby'));
    }
    
    if (offDutyBtn) {
        offDutyBtn.addEventListener('click', () => handleVehicleStatus('off-duty'));
    }
    
    console.log('✅ Home page initialized (Production Mode)');
    console.log('💡 Helper functions:');
    console.log('   - loadDriversFromAPI() - Reload from database');
    console.log('   - showAllDrivers() - Show current status');
    console.log('   - startAutoUpdate() - Start auto-refresh');
    console.log('   - stopAutoUpdate() - Stop auto-refresh');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHomePage);
} else {
    initializeHomePage();
}

// Expose helper functions
window.loadDriversFromAPI = loadDriversFromAPI;
window.addDriver = addDriver;
window.removeDriver = removeDriver;
window.clearDrivers = clearDrivers;
window.showAllDrivers = showAllDrivers;
window.startAutoUpdate = startAutoUpdate;
window.stopAutoUpdate = stopAutoUpdate;
window.forceOffDuty = forceOffDuty;
window.forceOffDutyAll = forceOffDutyAll;
