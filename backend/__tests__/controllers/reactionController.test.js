jest.mock('../../models/Reaction');
jest.mock('../../models/Review');

const Reaction = require('../../models/Reaction');
const Review = require('../../models/Review');
const reactionController = require('../../controllers/reactionController');

describe('reactionController', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            params: {},
            body: {},
            user: { id: 1, username: 'testuser' }
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('toggle', () => {
        it('should add reaction successfully', async () => {
            mockReq.params = { reviewId: 1 };
            mockReq.body = { emoji_type: 'heart' };

            Review.findById.mockResolvedValueOnce({ id: 1 });
            Reaction.toggle.mockResolvedValueOnce(true);
            Reaction.getByReviewId.mockResolvedValueOnce({ heart: 1 });

            await reactionController.toggle(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Reaction added',
                emoji_type: 'heart',
                isAdded: true,
                reactions: { heart: 1 }
            });
        });

        it('should remove reaction successfully', async () => {
            mockReq.params = { reviewId: 1 };
            mockReq.body = { emoji_type: 'heart' };

            Review.findById.mockResolvedValueOnce({ id: 1 });
            Reaction.toggle.mockResolvedValueOnce(false);
            Reaction.getByReviewId.mockResolvedValueOnce({ heart: 0 });

            await reactionController.toggle(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Reaction removed',
                    isAdded: false
                })
            );
        });

        it('should return 400 for invalid emoji type', async () => {
            mockReq.params = { reviewId: 1 };
            mockReq.body = { emoji_type: 'invalid' };

            await reactionController.toggle(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid emoji type' });
        });

        it('should return 404 if review not found', async () => {
            mockReq.params = { reviewId: 999 };
            mockReq.body = { emoji_type: 'heart' };

            Review.findById.mockResolvedValueOnce(null);

            await reactionController.toggle(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Review not found' });
        });
    });

    describe('getByReview', () => {
        it('should return reactions for a review', async () => {
            mockReq.params = { reviewId: 1 };

            Review.findById.mockResolvedValueOnce({ id: 1 });
            Reaction.getByReviewId.mockResolvedValueOnce({ heart: 2, laughing: 1 });
            Reaction.getUserReactions.mockResolvedValueOnce(['heart']);

            await reactionController.getByReview(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                reactions: { heart: 2, laughing: 1 },
                userReactions: ['heart']
            });
        });

        it('should return 404 if review not found', async () => {
            mockReq.params = { reviewId: 999 };

            Review.findById.mockResolvedValueOnce(null);

            await reactionController.getByReview(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Review not found' });
        });

        it('should return empty userReactions when no user', async () => {
            mockReq.user = null;
            mockReq.params = { reviewId: 1 };

            Review.findById.mockResolvedValueOnce({ id: 1 });
            Reaction.getByReviewId.mockResolvedValueOnce({ heart: 1 });

            await reactionController.getByReview(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                reactions: { heart: 1 },
                userReactions: []
            });
        });
    });
});
