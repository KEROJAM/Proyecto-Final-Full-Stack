const createConnectionPool = require('../database/connection');

const Review = {
    async getDb() {
        const db = await createConnectionPool();
        if (!db) {
            throw new Error('Base de datos no disponible');
        }
        return db;
    },

    async create(userId, mediaType, mediaTitle, reviewText, rating = null, cover = null) {
        const db = await this.getDb();
        const result = await db.query(
            'INSERT INTO reviews (user_id, media_type, media_title, cover, review_text, rating) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [userId, mediaType, mediaTitle, cover, reviewText, rating]
        );
        return result.rows[0].id;
    },

    async findById(id) {
        const db = await this.getDb();
        const result = await db.query(`
            SELECT r.*, u.username, u.name, u.avatar,
            STRING_AGG(DISTINCT rt.name, ',') as tags
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN review_tag_map rtm ON r.id = rtm.review_id
            LEFT JOIN review_tags rt ON rtm.tag_id = rt.id
            WHERE r.id = $1
            GROUP BY r.id
        `, [id]);
        return result.rows[0];
    },

    async findAll(limit = 50, offset = 0) {
        const db = await this.getDb();
        const result = await db.query(`
            SELECT r.*, u.username, u.name, u.avatar,
            STRING_AGG(DISTINCT rt.name, ',') as tags
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN review_tag_map rtm ON r.id = rtm.review_id
            LEFT JOIN review_tags rt ON rtm.tag_id = rt.id
            GROUP BY r.id
            ORDER BY r.created_at DESC
            LIMIT $1 OFFSET $2
        `, [parseInt(limit), parseInt(offset)]);
        return result.rows;
    },

    async findRandom(limit = 20) {
        const db = await this.getDb();
        const result = await db.query(`
            SELECT r.*, u.username, u.name, u.avatar,
            STRING_AGG(DISTINCT rt.name, ',') as tags
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN review_tag_map rtm ON r.id = rtm.review_id
            LEFT JOIN review_tags rt ON rtm.tag_id = rt.id
            GROUP BY r.id
            ORDER BY RANDOM()
            LIMIT $1
        `, [parseInt(limit)]);
        return result.rows;
    },

    async findByUserId(userId, limit = 50, offset = 0) {
        const db = await this.getDb();
        const result = await db.query(`
            SELECT r.*, u.username, u.name, u.avatar,
            STRING_AGG(DISTINCT rt.name, ',') as tags
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN review_tag_map rtm ON r.id = rtm.review_id
            LEFT JOIN review_tags rt ON rtm.tag_id = rt.id
            WHERE r.user_id = $1
            GROUP BY r.id
            ORDER BY r.created_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, parseInt(limit), parseInt(offset)]);
        return result.rows;
    },

    async findByMediaType(mediaType, limit = 50, offset = 0) {
        const db = await this.getDb();
        const result = await db.query(`
            SELECT r.*, u.username, u.name, u.avatar,
            STRING_AGG(DISTINCT rt.name, ',') as tags
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN review_tag_map rtm ON r.id = rtm.review_id
            LEFT JOIN review_tags rt ON rtm.tag_id = rt.id
            WHERE r.media_type = $1
            GROUP BY r.id
            ORDER BY r.created_at DESC
            LIMIT $2 OFFSET $3
        `, [mediaType, parseInt(limit), parseInt(offset)]);
        return result.rows;
    },

    async update(id, userId, data) {
        const db = await this.getDb();
        const fields = [];
        const values = [];
        let paramIndex = 1;
        
        if (data.media_type !== undefined) { fields.push(`media_type = $${paramIndex++}`); values.push(data.media_type); }
        if (data.media_title !== undefined) { fields.push(`media_title = $${paramIndex++}`); values.push(data.media_title); }
        if (data.cover !== undefined) { fields.push(`cover = $${paramIndex++}`); values.push(data.cover); }
        if (data.review_text !== undefined) { fields.push(`review_text = $${paramIndex++}`); values.push(data.review_text); }
        if (data.rating !== undefined) { fields.push(`rating = $${paramIndex++}`); values.push(data.rating); }
        
        if (fields.length > 0) {
            values.push(id, userId);
            await db.query(`UPDATE reviews SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}`, values);
        }
    },

    async delete(id, userId) {
        const db = await this.getDb();
        await db.query('DELETE FROM reviews WHERE id = $1 AND user_id = $2', [id, userId]);
    },

    async addTag(reviewId, tagId) {
        const db = await this.getDb();
        await db.query(
            'INSERT INTO review_tag_map (review_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [reviewId, tagId]
        );
    },

    async removeTag(reviewId, tagId) {
        const db = await this.getDb();
        await db.query(
            'DELETE FROM review_tag_map WHERE review_id = $1 AND tag_id = $2',
            [reviewId, tagId]
        );
    },

    async setTags(reviewId, tags) {
        const db = await this.getDb();
        await db.query('DELETE FROM review_tag_map WHERE review_id = $1', [reviewId]);
        
        const uniqueTags = [...new Set(tags)];
        
        for (const tag of uniqueTags) {
            let tagId;
            if (typeof tag === 'string') {
                const tagResult = await db.query(
                    'SELECT id FROM review_tags WHERE name = $1',
                    [tag]
                );
                if (tagResult.rows.length > 0) {
                    tagId = tagResult.rows[0].id;
                } else {
                    const newTag = await db.query(
                        'INSERT INTO review_tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
                        [tag]
                    );
                    tagId = newTag.rows[0].id;
                }
            } else {
                tagId = tag;
            }
            
            if (tagId) {
                await db.query(
                    'INSERT INTO review_tag_map (review_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [reviewId, tagId]
                );
            }
        }
    },

    async getAllTags() {
        const db = await this.getDb();
        const result = await db.query('SELECT * FROM review_tags ORDER BY name');
        return result.rows;
    }
};

module.exports = Review;
