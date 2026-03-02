const jwt = require('jsonwebtoken');

jest.mock('../../models/User');

const User = require('../../models/User');
const authMiddleware = require('../../middleware/auth');

describe('authMiddleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            headers: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    it('should call next() with valid token', async () => {
        const token = jwt.sign({ userId: 1, username: 'testuser' }, 'your_super_secret_jwt_key_here_change_in_production');
        mockReq.headers = { authorization: `Bearer ${token}` };

        User.findById.mockResolvedValueOnce({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            avatar: null
        });

        await authMiddleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.user).toEqual({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            avatar: null
        });
    });

    it('should return 401 if no auth header', async () => {
        await authMiddleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'No se proporcionó token de autenticación' });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
        mockReq.headers = { authorization: 'Bearer invalidtoken' };

        await authMiddleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token inválido' });
    });

    it('should return 401 if user not found', async () => {
        const token = jwt.sign({ userId: 999, username: 'testuser' }, 'your_super_secret_jwt_key_here_change_in_production');
        mockReq.headers = { authorization: `Bearer ${token}` };

        User.findById.mockResolvedValueOnce(null);

        await authMiddleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Usuario no encontrado' });
    });

    it('should return 401 if token is expired', async () => {
        const token = jwt.sign(
            { userId: 1, username: 'testuser' },
            'your_super_secret_jwt_key_here_change_in_production',
            { expiresIn: '-1s' }
        );
        mockReq.headers = { authorization: `Bearer ${token}` };

        await authMiddleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token expirado' });
    });

    it('should work with token without Bearer prefix', async () => {
        const token = jwt.sign({ userId: 1, username: 'testuser' }, 'your_super_secret_jwt_key_here_change_in_production');
        mockReq.headers = { authorization: token };

        User.findById.mockResolvedValueOnce({
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            avatar: null
        });

        await authMiddleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });
});
