const mockQuery = jest.fn();
const mockPool = {
    query: mockQuery,
    connect: jest.fn(() => Promise.resolve({ release: jest.fn() }))
};
jest.mock('../../database/connection', () => async () => mockPool);

const User = require('../../models/User');

describe('User Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery.mockReset();
    });

    describe('create', () => {
        it('should create a new user', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            const result = await User.create('testuser', 'Test User', 'test@example.com', 'hashedpassword');

            expect(result).toBe(1);
            expect(mockQuery).toHaveBeenCalledWith(
                'INSERT INTO users (username, name, email, password) VALUES ($1, $2, $3, $4) RETURNING id',
                ['testuser', 'Test User', 'test@example.com', 'hashedpassword']
            );
        });
    });

    describe('findByEmail', () => {
        it('should find user by email', async () => {
            const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
            mockQuery.mockResolvedValueOnce({ rows: [mockUser] });

            const result = await User.findByEmail('test@example.com');

            expect(result).toEqual(mockUser);
        });

        it('should return undefined if user not found', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });

            const result = await User.findByEmail('notfound@example.com');

            expect(result).toBeUndefined();
        });
    });

    describe('findById', () => {
        it('should find user by id', async () => {
            const mockUser = { id: 1, username: 'testuser', name: 'Test', email: 'test@example.com' };
            mockQuery.mockResolvedValueOnce({ rows: [mockUser] });

            const result = await User.findById(1);

            expect(result).toEqual(mockUser);
        });
    });

    describe('findByUsername', () => {
        it('should find user by username', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            mockQuery.mockResolvedValueOnce({ rows: [mockUser] });

            const result = await User.findByUsername('testuser');

            expect(result).toEqual(mockUser);
        });
    });

    describe('updateAvatar', () => {
        it('should update user avatar', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });

            await User.updateAvatar(1, '/uploads/avatar.jpg');

            expect(mockQuery).toHaveBeenCalledWith(
                'UPDATE users SET avatar = $1 WHERE id = $2',
                ['/uploads/avatar.jpg', 1]
            );
        });
    });
});
