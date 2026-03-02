const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../../models/User');
jest.mock('../../database/connection', () => ({
    __esModule: true,
    default: Promise.resolve({
        execute: jest.fn()
    })
}));

const User = require('../../models/User');
const authController = require('../../controllers/authController');

describe('authController', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        mockReq = {
            body: {},
            query: {},
            file: null
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            mockReq.body = {
                username: 'testuser',
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };

            User.findByEmail.mockResolvedValueOnce(null);
            User.findByUsername.mockResolvedValueOnce(null);
            User.create.mockResolvedValueOnce(1);
            jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('hashedpassword');
            jest.spyOn(jwt, 'sign').mockImplementationOnce(() => 'mocked_token');

            await authController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Usuario creado exitosamente',
                    token: 'mocked_token',
                    user: expect.objectContaining({
                        id: 1,
                        username: 'testuser'
                    })
                })
            );
        });

        it('should return 400 if fields are missing', async () => {
            mockReq.body = { username: 'testuser' };

            await authController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Todos los campos son requeridos' });
        });

        it('should return 400 if email already exists', async () => {
            mockReq.body = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            User.findByEmail.mockResolvedValueOnce({ id: 1, email: 'test@example.com' });

            await authController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'El email ya está registrado' });
        });

        it('should return 400 if username already exists', async () => {
            mockReq.body = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            User.findByEmail.mockResolvedValueOnce(null);
            User.findByUsername.mockResolvedValueOnce({ id: 1, username: 'testuser' });

            await authController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'El nombre de usuario ya está en uso' });
        });
    });

    describe('login', () => {
        it('should login successfully with correct credentials', async () => {
            mockReq.body = {
                email: 'test@example.com',
                password: 'password123'
            };

            const mockUser = {
                id: 1,
                username: 'testuser',
                name: 'Test',
                email: 'test@example.com',
                password: 'hashedpassword',
                avatar: null
            };

            User.findByEmail.mockResolvedValueOnce(mockUser);
            jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
            jest.spyOn(jwt, 'sign').mockImplementationOnce(() => 'mocked_token');

            await authController.login(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Login exitoso',
                    token: 'mocked_token',
                    user: expect.objectContaining({
                        id: 1,
                        username: 'testuser'
                    })
                })
            );
        });

        it('should return 400 if email or password missing', async () => {
            mockReq.body = { email: 'test@example.com' };

            await authController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Email y contraseña son requeridos' });
        });

        it('should return 401 if user not found', async () => {
            mockReq.body = {
                email: 'notfound@example.com',
                password: 'password123'
            };

            User.findByEmail.mockResolvedValueOnce(null);

            await authController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
        });

        it('should return 401 if password is invalid', async () => {
            mockReq.body = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            User.findByEmail.mockResolvedValueOnce({
                id: 1,
                password: 'hashedpassword'
            });
            jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

            await authController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
        });
    });

    describe('getProfile', () => {
        it('should return user profile', async () => {
            mockReq.userId = 1;
            const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };

            User.findById.mockResolvedValueOnce(mockUser);

            await authController.getProfile(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({ user: mockUser });
        });

        it('should return 404 if user not found', async () => {
            mockReq.userId = 999;
            User.findById.mockResolvedValueOnce(null);

            await authController.getProfile(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Usuario no encontrado' });
        });
    });

    describe('updateAvatar', () => {
        it('should update avatar successfully', async () => {
            mockReq.userId = 1;
            mockReq.file = { filename: 'avatar.jpg' };

            User.updateAvatar.mockResolvedValueOnce();

            await authController.updateAvatar(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Avatar actualizado',
                avatar: '/uploads/avatar.jpg'
            });
        });

        it('should return 400 if no file provided', async () => {
            mockReq.userId = 1;
            mockReq.file = null;

            await authController.updateAvatar(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'No se ha proporcionado ninguna imagen' });
        });
    });

    describe('searchUsers', () => {
        it('should return error if db fails', async () => {
            mockReq.query = { q: 'test' };
            
            await authController.searchUsers(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});
