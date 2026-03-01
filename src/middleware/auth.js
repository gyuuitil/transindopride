const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'transindopride_secret_2024';

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }
        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token invalid' });
    }
};

const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.primary_role) && !roles.includes(req.user?.secondary_role)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
};

module.exports = { protect, requireRole };
