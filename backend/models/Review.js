const createConnectionPool = require('../database/connection');

const Review = {
    async getDb() {
        return await createConnectionPool;
    },

    async create(userId, mediaType, mediaTitle, reviewText, rating = null) {
        const db = await this.getDb();
        const [result] = await db.execute(
            'INSERT INTO reviews (user_id, media_type, media_title, review_text, rating) VALUES (?, ?, ?, ?, ?)',
            [userId, mediaType, mediaTitle, reviewText, rating]
        );
        return result.insertId;
    },

    async findById(id) {
        const db = await this.getDb();
        const [rows] = await db.execute(`
            SELECT r.*, u.username, u.avatar,
            GROUP_CONCAT(DISTINCT rt.name) as tags,
            GROUP_CONCAT(DISTINCT CONCAT(r2.emoji_type, ':', r2.user_id)) as reactions
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN review_tag_map rtm ON r.id = rtm.review_id
            LEFT JOIN review_tags rt ON rtm.tag_id = rt.id
            LEFT JOIN reactions r2 ON r.id = r2.review_id
            WHERE r.id = ?
            GROUP BY r.id
        `, [id]);
        return rows[0];
    },

    async findAll(limit = 50, offset = 0) {
        const db = await this.getDb();
        const [rows] = await db.execute(`
            SELECT r.*, u.username, u.avatar,
            GROUP_CONCAT(DISTINCT rt.name) as tags
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN review_tag_map rtm ON r.id = rtm.review_id
            LEFT JOIN review_tags rt ON rtm.tag_id = rt.id
            GROUP BY r.id
            ORDER BY r.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `);
        return rows;
    },

    async findRandom(limit = 20) {
        const db = await this.getDb();
        const [rows] = await db.execute(`
            SELECT r.*, u.username, u.avatar,
            GROUP_CONCAT(DISTINCT rt.name) as tags
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN review_tag_map rtm ON r.id = rtm.review_id
            LEFT JOIN review_tags rt ON rtm.tag_id = rt.id
            GROUP BY r.id
            ORDER BY RAND()
            LIMIT ${parseInt(limit)}
        `);
        return rows;
    },

    async findByUserId(userId, limit = 50, offset = 0) {
        const db = await this.getDb();
        const [rows] = await db.execute(`
            SELECT r.*, u.username, u.avatar,
            GROUP_CONCAT(DISTINCT rt.name) as tags
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN review_tag_map rtm ON r.id = rtm.review_id
            LEFT JOIN review_tags rt ON rtm.tag_id = rt.id
            WHERE r.user_id = ?
            GROUP BY r.id
            ORDER BY r.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `, [userId]);
        return rows;
    },

    async findByMediaType(mediaType, limit = 50, offset = 0) {
        const db = await this.getDb();
        const [rows] = await db.execute(`
            SELECT r.*, u.username, u.avatar,
            GROUP_CONCAT(DISTINCT rt.name) as tags
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN review_tag_map rtm ON r.id = rtm.review_id
            LEFT JOIN review_tags rt ON rtm.tag_id = rt.id
            WHERE r.media_type = ?
            GROUP BY r.id
            ORDER BY r.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `, [mediaType]);
        return rows;
    },

    async update(id, userId, data) {
        const db = await this.getDb();
        const fields = [];
        const values = [];
        
        if (data.media_type !== undefined) { fields.push('media_type = ?'); values.push(data.media_type); }
        if (data.media_title !== undefined) { fields.push('media_title = ?'); values.push(data.media_title); }
        if (data.review_text !== undefined) { fields.push('review_text = ?'); values.push(data.review_text); }
        if (data.rating !== undefined) { fields.push('rating = ?'); values.push(data.rating); }
        
        if (fields.length > 0) {
            values.push(id, userId);
            await db.execute(`UPDATE reviews SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
        }
    },

    async delete(id, userId) {
        const db = await this.getDb();
        await db.execute('DELETE FROM reviews WHERE id = ? AND user_id = ?', [id, userId]);
    },

    async addTag(reviewId, tagId) {
        const db = await this.getDb();
        await db.execute(
            'INSERT IGNORE INTO review_tag_map (review_id, tag_id) VALUES (?, ?)',
            [reviewId, tagId]
        );
    },

    async removeTag(reviewId, tagId) {
        const db = await this.getDb();
        await db.execute(
            'DELETE FROM review_tag_map WHERE review_id = ? AND tag_id = ?',
            [reviewId, tagId]
        );
    },

    async setTags(reviewId, tagIds) {
        const db = await this.getDb();
        await db.execute('DELETE FROM review_tag_map WHERE review_id = ?', [reviewId]);
        for (const tagId of tagIds) {
            await db.execute(
                'INSERT INTO review_tag_map (review_id, tag_id) VALUES (?, ?)',
                [reviewId, tagId]
            );
        }
    },

    async getAllTags() {
        const db = await this.getDb();
        const [rows] = await db.execute('SELECT * FROM review_tags ORDER BY name');
        return rows;
    }
};

module.exports = Review;
