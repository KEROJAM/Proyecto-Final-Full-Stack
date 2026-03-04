/**
 * Middleware de autorización por roles
 * Proporciona métodos para proteger rutas según el rol del usuario
 */

/**
 * Requiere que el usuario sea admin
 * Debe usarse DESPUÉS del middleware de autenticación
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
    }

    next();
};

/**
 * Requiere que el usuario tenga un rol específico
 * Puede aceptar un rol o un array de roles permitidos
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!rolesArray.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Acceso denegado. Roles permitidos: ${rolesArray.join(', ')}` 
            });
        }

        next();
    };
};

/**
 * Requiere que el usuario sea propietario del recurso O sea admin
 * Debe usarse DESPUÉS del middleware de autenticación
 * Espera que req.params.userId o req.body.userId contenga el ID del propietario
 */
const requireOwnerOrAdmin = (userIdParam = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        // El admin puede hacer cualquier cosa
        if (req.user.role === 'admin') {
            return next();
        }

        // Los usuarios regulares solo pueden operar sobre su propio recurso
        const targetUserId = req.params[userIdParam] || req.body[userIdParam];
        const userIdAsNumber = parseInt(req.user.id);
        const targetUserIdAsNumber = parseInt(targetUserId);

        if (userIdAsNumber !== targetUserIdAsNumber) {
            return res.status(403).json({ 
                error: 'No tienes permiso para modificar este recurso' 
            });
        }

        next();
    };
};

/**
 * Middleware para verificar si el usuario está autenticado
 * Puede usarse para rutas que son opcionales (ej: ver reviews públicas)
 */
const optionalAuth = (req, res, next) => {
    // Si no hay usuario, simplemente continúa
    // El req.user será undefined
    next();
};

module.exports = {
    requireAdmin,
    requireRole,
    requireOwnerOrAdmin,
    optionalAuth
};
