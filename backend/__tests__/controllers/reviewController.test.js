jest.mock('../../models/Review');
jest.mock('../../models/Reaction');
jest.mock('../../services/coverService');

const Review = require('../../models/Review');
const Reaction = require('../../models/Reaction');
const coverService = require('../../services/coverService');
const reviewController = require('../../controllers/reviewController');

describe('reviewController', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            body: {},
            params: {},
            query: {},
            user: { id: 1, username: 'testuser' }
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('create', () => {
        it('should create a review successfully', async () => {
            mockReq.body = {
                media_type: 'movie',
                media_title: 'Test Movie',
                review_text: 'Great movie!',
                rating: 5
            };

            coverService.searchCover.mockResolvedValueOnce('cover.jpg');
            Review.create.mockResolvedValueOnce(1);
            Review.findById.mockResolvedValueOnce({
                id: 1,
                media_type: 'movie',
                media_title: 'Test Movie'
            });
            Review.setTags.mockResolvedValueOnce();

            await reviewController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Review created successfully',
                    review: expect.objectContaining({
                        id: 1
                    })
                })
            );
        });

        it('should return 400 if required fields missing', async () => {
            mockReq.body = { media_type: 'movie' };

            await reviewController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Media type, title and review text are required'
            });
        });

        it('should return 400 if review text too long', async () => {
            mockReq.body = {
                media_type: 'movie',
                media_title: 'Test Movie',
                review_text: 'a'.repeat(201)
            };

            await reviewController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Review must be 200 characters or less'
            });
        });

        it('should return 400 if invalid media type', async () => {
            mockReq.body = {
                media_type: 'invalid',
                media_title: 'Test',
                review_text: 'Test'
            };

            await reviewController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid media type' });
        });

        it('should return 400 if rating out of range', async () => {
            mockReq.body = {
                media_type: 'movie',
                media_title: 'Test',
                review_text: 'Test',
                rating: 10
            };

            await reviewController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Rating must be between 1 and 5' });
        });
    });

    describe('getAll', () => {
        it('should return all reviews', async () => {
            mockReq.query = {};
            const mockReviews = [
                { id: 1, media_title: 'Movie 1' },
                { id: 2, media_title: 'Movie 2' }
            ];

            Review.findAll.mockResolvedValueOnce(mockReviews);
            Reaction.getByReviewId
                .mockResolvedValueOnce({ heart: 1, laughing: 0 })
                .mockResolvedValueOnce({ heart: 0, laughing: 2 });

            await reviewController.getAll(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith([
                { id: 1, media_title: 'Movie 1', reactions: { heart: 1, laughing: 0 } },
                { id: 2, media_title: 'Movie 2', reactions: { heart: 0, laughing: 2 } }
            ]);
        });
    });

    describe('getRandom', () => {
        it('should return random reviews', async () => {
            mockReq.query = {};
            const mockReviews = [{ id: 1, media_title: 'Movie 1' }];

            Review.findRandom.mockResolvedValueOnce(mockReviews);
            Reaction.getByReviewId.mockResolvedValueOnce({ heart: 1 });
            Reaction.getUserReactions.mockResolvedValueOnce(['heart']);

            await reviewController.getRandom(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith([
                { id: 1, media_title: 'Movie 1', reactions: { heart: 1 }, userReactions: ['heart'] }
            ]);
        });
    });

    describe('getById', () => {
        it('should return review by id', async () => {
            mockReq.params = { id: 1 };
            const mockReview = { id: 1, media_title: 'Movie 1' };

            Review.findById.mockResolvedValueOnce(mockReview);
            Reaction.getByReviewId.mockResolvedValueOnce({ heart: 1 });
            Reaction.getUserReactions.mockResolvedValueOnce(['heart']);

            await reviewController.getById(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                id: 1,
                media_title: 'Movie 1',
                reactions: { heart: 1 },
                userReactions: ['heart']
            });
        });

        it('should return 404 if review not found', async () => {
            mockReq.params = { id: 999 };
            Review.findById.mockResolvedValueOnce(null);

            await reviewController.getById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Review not found' });
        });
    });

    describe('getByUser', () => {
        it('should return user reviews', async () => {
            const mockReviews = [{ id: 1, user_id: 1 }];
            Review.findByUserId.mockResolvedValueOnce(mockReviews);

            await reviewController.getByUser(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(mockReviews);
        });
    });

    describe('update', () => {
        it('should update review successfully', async () => {
            mockReq.params = { id: 1 };
            mockReq.body = { review_text: 'Updated text', rating: 4 };

            Review.findById.mockResolvedValueOnce({ id: 1, user_id: 1, review_text: 'Old' });
            Review.update.mockResolvedValueOnce();
            Review.setTags.mockResolvedValueOnce();
            Review.findById.mockResolvedValueOnce({ id: 1, review_text: 'Updated text' });

            await reviewController.update(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Review updated successfully'
                })
            );
        });

        it('should return 404 if review not found', async () => {
            mockReq.params = { id: 999 };
            mockReq.body = { review_text: 'Test' };

            Review.findById.mockResolvedValueOnce(null);

            await reviewController.update(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should return 403 if not authorized', async () => {
            mockReq.params = { id: 1 };
            mockReq.body = { review_text: 'Test' };

            Review.findById.mockResolvedValueOnce({ id: 1, user_id: 2 });

            await reviewController.update(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('should return 400 if review text too long', async () => {
            mockReq.params = { id: 1 };
            mockReq.body = { review_text: 'a'.repeat(201) };

            Review.findById.mockResolvedValueOnce({ id: 1, user_id: 1 });

            await reviewController.update(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Review must be 200 characters or less' });
        });
    });

    describe('delete', () => {
        it('should delete review successfully', async () => {
            mockReq.params = { id: 1 };

            Review.findById.mockResolvedValueOnce({ id: 1, user_id: 1 });
            Review.delete.mockResolvedValueOnce();

            await reviewController.delete(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Review deleted successfully' });
        });

        it('should return 404 if review not found', async () => {
            mockReq.params = { id: 999 };
            Review.findById.mockResolvedValueOnce(null);

            await reviewController.delete(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should return 403 if not authorized', async () => {
            mockReq.params = { id: 1 };
            Review.findById.mockResolvedValueOnce({ id: 1, user_id: 2 });

            await reviewController.delete(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });
    });

    describe('getTags', () => {
        it('should return all tags', async () => {
            const mockTags = [{ id: 1, name: 'Action' }, { id: 2, name: 'Comedy' }];
            Review.getAllTags.mockResolvedValueOnce(mockTags);

            await reviewController.getTags(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(mockTags);
        });
    });

    describe('searchCover', () => {
        it('should search cover successfully', async () => {
            mockReq.query = { media_type: 'movie', title: 'Test Movie' };
            coverService.searchCover.mockResolvedValueOnce('cover.jpg');

            await reviewController.searchCover(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({ cover: 'cover.jpg' });
        });

        it('should return 400 if required params missing', async () => {
            mockReq.query = { media_type: 'movie' };

            await reviewController.searchCover(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });
});
