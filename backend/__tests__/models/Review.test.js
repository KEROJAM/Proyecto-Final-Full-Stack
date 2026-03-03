const mockQuery = jest.fn();
const mockPool = {
    query: mockQuery,
    connect: jest.fn(() => Promise.resolve({ release: jest.fn() }))
};
jest.mock('../../database/connection', () => async () => mockPool);

const Review = require('../../models/Review');

describe('Review Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery.mockReset();
    });

    describe('create', () => {
        it('should create a new review', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            const result = await Review.create(1, 'movie', 'Test Movie', 'Great movie!', 5, 'cover.jpg');

            expect(result).toBe(1);
            expect(mockQuery).toHaveBeenCalledWith(
                'INSERT INTO reviews (user_id, media_type, media_title, cover, review_text, rating) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                [1, 'movie', 'Test Movie', 'cover.jpg', 'Great movie!', 5]
            );
        });

        it('should create review without rating', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 2 }] });

            const result = await Review.create(1, 'book', 'Test Book', 'Good book!');

            expect(result).toBe(2);
        });
    });

    describe('findById', () => {
        it('should find review by id', async () => {
            const mockReview = { id: 1, media_type: 'movie', media_title: 'Test Movie' };
            mockQuery.mockResolvedValueOnce({ rows: [mockReview] });

            const result = await Review.findById(1);

            expect(result).toEqual(mockReview);
        });
    });

    describe('findAll', () => {
        it('should return all reviews with default limit', async () => {
            const mockReviews = [{ id: 1 }, { id: 2 }];
            mockQuery.mockResolvedValueOnce({ rows: mockReviews });

            const result = await Review.findAll();

            expect(result).toEqual(mockReviews);
        });

        it('should accept custom limit and offset', async () => {
            const mockReviews = [{ id: 1 }];
            mockQuery.mockResolvedValueOnce({ rows: mockReviews });

            await Review.findAll(10, 5);

            expect(mockQuery).toHaveBeenCalled();
        });
    });

    describe('findByUserId', () => {
        it('should find reviews by user id', async () => {
            const mockReviews = [{ id: 1, user_id: 1 }];
            mockQuery.mockResolvedValueOnce({ rows: mockReviews });

            const result = await Review.findByUserId(1);

            expect(result).toEqual(mockReviews);
        });
    });

    describe('findByMediaType', () => {
        it('should find reviews by media type', async () => {
            const mockReviews = [{ id: 1, media_type: 'movie' }];
            mockQuery.mockResolvedValueOnce({ rows: mockReviews });

            const result = await Review.findByMediaType('movie');

            expect(result).toEqual(mockReviews);
        });
    });

    describe('update', () => {
        it('should update review fields', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });

            await Review.update(1, 1, { review_text: 'Updated text', rating: 4 });

            expect(mockQuery).toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('should delete review', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });

            await Review.delete(1, 1);

            expect(mockQuery).toHaveBeenCalledWith(
                'DELETE FROM reviews WHERE id = $1 AND user_id = $2',
                [1, 1]
            );
        });
    });

    describe('addTag', () => {
        it('should add tag to review', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });

            await Review.addTag(1, 1);

            expect(mockQuery).toHaveBeenCalledWith(
                'INSERT INTO review_tag_map (review_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [1, 1]
            );
        });
    });

    describe('removeTag', () => {
        it('should remove tag from review', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });

            await Review.removeTag(1, 1);

            expect(mockQuery).toHaveBeenCalledWith(
                'DELETE FROM review_tag_map WHERE review_id = $1 AND tag_id = $2',
                [1, 1]
            );
        });
    });

    describe('getAllTags', () => {
        it('should return all tags', async () => {
            const mockTags = [{ id: 1, name: 'Action' }, { id: 2, name: 'Comedy' }];
            mockQuery.mockResolvedValueOnce({ rows: mockTags });

            const result = await Review.getAllTags();

            expect(result).toEqual(mockTags);
        });
    });
});
