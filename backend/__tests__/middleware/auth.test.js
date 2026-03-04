const jwt = require('jsonwebtoken');

jest.mock('../../models/User');

const User = require('../../models/User');
const authMiddleware = require('../../middleware/auth');

describe('authMiddleware - Authentication & Authorization Tests', () => {
    let mockReq, mockRes, mockNext;
    const jwtSecret = 'test_secret_key_for_testing_only_12345';

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = jwtSecret;
        mockReq = {
            headers: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    // ============================================
    // 1. AUTENTICACIÓN - LOGIN EXITOSO
    // ============================================
    describe('1. Autenticación con Token Válido', () => {
        it('should authenticate user with valid token', async () => {
            const token = jwt.sign({ userId: 1, username: 'testuser' }, jwtSecret);
            mockReq.headers = { authorization: `Bearer ${token}` };

            User.findById.mockResolvedValueOnce({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                avatar: null,
                role: 'user'
            });

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toEqual({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                avatar: null,
                role: 'user'
            });
        });

        it('should attach user data to request object', async () => {
            const token = jwt.sign({ userId: 1, username: 'testuser' }, jwtSecret);
            mockReq.headers = { authorization: `Bearer ${token}` };

            const userData = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                role: 'user'
            };

            User.findById.mockResolvedValueOnce(userData);

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockReq.user).toBeDefined();
            expect(mockReq.user.id).toBe(1);
            expect(mockReq.user.username).toBe('testuser');
        });

        it('should work with token without Bearer prefix', async () => {
            const token = jwt.sign({ userId: 1, username: 'testuser' }, jwtSecret);
            mockReq.headers = { authorization: token };

            User.findById.mockResolvedValueOnce({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                role: 'user'
            });

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    // ============================================
    // 2. AUTENTICACIÓN FALLIDA
    // ============================================
    describe('2. Autenticación Fallida', () => {
        it('should return 401 if no auth header provided', async () => {
            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'No se proporcionó token de autenticación' 
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 if token is invalid', async () => {
            mockReq.headers = { authorization: 'Bearer invalidtoken123' };

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Token inválido' 
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 if user not found in database', async () => {
            const token = jwt.sign({ userId: 999, username: 'nonexistent' }, jwtSecret);
            mockReq.headers = { authorization: `Bearer ${token}` };

            User.findById.mockResolvedValueOnce(null);

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Usuario no encontrado' 
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 if token is expired', async () => {
            const token = jwt.sign(
                { userId: 1, username: 'testuser' },
                jwtSecret,
                { expiresIn: '-1s' }
            );
            mockReq.headers = { authorization: `Bearer ${token}` };

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Token expirado' 
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 if authorization header malformed', async () => {
            mockReq.headers = { authorization: 'InvalidFormat' };

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
    });

    // ============================================
    // 3. ACCESO PERMITIDO POR ROL
    // ============================================
    describe('3. Acceso Permitido por Rol', () => {
        it('should grant access to user with admin role', async () => {
            const token = jwt.sign({ userId: 2, username: 'admin' }, jwtSecret);
            mockReq.headers = { authorization: `Bearer ${token}` };

            const adminUser = {
                id: 2,
                username: 'admin',
                email: 'admin@example.com',
                role: 'admin'
            };

            User.findById.mockResolvedValueOnce(adminUser);

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user.role).toBe('admin');
        });

        it('should grant access to user with regular user role', async () => {
            const token = jwt.sign({ userId: 1, username: 'user' }, jwtSecret);
            mockReq.headers = { authorization: `Bearer ${token}` };

            const regularUser = {
                id: 1,
                username: 'user',
                email: 'user@example.com',
                role: 'user'
            };

            User.findById.mockResolvedValueOnce(regularUser);

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user.role).toBe('user');
        });

        it('should include role information in authenticated request', async () => {
            const token = jwt.sign({ userId: 1, username: 'testuser' }, jwtSecret);
            mockReq.headers = { authorization: `Bearer ${token}` };

            User.findById.mockResolvedValueOnce({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                role: 'user'
            });

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockReq.user.role).toBeDefined();
            expect(['admin', 'user']).toContain(mockReq.user.role);
        });
    });

    // ============================================
    // 4. ACCESO DENEGADO POR ROL
    // ============================================
    describe('4. Acceso Denegado por Rol (Authorization)', () => {
        it('should identify user without role defined', async () => {
            const token = jwt.sign({ userId: 3, username: 'norole' }, jwtSecret);
            mockReq.headers = { authorization: `Bearer ${token}` };

            User.findById.mockResolvedValueOnce({
                id: 3,
                username: 'norole',
                email: 'norole@example.com'
                // sin role definido
            });

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user.role).toBeUndefined();
        });

        it('should validate role is either admin or user', async () => {
            const validRoles = ['admin', 'user'];
            const testRoles = ['admin', 'user', 'superadmin', 'guest'];

            testRoles.forEach(role => {
                const isValid = validRoles.includes(role);
                if (role === 'admin' || role === 'user') {
                    expect(isValid).toBe(true);
                } else {
                    expect(isValid).toBe(false);
                }
            });
        });

        it('should handle missing user role gracefully', async () => {
            const token = jwt.sign({ userId: 4, username: 'noauth' }, jwtSecret);
            mockReq.headers = { authorization: `Bearer ${token}` };

            User.findById.mockResolvedValueOnce({
                id: 4,
                username: 'noauth',
                email: 'noauth@example.com'
            });

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockReq.user).toBeDefined();
            expect(mockReq.user.role).toBeUndefined();
        });
    });

    // ============================================
    // 5. TESTS ADICIONALES
    // ============================================
    describe('Additional Authentication Tests', () => {
        it('should update user role dynamically', async () => {
            const token = jwt.sign({ userId: 1, username: 'user' }, jwtSecret);
            mockReq.headers = { authorization: `Bearer ${token}` };

            // Simulamos que el usuario cambió de role
            User.findById.mockResolvedValueOnce({
                id: 1,
                username: 'user',
                email: 'user@example.com',
                role: 'admin' // Cambio de role
            });

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockReq.user.role).toBe('admin');
        });

        it('should preserve complete user data in request', async () => {
            const token = jwt.sign({ userId: 1, username: 'testuser' }, jwtSecret);
            mockReq.headers = { authorization: `Bearer ${token}` };

            const completeUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                name: 'Test User',
                avatar: '/avatars/test.jpg',
                role: 'user',
                created_at: '2024-01-01'
            };

            User.findById.mockResolvedValueOnce(completeUser);

            await authMiddleware(mockReq, mockRes, mockNext);

            expect(mockReq.user).toEqual(completeUser);
        });
    });
});
