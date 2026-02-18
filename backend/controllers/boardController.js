const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');

const boardController = {
    async create(req, res) {
        try {
            const { name, description, workspaceId, backgroundColor } = req.body;
            
            if (!name || !workspaceId) {
                return res.status(400).json({ error: 'Nombre y workspace son requeridos' });
            }

            const boardId = await Board.create(name, description, workspaceId, req.userId, backgroundColor);
            const board = await Board.findById(boardId);

            res.status(201).json({ message: 'Tablero creado', board });
        } catch (error) {
            console.error('Error en create board:', error);
            res.status(500).json({ error: 'Error al crear tablero' });
        }
    },

    async getAll(req, res) {
        try {
            const { workspaceId } = req.query;
            
            if (!workspaceId) {
                return res.status(400).json({ error: 'Workspace ID es requerido' });
            }

            const boards = await Board.findByWorkspaceId(workspaceId);
            res.json({ boards });
        } catch (error) {
            console.error('Error en getAll boards:', error);
            res.status(500).json({ error: 'Error al obtener tableros' });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const board = await Board.findById(id);

            if (!board) {
                return res.status(404).json({ error: 'Tablero no encontrado' });
            }

            const isMember = await Board.isMember(id, req.userId);
            if (!isMember) {
                return res.status(403).json({ error: 'No tienes acceso a este tablero' });
            }

            const members = await Board.getMembers(id);
            const lists = await List.findByBoardId(id);

            for (const list of lists) {
                list.tasks = await Task.findByListId(list.id);
            }

            res.json({ board, lists, members });
        } catch (error) {
            console.error('Error en getById board:', error);
            res.status(500).json({ error: 'Error al obtener tablero' });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description, background_color, banner_image, orientation } = req.body;

            const board = await Board.findById(id);
            if (!board) {
                return res.status(404).json({ error: 'Tablero no encontrado' });
            }

            const isMember = await Board.isMember(id, req.userId);
            if (!isMember) {
                return res.status(403).json({ error: 'No tienes acceso a este tablero' });
            }

            await Board.update(id, { 
                name, 
                description, 
                background_color, 
                banner_image, 
                orientation 
            });

            const updated = await Board.findById(id);
            res.json({ message: 'Tablero actualizado', board: updated });
        } catch (error) {
            console.error('Error en update board:', error);
            res.status(500).json({ error: 'Error al actualizar tablero' });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;

            const board = await Board.findById(id);
            if (!board) {
                return res.status(404).json({ error: 'Tablero no encontrado' });
            }

            if (board.owner_id !== req.userId) {
                return res.status(403).json({ error: 'Solo el propietario puede eliminar el tablero' });
            }

            await Board.delete(id);
            res.json({ message: 'Tablero eliminado' });
        } catch (error) {
            console.error('Error en delete board:', error);
            res.status(500).json({ error: 'Error al eliminar tablero' });
        }
    },

    async addMember(req, res) {
        try {
            const { id } = req.params;
            const { userId, role } = req.body;

            const board = await Board.findById(id);
            if (!board) {
                return res.status(404).json({ error: 'Tablero no encontrado' });
            }

            const isMember = await Board.isMember(id, req.userId);
            if (!isMember) {
                return res.status(403).json({ error: 'No tienes permisos para agregar miembros' });
            }

            await Board.addMember(id, userId, role || 'member');
            res.json({ message: 'Miembro agregado al tablero' });
        } catch (error) {
            console.error('Error en addMember board:', error);
            res.status(500).json({ error: 'Error al agregar miembro' });
        }
    },

    async removeMember(req, res) {
        try {
            const { id, userId } = req.params;

            const board = await Board.findById(id);
            if (!board) {
                return res.status(404).json({ error: 'Tablero no encontrado' });
            }

            const isMember = await Board.isMember(id, req.userId);
            if (!isMember) {
                return res.status(403).json({ error: 'No tienes permisos para eliminar miembros' });
            }

            await Board.removeMember(id, userId);
            res.json({ message: 'Miembro eliminado del tablero' });
        } catch (error) {
            console.error('Error en removeMember board:', error);
            res.status(500).json({ error: 'Error al eliminar miembro' });
        }
    },

    async updatePositions(req, res) {
        try {
            const { updates } = req.body;
            
            if (!Array.isArray(updates)) {
                return res.status(400).json({ error: 'Se requiere un array de actualizaciones' });
            }

            await Board.updatePositions(updates);
            res.json({ message: 'Posiciones actualizadas' });
        } catch (error) {
            console.error('Error en updatePositions:', error);
            res.status(500).json({ error: 'Error al actualizar posiciones' });
        }
    },

    async uploadBanner(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen' });
            }

            const { id } = req.params;
            const bannerPath = `/uploads/${req.file.filename}`;

            const board = await Board.findById(id);
            if (!board) {
                return res.status(404).json({ error: 'Tablero no encontrado' });
            }

            const isMember = await Board.isMember(id, req.userId);
            if (!isMember) {
                return res.status(403).json({ error: 'No tienes acceso a este tablero' });
            }

            await Board.update(id, { banner_image: bannerPath });
            res.json({ message: 'Banner actualizado', banner_image: bannerPath });
        } catch (error) {
            console.error('Error en uploadBanner:', error);
            res.status(500).json({ error: 'Error al subir banner' });
        }
    }
};

module.exports = boardController;
