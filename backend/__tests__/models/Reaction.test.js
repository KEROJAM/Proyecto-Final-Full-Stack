const mockQuery = jest.fn();
const mockPool = {
    query: mockQuery,
    connect: jest.fn(() => Promise.resolve({ release: jest.fn() }))
};
jest.mock('../../database/connection', () => async () => mockPool);

const Reaction = require('../../models/Reaction');

describe('Reaction Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery.mockReset();
    });

    describe('add', () => {
        it('should add a reaction', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });

            await Reaction.add(1, 1, 'heart');

            expect(mockQuery).toHaveBeenCalledWith(
                'INSERT INTO reactions (review_id, user_id, emoji_type) VALUES ($1, $2, $3)',
                [1, 1, 'heart']
            );
        });
    });

    describe('remove', () => {
        it('should remove a reaction', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });

            await Reaction.remove(1, 1, 'heart');

            expect(mockQuery).toHaveBeenCalledWith(
                'DELETE FROM reactions WHERE review_id = $1 AND user_id = $2 AND emoji_type = $3',
                [1, 1, 'heart']
            );
        });
    });

    describe('toggle', () => {
        it('should add reaction if not exists', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] });

            const result = await Reaction.toggle(1, 1, 'heart');

            expect(result).toBe(true);
        });

        it('should remove reaction if exists', async () => {
            mockQuery
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })
                .mockResolvedValueOnce({ rows: [] });

            const result = await Reaction.toggle(1, 1, 'heart');

            expect(result).toBe(false);
        });
    });

    describe('getByReviewId', () => {
        it('should return reaction counts by type', async () => {
            const mockRows = [
                { emoji_type: 'heart', count: '3' },
                { emoji_type: 'laughing', count: '1' }
            ];
            mockQuery.mockResolvedValueOnce({ rows: mockRows });

            const result = await Reaction.getByReviewId(1);

            expect(result).toEqual({
                heart: 3,
                laughing: 1,
                crying: 0,
                surprised: 0
            });
        });

        it('should return zero counts when no reactions', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });

            const result = await Reaction.getByReviewId(1);

            expect(result).toEqual({
                heart: 0,
                laughing: 0,
                crying: 0,
                surprised: 0
            });
        });
    });

    describe('getUserReactions', () => {
        it('should return user reactions for a review', async () => {
            const mockRows = [
                { emoji_type: 'heart' },
                { emoji_type: 'laughing' }
            ];
            mockQuery.mockResolvedValueOnce({ rows: mockRows });

            const result = await Reaction.getUserReactions(1, 1);

            expect(result).toEqual(['heart', 'laughing']);
        });

        it('should return empty array when no reactions', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });

            const result = await Reaction.getUserReactions(1, 1);

            expect(result).toEqual([]);
        });
    });
});
