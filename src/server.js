require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');

const { testConnection } = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/security');

// ROUTES - PASTIKAN INI ADA!
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dutyRoutes = require('./routes/dutyRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database
testConnection();

// Health check
app.get('/health', (req, res) => {
    res.json({ success: true, message: 'Server running' });
});

// API Routes
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);   
app.use('/api/users', userRoutes);   
app.use('/api/duties', dutyRoutes);  

// SPA fallback
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 TRANS INDOPRIDE FLEET MANAGEMENT');
    console.log('='.repeat(60));
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`🔑 Login: http://localhost:${PORT}/login.html`);
    console.log('='.repeat(60) + '\n');
});

module.exports = app;