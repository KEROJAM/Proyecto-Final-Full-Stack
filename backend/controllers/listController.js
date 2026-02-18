const List = require('../models/List');

const listController = {
    async create(req, res) {
        try {
            const { name, boardId, position } = req.body;
            
            if (!name || !boardId) {
                return res.status(400).json({ error: 'Nombre y boardId son requeridos' });
            }

            const listId = await List.create(name, boardId, position || 0);
            const list = await List.findById(listId);

            res.status(201).json({ message: 'Lista creada', list });
        } catch (error) {
            console.error('Error en create list:', error);
            res.status(500).json({ error: 'Error al crear lista' });
        }
    },

    async getAll(req, res) {
        try {
            const { boardId } = req.query;
            
            if (!boardId) {
                return res.status(400).json({ error: 'Board ID es requerido' });
            }

            const lists = await List.findByBoardId(boardId);
            res.json({ lists });
        } catch (error) {
            console.error('Error en getAll lists:', error);
            res.status(500).json({ error: 'Error al obtener listas' });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'El nombre es requerido' });
            }

            const list = await List.findById(id);
            if (!list) {
                return res.status(404).json({ error: 'Lista no encontrada' });
            }

            await List.update(id, name);
            const updated = await List.findById(id);

            res.json({ message: 'Lista actualizada', list: updated });
        } catch (error) {
            console.error('Error en update list:', error);
            res.status(500).json({ error: 'Error al actualizar lista' });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;

            const list = await List.findById(id);
            if (!list) {
                return res.status(404).json({ error: 'Lista no encontrada' });
            }

            await List.delete(id);
            res.json({ message: 'Lista eliminada' });
        } catch (error) {
            console.error('Error en delete list:', error);
            res.status(500).json({ error: 'Error al eliminar lista' });
        }
    },

    async updatePositions(req, res) {
        try {
            const { updates } = req.body;
            
            if (!Array.isArray(updates)) {
                return res.status(400).json({ error: 'Se requiere un array de actualizaciones' });
            }

            await List.updatePositions(updates);
            res.json({ message: 'Posiciones actualizadas' });
        } catch (error) {
            console.error('Error en updatePositions list:', error);
            res.status(500).json({ error: 'Error al actualizar posiciones' });
        }
    }
};

module.exports = listController;
