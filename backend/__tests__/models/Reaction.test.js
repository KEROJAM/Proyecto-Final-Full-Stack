const mockExecute = jest.fn();
jest.mock('../../database/connection', () => Promise.resolve({
    execute: mockExecute
}));

const Reaction = require('../../models/Reaction');

describe('Reaction Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockExecute.mockReset();
    });

    describe('add', () => {
        it('should add a reaction', async () => {
            mockExecute.mockResolvedValueOnce([{ insertId: 1 }]);

            await Reaction.add(1, 1, 'heart');

            expect(mockExecute).toHaveBeenCalledWith(
                'INSERT INTO reactions (review_id, user_id, emoji_type) VALUES (?, ?, ?)',
                [1, 1, 'heart']
            );
        });
    });

    describe('remove', () => {
        it('should remove a reaction', async () => {
            mockExecute.mockResolvedValueOnce([{}]);

            await Reaction.remove(1, 1, 'heart');

            expect(mockExecute).toHaveBeenCalledWith(
                'DELETE FROM reactions WHERE review_id = ? AND user_id = ? AND emoji_type = ?',
                [1, 1, 'heart']
            );
        });
    });

    describe('toggle', () => {
        it('should add reaction if not exists', async () => {
            mockExecute
                .mockResolvedValueOnce([[]])
                .mockResolvedValueOnce([{}]);

            const result = await Reaction.toggle(1, 1, 'heart');

            expect(result).toBe(true);
        });

        it('should remove reaction if exists', async () => {
            mockExecute
                .mockResolvedValueOnce([[{ id: 1 }]])
                .mockResolvedValueOnce([{}]);

            const result = await Reaction.toggle(1, 1, 'heart');

            expect(result).toBe(false);
        });
    });

    describe('getByReviewId', () => {
        it('should return reaction counts by type', async () => {
            const mockRows = [
                { emoji_type: 'heart', count: 3, user_ids: '1,2,3' },
                { emoji_type: 'laughing', count: 1, user_ids: '1' }
            ];
            mockExecute.mockResolvedValueOnce([mockRows]);

            const result = await Reaction.getByReviewId(1);

            expect(result).toEqual({
                heart: 3,
                laughing: 1,
                crying: 0,
                surprised: 0
            });
        });

        it('should return zero counts when no reactions', async () => {
            mockExecute.mockResolvedValueOnce([[]]);

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
            mockExecute.mockResolvedValueOnce([mockRows]);

            const result = await Reaction.getUserReactions(1, 1);

            expect(result).toEqual(['heart', 'laughing']);
        });

        it('should return empty array when no reactions', async () => {
            mockExecute.mockResolvedValueOnce([[]]);

            const result = await Reaction.getUserReactions(1, 1);

            expect(result).toEqual([]);
        });
    });
});
