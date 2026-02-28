const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const reactionController = require('../controllers/reactionController');
const authMiddleware = require('../middleware/auth');

module.exports = (app) => {
    app.post('/api/auth/register', authController.register);
    app.post('/api/auth/login', authController.login);
    app.get('/api/auth/profile', authMiddleware, authController.getProfile);
    app.put('/api/auth/avatar', authMiddleware, authController.updateAvatar);

    app.get('/api/reviews/tags', reviewController.getTags);
    app.get('/api/reviews/random', reviewController.getRandom);
    app.get('/api/reviews', reviewController.getAll);
    app.get('/api/reviews/user', authMiddleware, reviewController.getByUser);
    app.get('/api/reviews/:id', reviewController.getById);
    app.get('/api/reviews/search/cover', reviewController.searchCover);
    app.post('/api/reviews', authMiddleware, reviewController.create);
    app.put('/api/reviews/:id', authMiddleware, reviewController.update);
    app.delete('/api/reviews/:id', authMiddleware, reviewController.delete);

    app.post('/api/reviews/:reviewId/reactions', authMiddleware, reactionController.toggle);
    app.get('/api/reviews/:reviewId/reactions', reactionController.getByReview);
};
