const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';

const authController = {
    async register(req, res) {
        try {
            const { username, email, password } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({ error: 'Todos los campos son requeridos' });
            }

            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }

            const existingUsername = await User.findByUsername(username);
            if (existingUsername) {
                return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = await User.create(username, email, hashedPassword);

            const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '24h' });

            res.status(201).json({
                message: 'Usuario creado exitosamente',
                token,
                user: { id: userId, username, email }
            });
        } catch (error) {
            console.error('Error en register:', error);
            res.status(500).json({ error: 'Error al registrar usuario' });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email y contraseña son requeridos' });
            }

            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

            res.json({
                message: 'Login exitoso',
                token,
                user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar }
            });
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ error: 'Error al iniciar sesión' });
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
            const db = require('../database/connection');
            
            const [rows] = await db.execute(
                'SELECT id, username, email, avatar FROM users WHERE username LIKE ? OR email LIKE ? LIMIT 10',
                [`%${q}%`, `%${q}%`]
            );
            
            res.json({ users: rows });
        } catch (error) {
            console.error('Error en searchUsers:', error);
            res.status(500).json({ error: 'Error al buscar usuarios' });
        }
    }
};

module.exports = authController;
