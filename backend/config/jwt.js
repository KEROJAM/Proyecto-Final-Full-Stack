/**
 * Configuración centralizada de JWT
 * Asegura que el mismo secret se use en todo el código
 */

const getJWTSecret = () => {
    const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';
    return secret;
};

const getJWTSecretInfo = () => {
    const secret = getJWTSecret();
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(secret).digest('hex').substring(0, 8);
    const configured = !!process.env.JWT_SECRET;
    
    return {
        secret,
        hash,
        configured,
        message: configured 
            ? `✅ JWT_SECRET configurado (hash: ${hash})`
            : `⚠️  USANDO VALUE POR DEFECTO (hash: ${hash}) - Configura JWT_SECRET en variables de entorno`
    };
};

module.exports = {
    getJWTSecret,
    getJWTSecretInfo
};
