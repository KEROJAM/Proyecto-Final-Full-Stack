const mockExecute = jest.fn();
jest.mock('../../database/connection', () => Promise.resolve({
    execute: mockExecute
}));

const User = require('../../models/User');

describe('User Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockExecute.mockReset();
    });

    describe('create', () => {
        it('should create a new user', async () => {
            mockExecute.mockResolvedValueOnce([{ insertId: 1 }]);

            const result = await User.create('testuser', 'Test User', 'test@example.com', 'hashedpassword');

            expect(result).toBe(1);
            expect(mockExecute).toHaveBeenCalledWith(
                'INSERT INTO users (username, name, email, password) VALUES (?, ?, ?, ?)',
                ['testuser', 'Test User', 'test@example.com', 'hashedpassword']
            );
        });
    });

    describe('findByEmail', () => {
        it('should find user by email', async () => {
            const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
            mockExecute.mockResolvedValueOnce([[mockUser]]);

            const result = await User.findByEmail('test@example.com');

            expect(result).toEqual(mockUser);
        });

        it('should return undefined if user not found', async () => {
            mockExecute.mockResolvedValueOnce([[]]);

            const result = await User.findByEmail('notfound@example.com');

            expect(result).toBeUndefined();
        });
    });

    describe('findById', () => {
        it('should find user by id', async () => {
            const mockUser = { id: 1, username: 'testuser', name: 'Test', email: 'test@example.com' };
            mockExecute.mockResolvedValueOnce([[mockUser]]);

            const result = await User.findById(1);

            expect(result).toEqual(mockUser);
        });
    });

    describe('findByUsername', () => {
        it('should find user by username', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            mockExecute.mockResolvedValueOnce([[mockUser]]);

            const result = await User.findByUsername('testuser');

            expect(result).toEqual(mockUser);
        });
    });

    describe('updateAvatar', () => {
        it('should update user avatar', async () => {
            mockExecute.mockResolvedValueOnce([{}]);

            await User.updateAvatar(1, '/uploads/avatar.jpg');

            expect(mockExecute).toHaveBeenCalledWith(
                'UPDATE users SET avatar = ? WHERE id = ?',
                ['/uploads/avatar.jpg', 1]
            );
        });
    });
});
