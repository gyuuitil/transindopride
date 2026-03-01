/**
 * Authentication Routes
 * Login, Logout, Get Current User
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'transindopride_secret_2024';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

/**
 * Generate JWT Token
 */
function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            primary_role: user.primary_role,
            secondary_role: user.secondary_role,
            name: user.name
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
}

/**
 * POST /api/auth/login
 * Login user & get token
 */
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email dan password wajib diisi'
        });
    }

    // Check if user exists
    const [users] = await pool.execute(
        'SELECT * FROM users WHERE email = ? AND status = "Aktif" LIMIT 1',
        [email]
    );

    if (users.length === 0) {
        return res.status(401).json({
            success: false,
            message: 'Email atau password salah'
        });
    }

    const user = users[0];

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
        return res.status(401).json({
            success: false,
            message: 'Email atau password salah'
        });
    }

    // Update last login
    await pool.execute(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [user.id]
    );

    // Generate token
    const token = generateToken(user);

    // Set cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // User data (without password)
    const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        primary_role: user.primary_role,
        secondary_role: user.secondary_role,
        jabatan: user.jabatan,
        vehicle_type: user.vehicle_type,
        status: user.status,
        duty_status: user.duty_status,
        join_date: user.join_date,
        phone: user.phone,
        profile_photo: user.profile_photo
    };

    res.json({
        success: true,
        message: 'Login berhasil',
        token,
        user: userData
    });
}));

/**
 * POST /api/auth/logout
 * Logout user / clear cookie
 */
router.post('/logout', (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0)
    });

    res.json({
        success: true,
        message: 'Logout berhasil'
    });
});

/**
 * GET /api/auth/me
 * Get current logged in user
 */
router.get('/me', protect, asyncHandler(async (req, res) => {
    const [users] = await pool.execute(
        `SELECT id, name, email, primary_role, secondary_role, jabatan, 
        vehicle_type, status, duty_status, join_date, phone, profile_photo 
        FROM users WHERE id = ? LIMIT 1`,
        [req.user.id]
    );

    if (users.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'User tidak ditemukan'
        });
    }

    res.json({
        success: true,
        user: users[0]
    });
}));

module.exports = router;