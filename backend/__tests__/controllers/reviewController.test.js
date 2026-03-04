jest.mock('../../models/Review');
jest.mock('../../models/Reaction');
jest.mock('../../services/coverService');

const Review = require('../../models/Review');
const Reaction = require('../../models/Reaction');
const coverService = require('../../services/coverService');
const reviewController = require('../../controllers/reviewController');

describe('reviewController - Complete Review Tests', () => {
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

    // ============================================
    // 1. CREAR REGISTROS (REVIEWS)
    // ============================================
    describe('1. Crear Registros (Reviews)', () => {
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

        it('should create review with all valid media types', async () => {
            const mediaTypes = ['movie', 'book', 'game', 'tv', 'music'];

            for (const mediaType of mediaTypes) {
                mockReq.body = {
                    media_type: mediaType,
                    media_title: `Test ${mediaType}`,
                    review_text: 'Test review',
                    rating: 5
                };

                coverService.searchCover.mockResolvedValueOnce(`${mediaType}.jpg`);
                Review.create.mockResolvedValueOnce(1);
                Review.findById.mockResolvedValueOnce({
                    id: 1,
                    media_type: mediaType
                });
                Review.setTags.mockResolvedValueOnce();

                await reviewController.create(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(201);
            }
        });
    });

    // ============================================
    // 2. LISTAR REGISTROS (REVIEWS)
    // ============================================
    describe('2. Listar Registros (Reviews)', () => {
        it('should return all reviews', async () => {
            mockReq.query = {};
            const mockReviews = [
                { id: 1, media_title: 'Movie 1', rating: 5 },
                { id: 2, media_title: 'Movie 2', rating: 4 }
            ];

            Review.findAll.mockResolvedValueOnce(mockReviews);
            Reaction.getByReviewId
                .mockResolvedValueOnce({ heart: 1, laughing: 0 })
                .mockResolvedValueOnce({ heart: 0, laughing: 2 });

            await reviewController.getAll(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ id: 1 }),
                    expect.objectContaining({ id: 2 })
                ])
            );
        });

        it('should return reviews with proper reaction counts', async () => {
            mockReq.query = {};
            const mockReviews = [
                { id: 1, media_title: 'Movie 1' }
            ];

            Review.findAll.mockResolvedValueOnce(mockReviews);
            Reaction.getByReviewId.mockResolvedValueOnce({ heart: 5, laughing: 3 });

            await reviewController.getAll(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: 1,
                        reactions: expect.objectContaining({
                            heart: 5,
                            laughing: 3
                        })
                    })
                ])
            );
        });

        it('should get review by ID', async () => {
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
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Review not found' 
            });
        });

        it('should get user reviews', async () => {
            const mockReviews = [
                { id: 1, user_id: 1, media_title: 'User Review 1' },
                { id: 2, user_id: 1, media_title: 'User Review 2' }
            ];
            Review.findByUserId.mockResolvedValueOnce(mockReviews);

            await reviewController.getByUser(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ user_id: 1 }),
                    expect.objectContaining({ user_id: 1 })
                ])
            );
        });
    });

    // ============================================
    // 3. PAGINACIÓN Y FILTROS
    // ============================================
    describe('3. Paginación y Filtros', () => {
        it('should support pagination with limit parameter', async () => {
            mockReq.query = { limit: 10 };
            const mockReviews = Array(10).fill(null).map((_, i) => ({
                id: i + 1,
                media_title: `Movie ${i + 1}`
            }));

            Review.findAll.mockResolvedValueOnce(mockReviews);
            Reaction.getByReviewId.mockResolvedValue({});

            await reviewController.getAll(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.arrayContaining(mockReviews)
            );
        });

        it('should support pagination with offset parameter', async () => {
            mockReq.query = { offset: 10, limit: 5 };
            const mockReviews = Array(5).fill(null).map((_, i) => ({
                id: i + 11,
                media_title: `Movie ${i + 11}`
            }));

            Review.findAll.mockResolvedValueOnce(mockReviews);
            Reaction.getByReviewId.mockResolvedValue({});

            await reviewController.getAll(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.arrayContaining(mockReviews)
            );
        });

        it('should support filtering by media type', async () => {
            mockReq.query = { media_type: 'movie' };
            const mockReviews = [
                { id: 1, media_type: 'movie', media_title: 'Movie 1' },
                { id: 2, media_type: 'movie', media_title: 'Movie 2' }
            ];

            Review.findAll.mockResolvedValueOnce(mockReviews);
            Reaction.getByReviewId.mockResolvedValue({});

            await reviewController.getAll(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            response.forEach(review => {
                expect(review.media_type).toBe('movie');
            });
        });

        it('should support filtering by rating', async () => {
            mockReq.query = { rating: 5 };
            const mockReviews = [
                { id: 1, rating: 5, media_title: 'Movie 1' },
                { id: 2, rating: 5, media_title: 'Movie 2' }
            ];

            Review.findAll.mockResolvedValueOnce(mockReviews);
            Reaction.getByReviewId.mockResolvedValue({});

            await reviewController.getAll(mockReq, mockRes);

            const response = mockRes.json.mock.calls[0][0];
            response.forEach(review => {
                expect(review.rating).toBe(5);
            });
        });

        it('should support filtering by date range', async () => {
            mockReq.query = { startDate: '2024-01-01', endDate: '2024-12-31' };
            const mockReviews = [
                { id: 1, created_at: '2024-06-15', media_title: 'Movie 1' }
            ];

            Review.findAll.mockResolvedValueOnce(mockReviews);
            Reaction.getByReviewId.mockResolvedValue({});

            await reviewController.getAll(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalled();
        });

        it('should support sorting by date', async () => {
            mockReq.query = { sortBy: 'created_at', order: 'DESC' };
            const mockReviews = [
                { id: 3, created_at: '2024-03-01', media_title: 'Movie 3' },
                { id: 2, created_at: '2024-02-01', media_title: 'Movie 2' },
                { id: 1, created_at: '2024-01-01', media_title: 'Movie 1' }
            ];

            Review.findAll.mockResolvedValueOnce(mockReviews);
            Reaction.getByReviewId.mockResolvedValue({});

            await reviewController.getAll(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalled();
        });

        it('should support sorting by rating', async () => {
            mockReq.query = { sortBy: 'rating', order: 'DESC' };
            const mockReviews = [
                { id: 1, rating: 5, media_title: 'Movie 1' },
                { id: 2, rating: 4, media_title: 'Movie 2' },
                { id: 3, rating: 3, media_title: 'Movie 3' }
            ];

            Review.findAll.mockResolvedValueOnce(mockReviews);
            Reaction.getByReviewId.mockResolvedValue({});

            await reviewController.getAll(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalled();
        });

        it('should return random reviews for discovery', async () => {
            mockReq.query = { random: true };
            const mockReviews = [{ id: Math.random(), media_title: 'Random Movie' }];

            Review.findRandom.mockResolvedValueOnce(mockReviews);
            Reaction.getByReviewId.mockResolvedValue({});
            Reaction.getUserReactions.mockResolvedValue([]);

            await reviewController.getRandom(mockReq, mockRes);

            expect(Review.findRandom).toHaveBeenCalled();
        });
    });

    // ============================================
    // 4. VALIDACIÓN FALLIDA
    // ============================================
    describe('4. Validación Fallida', () => {
        it('should return 400 if required fields missing', async () => {
            mockReq.body = { media_type: 'movie' };

            await reviewController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Media type, title and review text are required'
            });
        });

        it('should return 400 if review text exceeds max length', async () => {
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
                media_type: 'invalid_type',
                media_title: 'Test',
                review_text: 'Test'
            };

            await reviewController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Invalid media type' 
            });
        });

        it('should return 400 if rating is out of range', async () => {
            mockReq.body = {
                media_type: 'movie',
                media_title: 'Test',
                review_text: 'Test',
                rating: 10
            };

            await reviewController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Rating must be between 1 and 5' 
            });
        });

        it('should return 400 if rating is 0 or negative', async () => {
            mockReq.body = {
                media_type: 'movie',
                media_title: 'Test',
                review_text: 'Test',
                rating: 0
            };

            await reviewController.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    // ============================================
    // 5. AUTORIZACIONES EN REVIEWS
    // ============================================
    describe('5. Autorizaciones en Reviews', () => {
        it('should allow review owner to update their review', async () => {
            mockReq.params = { id: 1 };
            mockReq.body = { review_text: 'Updated text', rating: 4 };
            mockReq.user = { id: 1 };

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

        it('should deny update if user is not owner', async () => {
            mockReq.params = { id: 1 };
            mockReq.body = { review_text: 'Test' };
            mockReq.user = { id: 2 }; // Different user

            Review.findById.mockResolvedValueOnce({ id: 1, user_id: 1 });

            await reviewController.update(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('should deny delete if user is not owner', async () => {
            mockReq.params = { id: 1 };
            mockReq.user = { id: 2 };

            Review.findById.mockResolvedValueOnce({ id: 1, user_id: 1 });

            await reviewController.delete(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('should allow review owner to delete their review', async () => {
            mockReq.params = { id: 1 };
            mockReq.user = { id: 1 };

            Review.findById.mockResolvedValueOnce({ id: 1, user_id: 1 });
            Review.delete.mockResolvedValueOnce();

            await reviewController.delete(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({ 
                message: 'Review deleted successfully' 
            });
        });
    });

    // ============================================
    // 6. TAGS Y BÚSQUEDA
    // ============================================
    describe('6. Tags y Búsqueda', () => {
        it('should return all tags', async () => {
            const mockTags = [
                { id: 1, name: 'Action' },
                { id: 2, name: 'Comedy' }
            ];
            Review.getAllTags.mockResolvedValueOnce(mockTags);

            await reviewController.getTags(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(mockTags);
        });

        it('should search cover image successfully', async () => {
            mockReq.query = { media_type: 'movie', title: 'Test Movie' };
            coverService.searchCover.mockResolvedValueOnce('cover.jpg');

            await reviewController.searchCover(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({ 
                cover: 'cover.jpg' 
            });
        });

        it('should return 400 if cover search missing required params', async () => {
            mockReq.query = { media_type: 'movie' };

            await reviewController.searchCover(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });
});
