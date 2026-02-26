const Review = require('../models/Review');
const Reaction = require('../models/Reaction');

const reviewController = {
    async create(req, res) {
        try {
            const { media_type, media_title, review_text, rating, tags } = req.body;
            const userId = req.user.id;

            if (!media_type || !media_title || !review_text) {
                return res.status(400).json({ error: 'Media type, title and review text are required' });
            }

            if (review_text.length > 200) {
                return res.status(400).json({ error: 'Review must be 200 characters or less' });
            }

            const validMediaTypes = ['book', 'movie', 'tv', 'music', 'game'];
            if (!validMediaTypes.includes(media_type)) {
                return res.status(400).json({ error: 'Invalid media type' });
            }

            if (rating && (rating < 1 || rating > 5)) {
                return res.status(400).json({ error: 'Rating must be between 1 and 5' });
            }

            const reviewId = await Review.create(userId, media_type, media_title, review_text, rating || null);

            if (tags && Array.isArray(tags) && tags.length > 0) {
                await Review.setTags(reviewId, tags);
            }

            const review = await Review.findById(reviewId);
            
            res.status(201).json({ message: 'Review created successfully', review });
        } catch (error) {
            console.error('Error creating review:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getAll(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const reviews = await Review.findAll(limit, offset);
            
            const reviewsWithReactions = await Promise.all(
                reviews.map(async (review) => {
                    const reactions = await Reaction.getByReviewId(review.id);
                    return { ...review, reactions };
                })
            );

            res.json(reviewsWithReactions);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getRandom(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const reviews = await Review.findRandom(limit);
            
            const reviewsWithReactions = await Promise.all(
                reviews.map(async (review) => {
                    const reactions = await Reaction.getByReviewId(review.id);
                    let userReactions = [];
                    if (req.user) {
                        userReactions = await Reaction.getUserReactions(review.id, req.user.id);
                    }
                    return { ...review, reactions, userReactions };
                })
            );

            res.json(reviewsWithReactions);
        } catch (error) {
            console.error('Error fetching random reviews:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const review = await Review.findById(id);

            if (!review) {
                return res.status(404).json({ error: 'Review not found' });
            }

            const reactions = await Reaction.getByReviewId(id);
            let userReactions = [];
            if (req.user) {
                userReactions = await Reaction.getUserReactions(id, req.user.id);
            }

            res.json({ ...review, reactions, userReactions });
        } catch (error) {
            console.error('Error fetching review:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getByUser(req, res) {
        try {
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            
            const reviews = await Review.findByUserId(userId, limit, offset);
            res.json(reviews);
        } catch (error) {
            console.error('Error fetching user reviews:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { media_type, media_title, review_text, rating, tags } = req.body;

            const existing = await Review.findById(id);
            if (!existing) {
                return res.status(404).json({ error: 'Review not found' });
            }

            if (existing.user_id !== userId) {
                return res.status(403).json({ error: 'Not authorized to update this review' });
            }

            if (review_text && review_text.length > 200) {
                return res.status(400).json({ error: 'Review must be 200 characters or less' });
            }

            await Review.update(id, userId, { media_type, media_title, review_text, rating });

            if (tags && Array.isArray(tags)) {
                await Review.setTags(id, tags);
            }

            const review = await Review.findById(id);
            res.json({ message: 'Review updated successfully', review });
        } catch (error) {
            console.error('Error updating review:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const existing = await Review.findById(id);
            if (!existing) {
                return res.status(404).json({ error: 'Review not found' });
            }

            if (existing.user_id !== userId) {
                return res.status(403).json({ error: 'Not authorized to delete this review' });
            }

            await Review.delete(id, userId);
            res.json({ message: 'Review deleted successfully' });
        } catch (error) {
            console.error('Error deleting review:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getTags(req, res) {
        try {
            const tags = await Review.getAllTags();
            res.json(tags);
        } catch (error) {
            console.error('Error fetching tags:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = reviewController;
