const express = require('express');
const { pool } = require('../config/database');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
router.use(protect);

function calculateIncentive(primaryRole, durationMinutes) {
    const effectiveMinutes = Math.min(durationMinutes, 540);
    const rates = { 'Boss': 35000, 'Eksekutif': 35000, 'Bisnis': 25000, 'Premium': 20000, 'Ekonomi': 15000 };
    return Math.round((effectiveMinutes / 60) * (rates[primaryRole] || 15000));
}

router.get('/', asyncHandler(async (req, res) => {
    const { user_id, limit = 100 } = req.query;
    let query = 'SELECT dh.*, u.name as user_name, u.primary_role FROM duty_history dh LEFT JOIN users u ON dh.user_id = u.id WHERE 1=1';
    const params = [];
    if (user_id) { query += ' AND dh.user_id = ?'; params.push(user_id); }
    query += ' ORDER BY dh.duty_date DESC LIMIT ?';
    params.push(parseInt(limit));
    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
}));

router.post('/', asyncHandler(async (req, res) => {
    const { user_id, duty_date, duty_type, start_time = '08:00', end_time = '17:00' } = req.body;
    const [sh, sm] = start_time.split(':').map(Number);
    const [eh, em] = end_time.split(':').map(Number);
    const duration_minutes = (eh * 60 + em) - (sh * 60 + sm);
    const [userRows] = await pool.execute('SELECT primary_role FROM users WHERE id = ?', [user_id || req.user.id]);
    const primaryRole = userRows[0]?.primary_role || 'Ekonomi';
    const base_incentive = calculateIncentive(primaryRole, duration_minutes);
    const [result] = await pool.execute(
        'INSERT INTO duty_history (user_id, duty_date, duty_type, start_time, end_time, duration_minutes, base_incentive, total_incentive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user_id || req.user.id, duty_date, duty_type, start_time, end_time, duration_minutes, base_incentive, base_incentive]
    );
    res.status(201).json({ success: true, message: 'Duty berhasil dicatat', id: result.insertId });
}));

router.patch('/:id/incentive-paid', asyncHandler(async (req, res) => {
    await pool.execute('UPDATE duty_history SET incentive_paid = TRUE WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Insentif ditandai sudah dibayar' });
}));

router.patch('/:id/bonus-paid', asyncHandler(async (req, res) => {
    await pool.execute('UPDATE duty_history SET bonus_paid = TRUE WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Bonus ditandai sudah dibayar' });
}));

module.exports = router;
