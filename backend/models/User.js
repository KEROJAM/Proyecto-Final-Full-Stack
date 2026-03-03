const createConnectionPool = require('../database/connection');

const User = {
    async getDb() {
        return await createConnectionPool();
    },

    async create(username, name, email, password) {
        const db = await this.getDb();
        const result = await db.query(
            'INSERT INTO users (username, name, email, password) VALUES ($1, $2, $3, $4) RETURNING id',
            [username, name, email, password]
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
        const result = await db.query('SELECT id, username, name, email, avatar, created_at FROM users WHERE id = $1', [id]);
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
    }
};

module.exports = User;
