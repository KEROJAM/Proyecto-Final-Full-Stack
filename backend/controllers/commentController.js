const Comment = require('../models/Comment');
const Review = require('../models/Review');

const commentController = {
    async create(req, res) {
        try {
            const { reviewId } = req.params;
            const { comment_text } = req.body;
            const userId = req.user.id;

            if (!comment_text || comment_text.trim() === '') {
                return res.status(400).json({ error: 'El comentario no puede estar vacío' });
            }

            const review = await Review.findById(reviewId);
            if (!review) {
                return res.status(404).json({ error: 'Review no encontrada' });
            }

            const commentId = await Comment.create(reviewId, userId, comment_text.trim());
            const comments = await Comment.findByReviewId(reviewId);

            res.status(201).json({
                message: 'Comentario agregado',
                comments
            });
        } catch (error) {
            console.error('Error creating comment:', error);
            res.status(500).json({ error: 'Error al crear comentario' });
        }
    },

    async getByReview(req, res) {
        try {
            const { reviewId } = req.params;

            const review = await Review.findById(reviewId);
            if (!review) {
                return res.status(404).json({ error: 'Review no encontrada' });
            }

            const comments = await Comment.findByReviewId(reviewId);

            res.json({ comments });
        } catch (error) {
            console.error('Error fetching comments:', error);
            res.status(500).json({ error: 'Error al obtener comentarios' });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const comment = await Comment.findById(id);
            if (!comment) {
                return res.status(404).json({ error: 'Comentario no encontrado' });
            }

            if (comment.user_id !== userId) {
                return res.status(403).json({ error: 'No tienes permiso para eliminar este comentario' });
            }

            await Comment.delete(id, userId);

            res.json({ message: 'Comentario eliminado' });
        } catch (error) {
            console.error('Error deleting comment:', error);
            res.status(500).json({ error: 'Error al eliminar comentario' });
        }
    }
};

module.exports = commentController;
