/**
 * Rutas administrativas protegidas por roles
 * 
 * Archivo de ejemplo: backend/routes/admin.js
 * 
 * Para usar este archivo, agregar lo siguiente en backend/routes/index.js:
 * 
 * const adminRoutes = require('./admin');
 * module.exports = (app) => {
 *     // ... rutas existentes ...
 *     app.use('/api/admin', adminRoutes);
 * };
 * 
 * O si usas un objeto tipo la estructura actual:
 * 
 * const adminRoutes = require('./admin');
 * module.exports = (app) => {
 *     // ... rutas existentes ...
 *     adminRoutes(app);
 * };
 */

const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authorization');
const roleController = require('../controllers/roleController');

module.exports = (app) => {
    // =============================================
    // RUTAS ADMINISTRATIVAS DE USUARIOS
    // =============================================
    
    /**
     * GET /api/admin/users
     * Obtener lista de todos los usuarios (paginado)
     * Requiere: Admin
     * 
     * Query Parameters:
     * - page: número de página (default: 1)
     * - limit: usuarios por página (default: 20)
     * 
     * Respuesta exitosa (200):
     * {
     *     "success": true,
     *     "data": [{ id, username, name, email, role, created_at }, ...],
     *     "pagination": { total, page, limit, pages }
     * }
     */
    app.get('/api/admin/users', 
        authMiddleware,
        requireAdmin,
        roleController.getAllUsers
    );

    /**
     * GET /api/admin/users/:userId
     * Obtener información detallada de un usuario específico
     * Requiere: Admin
     * 
     * Respuesta exitosa (200):
     * {
     *     "success": true,
     *     "data": { id, username, name, email, role, created_at }
     * }
     */
    app.get('/api/admin/users/:userId',
        authMiddleware,
        requireAdmin,
        roleController.getUserById
    );

    /**
     * POST /api/admin/users/:userId/role
     * Cambiar el rol de un usuario
     * Requiere: Admin
     * 
     * Body:
     * {
     *     "role": "admin" | "user"
     * }
     * 
     * Respuesta exitosa (200):
     * {
     *     "success": true,
     *     "message": "Rol de usuario actualizado a \"admin\"",
     *     "data": { id, username, email, role }
     * }
     */
    app.post('/api/admin/users/:userId/role',
        authMiddleware,
        requireAdmin,
        roleController.updateUserRole
    );

    /**
     * GET /api/me
     * Obtener información del usuario actualmente autenticado
     * Requiere: Autenticación
     * 
     * Respuesta exitosa (200):
     * {
     *     "success": true,
     *     "data": { id, username, name, email, role, created_at }
     * }
     */
    app.get('/api/me',
        authMiddleware,
        roleController.getCurrentUser
    );
};
