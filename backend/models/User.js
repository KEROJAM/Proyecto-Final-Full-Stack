const db = require('../database/connection');

const User = {
    async create(username, email, password) {
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, password]
        );
        return result.insertId;
    },

    async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    async findById(id) {
        const [rows] = await db.execute('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?', [id]);
        return rows[0];
    },

    async findByUsername(username) {
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    },

    async updateAvatar(userId, avatarPath) {
        await db.execute('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, userId]);
    }
};

module.exports = User;
