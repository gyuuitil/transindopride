/**
 * Change Role Page - Production Ready
 * Trans Indopride Fleet Management
 * Loads users from API and updates roles
 */

let armadaData = [];
let filteredData = [];

// ==========================================
// LOAD USERS FROM API
// ==========================================

async function loadArmadaFromAPI() {
    try {
        console.log('📡 Loading users from database...');
        
        const result = await API.users.getAll('?limit=1000');
        
        if (result.success && result.data) {
            armadaData = result.data.map(user => ({
                id: user.id,
                nama: user.name,
                email: user.email,
                role: user.primary_role,
                secondaryRole: user.secondary_role || 'None',
                jabatan: user.jabatan,
                vehicleType: user.vehicle_type,
                status: user.status
            }));
            
            filteredData = [...armadaData];
            renderArmadaTable();
            console.log(`✅ Loaded ${armadaData.length} users from database`);
        } else {
            armadaData = [];
            filteredData = [];
            renderArmadaTable();
            console.log('ℹ️ No users found');
        }
    } catch (error) {
        console.error('❌ Error loading users:', error);
        armadaData = [];
        filteredData = [];
        renderArmadaTable();
    }
}

// ==========================================
// RENDER TABLE
// ==========================================

function renderArmadaTable() {
    const tbody = document.getElementById('armada-table-body');
    if (!tbody) return;
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #9ca3af;">
                    <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    <p>Tidak ada data armada</p>
                </td>
            </tr>
        `;
        updateTotalCount(0);
        return;
    }
    
    let html = '';
    
    filteredData.forEach((user, index) => {
        const statusBadge = user.status === 'Aktif' 
            ? '<span class="badge badge-success">Aktif</span>'
            : '<span class="badge badge-secondary">Non-Aktif</span>';
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="user-name-cell">
                        <strong>${user.nama}</strong>
                        ${user.email ? `<small>${user.email}</small>` : ''}
                    </div>
                </td>
                <td>
                    <span class="role-badge role-${user.role.toLowerCase()}">${user.role}</span>
                </td>
                <td>
                    <span class="secondary-role-badge">${user.secondaryRole}</span>
                </td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-edit-role" onclick="openEditRoleModal(${user.id})">
                        <i class="fas fa-edit"></i> Ubah Role
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    updateTotalCount(filteredData.length);
}

function updateTotalCount(count) {
    const totalEl = document.getElementById('total-armada');
    if (totalEl) {
        totalEl.textContent = `Total: ${count} armada`;
    }
}

// ==========================================
// FILTER & SEARCH
// ==========================================

function filterByRole(role) {
    if (role === 'all') {
        filteredData = [...armadaData];
    } else {
        filteredData = armadaData.filter(user => user.role === role);
    }
    renderArmadaTable();
}

function filterByStatus(status) {
    if (status === 'all') {
        filteredData = [...armadaData];
    } else {
        filteredData = armadaData.filter(user => user.status === status);
    }
    renderArmadaTable();
}

function searchArmada(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredData = [...armadaData];
    } else {
        filteredData = armadaData.filter(user => 
            user.nama.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm) ||
            user.jabatan?.toLowerCase().includes(searchTerm)
        );
    }
    
    renderArmadaTable();
}

// ==========================================
// EDIT ROLE MODAL
// ==========================================

function openEditRoleModal(userId) {
    const user = armadaData.find(u => u.id === userId);
    if (!user) {
        alert('❌ User tidak ditemukan!');
        return;
    }
    
    const modal = document.getElementById('edit-role-modal');
    const modalContent = document.getElementById('modal-content');
    
    if (!modal || !modalContent) return;
    
    modalContent.innerHTML = `
        <h3>Ubah Role</h3>
        <div class="user-info">
            <strong>${user.nama}</strong>
            ${user.email ? `<small>${user.email}</small>` : ''}
        </div>
        
        <form id="edit-role-form" onsubmit="return false;">
            <div class="form-group">
                <label>Primary Role <span style="color: red;">*</span></label>
                <select id="edit-primary-role" required>
                    <option value="Boss" ${user.role === 'Boss' ? 'selected' : ''}>Boss</option>
                    <option value="Eksekutif" ${user.role === 'Eksekutif' ? 'selected' : ''}>Eksekutif</option>
                    <option value="Bisnis" ${user.role === 'Bisnis' ? 'selected' : ''}>Bisnis</option>
                    <option value="Premium" ${user.role === 'Premium' ? 'selected' : ''}>Premium</option>
                    <option value="Ekonomi" ${user.role === 'Ekonomi' ? 'selected' : ''}>Ekonomi</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Secondary Role</label>
                <select id="edit-secondary-role">
                    <option value="None" ${user.secondaryRole === 'None' ? 'selected' : ''}>None</option>
                    <option value="HRD" ${user.secondaryRole === 'HRD' ? 'selected' : ''}>HRD</option>
                    <option value="FINANCE" ${user.secondaryRole === 'FINANCE' ? 'selected' : ''}>FINANCE</option>
                    <option value="OPS" ${user.secondaryRole === 'OPS' ? 'selected' : ''}>OPS</option>
                </select>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn-cancel" onclick="closeEditRoleModal()">Batal</button>
                <button type="button" class="btn-save" onclick="saveRoleChange(${userId})">
                    <i class="fas fa-save"></i> Simpan
                </button>
            </div>
        </form>
    `;
    
    modal.style.display = 'flex';
}

function closeEditRoleModal() {
    const modal = document.getElementById('edit-role-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function saveRoleChange(userId) {
    const primaryRole = document.getElementById('edit-primary-role')?.value;
    const secondaryRole = document.getElementById('edit-secondary-role')?.value || 'None';
    
    if (!primaryRole) {
        alert('❌ Primary role wajib dipilih!');
        return;
    }
    
    const saveBtn = document.querySelector('.btn-save');
    const originalText = saveBtn?.textContent;
    
    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        }
        
        console.log(`📤 Updating role for user ${userId}:`, { primaryRole, secondaryRole });
        
        const result = await API.users.updateRole(userId, {
            primary_role: primaryRole,
            secondary_role: secondaryRole
        });
        
        if (result.success) {
            console.log('✅ Role updated successfully');
            alert('✅ Role berhasil diubah!');
            closeEditRoleModal();
            
            // Reload data
            await loadArmadaFromAPI();
        } else {
            alert('❌ Gagal mengubah role: ' + result.message);
        }
        
    } catch (error) {
        console.error('❌ Error updating role:', error);
        alert('❌ Terjadi kesalahan: ' + error.message);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }
}

// ==========================================
// INITIALIZATION
// ==========================================

function initializeRolePage() {
    // Load users from API
    loadArmadaFromAPI();
    
    // Search input
    const searchInput = document.getElementById('search-armada');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchArmada(e.target.value);
        });
    }
    
    // Role filter
    const roleFilter = document.getElementById('filter-role');
    if (roleFilter) {
        roleFilter.addEventListener('change', (e) => {
            filterByRole(e.target.value);
        });
    }
    
    // Status filter
    const statusFilter = document.getElementById('filter-status');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            filterByStatus(e.target.value);
        });
    }
    
    // Close modal on outside click
    const modal = document.getElementById('edit-role-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEditRoleModal();
            }
        });
    }
    
    console.log('✅ Change Role page initialized (Production Mode)');
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRolePage);
} else {
    initializeRolePage();
}

// Expose functions globally
window.openEditRoleModal = openEditRoleModal;
window.closeEditRoleModal = closeEditRoleModal;
window.saveRoleChange = saveRoleChange;
window.filterByRole = filterByRole;
window.filterByStatus = filterByStatus;
window.searchArmada = searchArmada;
window.loadArmadaFromAPI = loadArmadaFromAPI;
