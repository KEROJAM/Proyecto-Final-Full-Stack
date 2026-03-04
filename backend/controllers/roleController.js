const User = require('../models/User');

/**
 * Controlador para operaciones administrativas de roles
 * Todas estas rutas deben ser protegidas con requireAdmin
 */

const roleController = {
    /**
     * Obtener todos los usuarios (paginado)
     */
    async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            const users = await User.getAllUsers(limit, offset);
            const totalCount = await User.countUsers();

            res.json({
                success: true,
                data: users,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    pages: Math.ceil(totalCount / limit)
                }
            });
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            res.status(500).json({ error: 'Error al obtener usuarios' });
        }
    },

    /**
     * Cambiar el rol de un usuario
     */
    async updateUserRole(req, res) {
        try {
            const { userId } = req.params;
            const { role } = req.body;

            if (!role) {
                return res.status(400).json({ error: 'El rol es requerido' });
            }

            if (!['user', 'admin'].includes(role)) {
                return res.status(400).json({ error: 'Rol inválido. Debe ser "user" o "admin"' });
            }

            // Evitar que un admin se quite a sí mismo los permisos de admin
            if (parseInt(userId) === req.user.id && role === 'user') {
                return res.status(400).json({ 
                    error: 'No puedes quitarte a ti mismo los permisos de administrador' 
                });
            }

            const updatedUser = await User.updateRole(parseInt(userId), role);

            res.json({
                success: true,
                message: `Rol de usuario actualizado a "${role}"`,
                data: updatedUser
            });
        } catch (error) {
            console.error('Error al actualizar rol:', error);
            if (error.message === 'Usuario no encontrado') {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: 'Error al actualizar rol' });
        }
    },

    /**
     * Obtener información de un usuario específico
     */
    async getUserById(req, res) {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            res.status(500).json({ error: 'Error al obtener usuario' });
        }
    },

    /**
     * Obtener información del usuario actual (útil para verificar su rol)
     */
    async getCurrentUser(req, res) {
        try {
            const user = await User.findById(req.user.id);
            
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Error al obtener usuario actual:', error);
            res.status(500).json({ error: 'Error al obtener usuario actual' });
        }
    }
};

module.exports = roleController;
