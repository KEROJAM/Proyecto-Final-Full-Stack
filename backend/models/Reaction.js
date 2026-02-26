const createConnectionPool = require('../database/connection');

const Reaction = {
    async getDb() {
        return await createConnectionPool;
    },

    async add(reviewId, userId, emojiType) {
        const db = await this.getDb();
        await db.execute(
            'INSERT INTO reactions (review_id, user_id, emoji_type) VALUES (?, ?, ?)',
            [reviewId, userId, emojiType]
        );
    },

    async remove(reviewId, userId, emojiType) {
        const db = await this.getDb();
        await db.execute(
            'DELETE FROM reactions WHERE review_id = ? AND user_id = ? AND emoji_type = ?',
            [reviewId, userId, emojiType]
        );
    },

    async toggle(reviewId, userId, emojiType) {
        const db = await this.getDb();
        const [existing] = await db.execute(
            'SELECT id FROM reactions WHERE review_id = ? AND user_id = ? AND emoji_type = ?',
            [reviewId, userId, emojiType]
        );

        if (existing.length > 0) {
            await this.remove(reviewId, userId, emojiType);
            return false;
        } else {
            await this.add(reviewId, userId, emojiType);
            return true;
        }
    },

    async getByReviewId(reviewId) {
        const db = await this.getDb();
        const [rows] = await db.execute(`
            SELECT emoji_type, COUNT(*) as count, 
            GROUP_CONCAT(user_id) as user_ids
            FROM reactions
            WHERE review_id = ?
            GROUP BY emoji_type
        `, [reviewId]);
        
        const result = { heart: 0, laughing: 0, crying: 0, surprised: 0 };
        rows.forEach(row => {
            result[row.emoji_type] = row.count;
        });
        return result;
    },

    async getUserReactions(reviewId, userId) {
        const db = await this.getDb();
        const [rows] = await db.execute(
            'SELECT emoji_type FROM reactions WHERE review_id = ? AND user_id = ?',
            [reviewId, userId]
        );
        return rows.map(row => row.emoji_type);
    }
};

module.exports = Reaction;
