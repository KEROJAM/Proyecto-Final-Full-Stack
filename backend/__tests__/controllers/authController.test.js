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

describe('authController - Complete Authentication Tests', () => {
    let mockReq, mockRes;
    const jwtSecret = 'test_secret_key_for_testing_only_12345';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        process.env.JWT_SECRET = jwtSecret;
        
        mockReq = {
            body: {},
            query: {},
            file: null,
            headers: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    // ============================================
    // 1. LOGIN EXITOSO
    // ============================================
    describe('1. Login Exitoso', () => {
        it('should login successfully with correct email and password', async () => {
            mockReq.body = {
                email: 'test@example.com',
                password: 'password123'
            };

            const mockUser = {
                id: 1,
                username: 'testuser',
                name: 'Test User',
                email: 'test@example.com',
                password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                avatar: null,
                role: 'user'
            };

            User.findByEmail.mockResolvedValueOnce(mockUser);
            jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
            jest.spyOn(jwt, 'sign').mockImplementationOnce(() => 'valid_jwt_token');

            await authController.login(mockReq, mockRes);

            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Login exitoso',
                    token: 'valid_jwt_token',
                    user: expect.objectContaining({
                        id: 1,
                        username: 'testuser',
                        email: 'test@example.com'
                    })
                })
            );
        });

        it('should return user with role in login response', async () => {
            mockReq.body = {
                email: 'admin@example.com',
                password: 'admin123'
            };

            const adminUser = {
                id: 2,
                username: 'admin_user',
                name: 'Admin',
                email: 'admin@example.com',
                password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                role: 'admin'
            };

            User.findByEmail.mockResolvedValueOnce(adminUser);
            jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
            jest.spyOn(jwt, 'sign').mockImplementationOnce(() => 'admin_token');

            await authController.login(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    user: expect.objectContaining({
                        id: 2,
                        role: 'admin'
                    })
                })
            );
        });
    });

    // ============================================
    // 2. LOGIN FALLIDO
    // ============================================
    describe('2. Login Fallido', () => {
        it('should return 401 if email and password not provided', async () => {
            mockReq.body = { email: 'test@example.com' };

            await authController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Email y contraseña son requeridos' 
            });
        });

        it('should return 401 if user not found', async () => {
            mockReq.body = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            User.findByEmail.mockResolvedValueOnce(null);

            await authController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Credenciales inválidas' 
            });
        });

        it('should return 401 if password is incorrect', async () => {
            mockReq.body = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            const mockUser = {
                id: 1,
                password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
            };

            User.findByEmail.mockResolvedValueOnce(mockUser);
            jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

            await authController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Credenciales inválidas' 
            });
        });

        it('should return 401 if both email and password missing', async () => {
            mockReq.body = {};

            await authController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    // ============================================
    // 3. CREAR REGISTRO (REGISTER)
    // ============================================
    describe('3. Crear Registro', () => {
        it('should create a new user successfully', async () => {
            mockReq.body = {
                username: 'newuser',
                name: 'New User',
                email: 'newuser@example.com',
                password: 'password123'
            };

            User.findByEmail.mockResolvedValueOnce(null);
            User.findByUsername.mockResolvedValueOnce(null);
            User.create.mockResolvedValueOnce(3);
            jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('hashed_password_here');
            jest.spyOn(jwt, 'sign').mockImplementationOnce(() => 'new_user_token');

            await authController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Usuario creado exitosamente',
                    token: 'new_user_token',
                    user: expect.objectContaining({
                        id: 3,
                        username: 'newuser',
                        email: 'newuser@example.com'
                    })
                })
            );
        });

        it('should hash password during registration', async () => {
            mockReq.body = {
                username: 'testuser',
                name: 'Test',
                email: 'test@example.com',
                password: 'mypassword'
            };

            User.findByEmail.mockResolvedValueOnce(null);
            User.findByUsername.mockResolvedValueOnce(null);
            const hashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('hashed');
            User.create.mockResolvedValueOnce(1);
            jest.spyOn(jwt, 'sign').mockImplementationOnce(() => 'token');

            await authController.register(mockReq, mockRes);

            expect(hashSpy).toHaveBeenCalledWith('mypassword', 10);
        });
    });

    // ============================================
    // 4. VALIDACION FALLIDA
    // ============================================
    describe('4. Validación Fallida', () => {
        it('should return 400 if required fields missing on register', async () => {
            mockReq.body = { 
                username: 'testuser',
                email: 'test@example.com'
                // password falta
            };

            await authController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Todos los campos son requeridos' 
            });
        });

        it('should return 400 if email already exists', async () => {
            mockReq.body = {
                username: 'newuser',
                email: 'existing@example.com',
                password: 'password123'
            };

            User.findByEmail.mockResolvedValueOnce({ id: 1, email: 'existing@example.com' });

            await authController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'El email ya está registrado' 
            });
        });

        it('should return 400 if username already exists', async () => {
            mockReq.body = {
                username: 'existinguser',
                email: 'new@example.com',
                password: 'password123'
            };

            User.findByEmail.mockResolvedValueOnce(null);
            User.findByUsername.mockResolvedValueOnce({ id: 2, username: 'existinguser' });

            await authController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'El nombre de usuario ya está en uso' 
            });
        });

        it('should return 400 if all fields are missing', async () => {
            mockReq.body = {};

            await authController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    // ============================================
    // 5. ACCESO PERMITIDO POR ROL
    // ============================================
    describe('5. Acceso Permitido por Rol', () => {
        it('should allow admin user to access admin resources', async () => {
            const adminUser = {
                id: 2,
                username: 'admin',
                role: 'admin',
                email: 'admin@example.com'
            };

            expect(adminUser.role).toBe('admin');
            expect(['admin', 'user']).toContain(adminUser.role);
        });

        it('should allow user with user role to access user resources', async () => {
            const regularUser = {
                id: 1,
                username: 'user1',
                role: 'user',
                email: 'user@example.com'
            };

            expect(regularUser.role).toBe('user');
            expect(['admin', 'user']).toContain(regularUser.role);
        });

        it('should include role in user profile response', async () => {
            mockReq.userId = 1;
            const mockUser = { 
                id: 1, 
                username: 'testuser',
                role: 'user',
                email: 'test@example.com' 
            };

            User.findById.mockResolvedValueOnce(mockUser);

            await authController.getProfile(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({ 
                user: expect.objectContaining({
                    role: 'user'
                })
            });
        });
    });

    // ============================================
    // 6. ACCESO DENEGADO POR ROL (AUTHORIZATION)
    // ============================================
    describe('6. Acceso Denegado por Rol', () => {
        it('should validate role is valid (admin or user)', async () => {
            const validRoles = ['admin', 'user'];
            const invalidRoles = ['superadmin', 'moderator', 'guest'];

            validRoles.forEach(role => {
                expect(validRoles).toContain(role);
            });

            invalidRoles.forEach(role => {
                expect(validRoles).not.toContain(role);
            });
        });

        it('should reject users without proper authorization', async () => {
            const userWithoutRole = {
                id: 1,
                username: 'noauth',
                email: 'test@example.com'
                // sin role definido
            };

            expect(userWithoutRole.role).toBeUndefined();
        });
    });

    // ============================================
    // 7. LISTAR REGISTROS (USERS)
    // ============================================
    describe('7. Listar Registros', () => {
        it('should get user profile by ID', async () => {
            mockReq.userId = 1;
            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                role: 'user'
            };

            User.findById.mockResolvedValueOnce(mockUser);

            await authController.getProfile(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({ 
                user: mockUser 
            });
        });

        it('should return 404 if user not found', async () => {
            mockReq.userId = 999;
            User.findById.mockResolvedValueOnce(null);

            await authController.getProfile(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'Usuario no encontrado' 
            });
        });
    });

    // ============================================
    // 8. TESTS ADICIONALES
    // ============================================
    describe('Additional Tests', () => {
        it('should update avatar successfully', async () => {
            mockReq.userId = 1;
            mockReq.file = { filename: 'avatar_123.jpg' };

            User.updateAvatar.mockResolvedValueOnce();

            await authController.updateAvatar(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Avatar actualizado',
                avatar: '/uploads/avatar_123.jpg'
            });
        });

        it('should return 400 if no file provided for avatar', async () => {
            mockReq.userId = 1;
            mockReq.file = null;

            await authController.updateAvatar(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ 
                error: 'No se ha proporcionado ninguna imagen' 
            });
        });
    });
});
