const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { protect, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
    const { status, limit = 100 } = req.query;
    let query = 'SELECT id, name, email, primary_role, secondary_role, jabatan, vehicle_type, status, duty_status, join_date, phone FROM users WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY primary_role, name LIMIT ?';
    params.push(parseInt(limit));
    const [users] = await pool.execute(query, params);
    res.json({ success: true, data: users, total: users.length });
}));

router.post('/', requireRole('Boss', 'HRD'), asyncHandler(async (req, res) => {
    const { name, email, password = 'password123', primary_role = 'Ekonomi', secondary_role = 'None', jabatan, vehicle_type = 'Motor', phone, join_date, status = 'Aktif' } = req.body;
    if (!name || !jabatan) {
        return res.status(400).json({ success: false, message: 'Nama dan jabatan wajib diisi' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, primary_role, secondary_role, jabatan, vehicle_type, phone, join_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email || null, hashedPassword, primary_role, secondary_role, jabatan, vehicle_type, phone || null, join_date || new Date().toISOString().split('T')[0], status]
    );
    res.status(201).json({ success: true, message: 'User berhasil ditambahkan', id: result.insertId });
}));

router.put('/:id', asyncHandler(async (req, res) => {
    const { name, email, jabatan, vehicle_type, phone, status, duty_status, primary_role, secondary_role } = req.body;
    const fields = [], params = [];
    if (name) { fields.push('name = ?'); params.push(name); }
    if (email) { fields.push('email = ?'); params.push(email); }
    if (jabatan) { fields.push('jabatan = ?'); params.push(jabatan); }
    if (vehicle_type) { fields.push('vehicle_type = ?'); params.push(vehicle_type); }
    if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
    if (status) { fields.push('status = ?'); params.push(status); }
    if (duty_status) { fields.push('duty_status = ?'); params.push(duty_status); }
    if (primary_role) { fields.push('primary_role = ?'); params.push(primary_role); }
    if (secondary_role !== undefined) { fields.push('secondary_role = ?'); params.push(secondary_role); }
    if (fields.length === 0) return res.status(400).json({ success: false, message: 'Tidak ada data yang diupdate' });
    params.push(req.params.id);
    await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'User berhasil diupdate' });
}));

router.patch('/:id/role', requireRole('Boss', 'HRD'), asyncHandler(async (req, res) => {
    const { primary_role, secondary_role = 'None' } = req.body;
    if (!primary_role) return res.status(400).json({ success: false, message: 'primary_role wajib diisi' });
    await pool.execute('UPDATE users SET primary_role = ?, secondary_role = ? WHERE id = ?', [primary_role, secondary_role, req.params.id]);
    res.json({ success: true, message: 'Role berhasil diupdate' });
}));

module.exports = router;
