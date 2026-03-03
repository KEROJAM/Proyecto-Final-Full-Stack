const Reaction = require('../models/Reaction');
const Review = require('../models/Review');

const reactionController = {
    async toggle(req, res) {
        try {
            const { reviewId } = req.params;
            const { emoji_type } = req.body;
            const userId = req.user ? req.user.id : null;

            const validEmojis = ['heart', 'laughing', 'crying', 'surprised'];
            if (!validEmojis.includes(emoji_type)) {
                return res.status(400).json({ error: 'Invalid emoji type' });
            }

            const review = await Review.findById(reviewId);
            if (!review) {
                return res.status(404).json({ error: 'Review not found' });
            }

            const isAdded = await Reaction.toggle(reviewId, userId, emoji_type);
            const reactions = await Reaction.getByReviewId(reviewId);

            res.json({ 
                message: isAdded ? 'Reaction added' : 'Reaction removed',
                emoji_type,
                isAdded,
                reactions
            });
        } catch (error) {
            console.error('Error toggling reaction:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getByReview(req, res) {
        try {
            const { reviewId } = req.params;
            
            const review = await Review.findById(reviewId);
            if (!review) {
                return res.status(404).json({ error: 'Review not found' });
            }

            const reactions = await Reaction.getByReviewId(reviewId);
            let userReactions = [];
            if (req.user) {
                userReactions = await Reaction.getUserReactions(reviewId, req.user.id);
            }

            res.json({ reactions, userReactions });
        } catch (error) {
            console.error('Error fetching reactions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = reactionController;
