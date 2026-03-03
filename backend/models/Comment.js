const createConnectionPool = require('../database/connection');

const Comment = {
    async getDb() {
        return await createConnectionPool;
    },

    async create(reviewId, userId, commentText) {
        const db = await this.getDb();
        const result = await db.query(
            'INSERT INTO comments (review_id, user_id, comment_text) VALUES ($1, $2, $3) RETURNING id',
            [reviewId, userId, commentText]
        );
        return result.rows[0].id;
    },

    async findByReviewId(reviewId) {
        const db = await this.getDb();
        const result = await db.query(`
            SELECT c.*, u.username, u.name, u.avatar
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.review_id = $1
            ORDER BY c.created_at DESC
        `, [reviewId]);
        return result.rows;
    },

    async findById(id) {
        const db = await this.getDb();
        const result = await db.query('SELECT * FROM comments WHERE id = $1', [id]);
        return result.rows[0];
    },

    async delete(id, userId) {
        const db = await this.getDb();
        await db.query('DELETE FROM comments WHERE id = $1 AND user_id = $2', [id, userId]);
    }
};

module.exports = Comment;
