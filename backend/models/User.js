const createConnectionPool = require('../database/connection');

let cachedPool = null;

const User = {
    async getDb() {
        if (cachedPool) {
            return cachedPool;
        }
        const db = await createConnectionPool();
        if (!db) {
            throw new Error('Base de datos no disponible');
        }
        cachedPool = db;
        return db;
    },

    async create(username, name, email, password, role = 'user') {
        const db = await this.getDb();
        const result = await db.query(
            'INSERT INTO users (username, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [username, name, email, password, role]
        );
        return result.rows[0].id;
    },

    async findByEmail(email) {
        const db = await this.getDb();
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    },

    async findById(id) {
        const db = await this.getDb();
        const result = await db.query('SELECT id, username, name, email, avatar, role, created_at FROM users WHERE id = $1', [id]);
        return result.rows[0];
    },

    async findByUsername(username) {
        const db = await this.getDb();
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        return result.rows[0];
    },

    async updateAvatar(userId, avatarPath) {
        const db = await this.getDb();
        await db.query('UPDATE users SET avatar = $1 WHERE id = $2', [avatarPath, userId]);
    },

    /**
     * Cambiar el rol de un usuario
     * Solo admins pueden hacer esto
     */
    async updateRole(userId, newRole) {
        if (!['user', 'admin'].includes(newRole)) {
            throw new Error('Rol inválido. Debe ser "user" o "admin"');
        }
        
        const db = await this.getDb();
        const result = await db.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role',
            [newRole, userId]
        );
        
        if (result.rows.length === 0) {
            throw new Error('Usuario no encontrado');
        }
        
        return result.rows[0];
    },

    /**
     * Obtener todos los usuarios (solo para admins)
     */
    async getAllUsers(limit = 50, offset = 0) {
        const db = await this.getDb();
        const result = await db.query(
            'SELECT id, username, name, email, avatar, role, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        return result.rows;
    },

    /**
     * Contar total de usuarios
     */
    async countUsers() {
        const db = await this.getDb();
        const result = await db.query('SELECT COUNT(*) as count FROM users');
        return parseInt(result.rows[0].count);
    }
};

module.exports = User;
