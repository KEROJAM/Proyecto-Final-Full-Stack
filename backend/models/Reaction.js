const createConnectionPool = require('../database/connection');

const Reaction = {
    async getDb() {
        return await createConnectionPool;
    },

    async add(reviewId, userId, emojiType) {
        const db = await this.getDb();
        await db.query(
            'INSERT INTO reactions (review_id, user_id, emoji_type) VALUES ($1, $2, $3)',
            [reviewId, userId || null, emojiType]
        );
    },

    async remove(reviewId, userId, emojiType) {
        const db = await this.getDb();
        await db.query(
            'DELETE FROM reactions WHERE review_id = $1 AND user_id = $2 AND emoji_type = $3',
            [reviewId, userId, emojiType]
        );
    },

    async toggle(reviewId, userId, emojiType) {
        const db = await this.getDb();
        
        let existing;
        if (userId) {
            const result = await db.query(
                'SELECT id FROM reactions WHERE review_id = $1 AND user_id = $2 AND emoji_type = $3',
                [reviewId, userId, emojiType]
            );
            existing = result.rows;
        } else {
            const result = await db.query(
                'SELECT id FROM reactions WHERE review_id = $1 AND user_id IS NULL AND emoji_type = $3',
                [reviewId, emojiType]
            );
            existing = result.rows;
        }

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
        const result = await db.query(`
            SELECT emoji_type, COUNT(*) as count
            FROM reactions
            WHERE review_id = $1
            GROUP BY emoji_type
        `, [reviewId]);
        
        const rows = result.rows;
        const resultObj = { heart: 0, laughing: 0, crying: 0, surprised: 0 };
        rows.forEach(row => {
            resultObj[row.emoji_type] = parseInt(row.count);
        });
        return resultObj;
    },

    async getUserReactions(reviewId, userId) {
        const db = await this.getDb();
        const result = await db.query(
            'SELECT emoji_type FROM reactions WHERE review_id = $1 AND user_id = $2',
            [reviewId, userId]
        );
        return result.rows.map(row => row.emoji_type);
    }
};

module.exports = Reaction;
