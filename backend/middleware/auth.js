const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';
const DEBUG_AUTH = process.env.DEBUG_AUTH === '1';

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            if (DEBUG_AUTH) console.error('[AUTH DEBUG] Missing Authorization header for', req.method, req.originalUrl);
            return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
        }

        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            if (DEBUG_AUTH) {
                const preview = token ? `${token.substring(0, 10)}...` : null;
                console.error('[AUTH DEBUG] JWT verification failed', { errorName: e.name, message: e.message, tokenPreview: preview, path: req.originalUrl });
            }
            throw e;
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            if (DEBUG_AUTH) console.error('[AUTH DEBUG] User not found for token userId:', decoded.userId);
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            role: user.role || 'user'
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        return res.status(401).json({ error: 'Token inválido' });
    }
};

module.exports = authMiddleware;
