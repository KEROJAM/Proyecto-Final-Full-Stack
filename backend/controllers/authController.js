const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJWTSecret, getJWTSecretInfo } = require('../config/jwt');

const authController = {
    async register(req, res) {
        try {
            const { username, name, email, password } = req.body;
            console.log('[REGISTER] Iniciando registro para:', email);

            if (!username || !email || !password) {
                console.warn('[REGISTER] Campos faltantes:', { username: !!username, email: !!email, password: !!password });
                return res.status(400).json({ error: 'Todos los campos son requeridos' });
            }

            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                console.warn('[REGISTER] Email ya existe:', email);
                return res.status(400).json({ error: 'El email ya está registrado' });
            }

            const existingUsername = await User.findByUsername(username);
            if (existingUsername) {
                console.warn('[REGISTER] Username ya existe:', username);
                return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
            }

            console.log('[REGISTER] Hasheando password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            
            console.log('[REGISTER] Creando usuario en BD...');
            const userId = await User.create(username, name || null, email, hashedPassword);
            console.log('[REGISTER] Usuario creado con ID:', userId);

            console.log('[REGISTER] Generando JWT...');
            const jwtSecret = getJWTSecret();
            const token = jwt.sign({ userId, username }, jwtSecret, { expiresIn: '24h' });

            console.log('[REGISTER] ✅ Registro exitoso para:', email);
            res.status(201).json({
                message: 'Usuario creado exitosamente',
                token,
                user: { id: userId, username, name, email }
            });
        } catch (error) {
            console.error('[REGISTER] ❌ Error en register:', {
                message: error.message,
                code: error.code,
                detail: error.detail,
                stack: error.stack
            });
            res.status(500).json({ 
                error: 'Error al registrar usuario',
                details: error.message
            });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;
            console.log('[LOGIN] Iniciando login para:', email);

            if (!email || !password) {
                console.warn('[LOGIN] Campos faltantes');
                return res.status(400).json({ error: 'Email y contraseña son requeridos' });
            }

            const user = await User.findByEmail(email);
            if (!user) {
                console.warn('[LOGIN] Usuario no encontrado:', email);
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                console.warn('[LOGIN] Password inválido para:', email);
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const jwtSecret = getJWTSecret();
            const token = jwt.sign({ userId: user.id, username: user.username }, jwtSecret, { expiresIn: '24h' });

            const jwtInfo = getJWTSecretInfo();
            console.log('[LOGIN] ✅ Login exitoso para:', user.id, '|', jwtInfo.message);

            res.json({
                message: 'Login exitoso',
                token,
                user: { id: user.id, username: user.username, name: user.name, email: user.email, avatar: user.avatar, role: user.role || 'user' }
            });
        } catch (error) {
            console.error('[LOGIN] ❌ Error en login:', error.message);
            res.status(500).json({ 
                error: 'Error al iniciar sesión',
                details: error.message
            });
        }
    },

    async getProfile(req, res) {
        try {
            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            res.json({ user });
        } catch (error) {
            console.error('Error en getProfile:', error);
            res.status(500).json({ error: 'Error al obtener perfil' });
        }
    },

    async updateAvatar(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen' });
            }

            const avatarPath = `/uploads/${req.file.filename}`;
            await User.updateAvatar(req.userId, avatarPath);

            res.json({ message: 'Avatar actualizado', avatar: avatarPath });
        } catch (error) {
            console.error('Error en updateAvatar:', error);
            res.status(500).json({ error: 'Error al actualizar avatar' });
        }
    },

    async searchUsers(req, res) {
        try {
            const { q } = req.query;
            const db = await (await require('../database/connection'))();
            
            const result = await db.query(
                'SELECT id, username, email, avatar FROM users WHERE username LIKE $1 OR email LIKE $2 LIMIT 10',
                [`%${q}%`, `%${q}%`]
            );
            
            res.json({ users: result.rows });
        } catch (error) {
            console.error('Error en searchUsers:', error);
            res.status(500).json({ error: 'Error al buscar usuarios' });
        }
    }
};

module.exports = authController;
