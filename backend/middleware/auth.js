const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJWTSecret, getJWTSecretInfo } = require('../config/jwt');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log('[AUTH MIDDLEWARE] Verificando token para:', req.method, req.originalUrl);

        if (!authHeader) {
            console.error('[AUTH MIDDLEWARE] ❌ Missing Authorization header');
            return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
        }

        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;

        const tokenPreview = token ? `${token.substring(0, 20)}...` : null;
        console.log('[AUTH MIDDLEWARE] Token preview:', tokenPreview);

        let decoded;
        const verifySecret = getJWTSecret();
        const jwtInfo = getJWTSecretInfo();
        console.log('[AUTH MIDDLEWARE] ' + jwtInfo.message);
        
        try {
            decoded = jwt.verify(token, verifySecret);
            console.log('[AUTH MIDDLEWARE] ✅ JWT verificado exitosamente para userId:', decoded.userId);
        } catch (e) {
            console.error('[AUTH MIDDLEWARE] ❌ JWT verification failed:', {
                errorName: e.name,
                message: e.message,
                tokenPreview: tokenPreview,
                path: req.originalUrl,
                secretHash: jwtInfo.hash,
                jwtSecretConfigured: jwtInfo.configured
            });
            throw e;
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            console.error('[AUTH MIDDLEWARE] ❌ User not found for userId:', decoded.userId);
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        console.log('[AUTH MIDDLEWARE] ✅ Usuario encontrado:', user.id, user.username);
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            role: user.role || 'user'
        };
        req.userId = user.id;

        next();
    } catch (error) {
        console.error('[AUTH MIDDLEWARE] ❌ Final error:', {
            name: error.name,
            message: error.message
        });
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        return res.status(401).json({ 
            error: 'Token inválido',
            details: error.message
        });
    }
};

module.exports = authMiddleware;
