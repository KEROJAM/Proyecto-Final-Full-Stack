const Task = require('../models/Task');

const taskController = {
    async create(req, res) {
        try {
            const { title, description, listId, dueDate, position } = req.body;
            
            if (!title || !listId) {
                return res.status(400).json({ error: 'Título y listId son requeridos' });
            }

            const taskId = await Task.create(title, description, listId, dueDate, position || 0);
            const task = await Task.findById(taskId);

            res.status(201).json({ message: 'Tarea creada', task });
        } catch (error) {
            console.error('Error en create task:', error);
            res.status(500).json({ error: 'Error al crear tarea' });
        }
    },

    async getAll(req, res) {
        try {
            const { listId, boardId } = req.query;
            
            let tasks;
            if (listId) {
                tasks = await Task.findByListId(listId);
            } else if (boardId) {
                tasks = await Task.findByBoardId(boardId);
            } else {
                return res.status(400).json({ error: 'listId o boardId es requerido' });
            }

            res.json({ tasks });
        } catch (error) {
            console.error('Error en getAll tasks:', error);
            res.status(500).json({ error: 'Error al obtener tareas' });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const task = await Task.findById(id);

            if (!task) {
                return res.status(404).json({ error: 'Tarea no encontrada' });
            }

            const members = await Task.getMembers(id);
            res.json({ task, members });
        } catch (error) {
            console.error('Error en getById task:', error);
            res.status(500).json({ error: 'Error al obtener tarea' });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { title, description, due_date, completed, list_id, position } = req.body;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({ error: 'Tarea no encontrada' });
            }

            await Task.update(id, { 
                title, 
                description, 
                due_date, 
                completed, 
                list_id, 
                position 
            });

            const updated = await Task.findById(id);
            res.json({ message: 'Tarea actualizada', task: updated });
        } catch (error) {
            console.error('Error en update task:', error);
            res.status(500).json({ error: 'Error al actualizar tarea' });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({ error: 'Tarea no encontrada' });
            }

            await Task.delete(id);
            res.json({ message: 'Tarea eliminada' });
        } catch (error) {
            console.error('Error en delete task:', error);
            res.status(500).json({ error: 'Error al eliminar tarea' });
        }
    },

    async addMember(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.body;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({ error: 'Tarea no encontrada' });
            }

            await Task.addMember(id, userId);
            res.json({ message: 'Miembro agregado a la tarea' });
        } catch (error) {
            console.error('Error en addMember task:', error);
            res.status(500).json({ error: 'Error al agregar miembro' });
        }
    },

    async removeMember(req, res) {
        try {
            const { id, userId } = req.params;

            await Task.removeMember(id, userId);
            res.json({ message: 'Miembro eliminado de la tarea' });
        } catch (error) {
            console.error('Error en removeMember task:', error);
            res.status(500).json({ error: 'Error al eliminar miembro' });
        }
    },

    async updatePositions(req, res) {
        try {
            const { updates } = req.body;
            
            if (!Array.isArray(updates)) {
                return res.status(400).json({ error: 'Se requiere un array de actualizaciones' });
            }

            await Task.updatePositions(updates);
            res.json({ message: 'Posiciones actualizadas' });
        } catch (error) {
            console.error('Error en updatePositions task:', error);
            res.status(500).json({ error: 'Error al actualizar posiciones' });
        }
    },

    async getCalendarData(req, res) {
        try {
            const { startDate, endDate } = req.query;
            
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'startDate y endDate son requeridos' });
            }

            const taskCounts = await Task.getTaskCountByDate(startDate, endDate);
            const tasks = await Task.findByDateRange(startDate, endDate);

            res.json({ taskCounts, tasks });
        } catch (error) {
            console.error('Error en getCalendarData:', error);
            res.status(500).json({ error: 'Error al obtener datos del calendario' });
        }
    },

    async getUserTasks(req, res) {
        try {
            const { startDate, endDate } = req.query;
            
            const tasks = await Task.findByUserId(req.userId, startDate, endDate);
            res.json({ tasks });
        } catch (error) {
            console.error('Error en getUserTasks:', error);
            res.status(500).json({ error: 'Error al obtener tareas del usuario' });
        }
    }
};

module.exports = taskController;
