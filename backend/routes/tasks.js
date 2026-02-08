const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const authMiddleware = require('../middleware/auth');

// Obtener todas las tareas (público)
router.get('/', async (req, res, next) => {
  try {
    const [tasks] = await db.execute(
      'SELECT * FROM tasks ORDER BY created_at DESC'
    );
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Obtener tareas del usuario autenticado
router.get('/my-tasks', authMiddleware, async (req, res, next) => {
  try {
    const [tasks] = await db.execute(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Crear nueva tarea (requiere autenticación)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }

    const [result] = await db.execute(
      'INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)',
      [title, description || '', req.user.id]
    );

    res.status(201).json({
      message: 'Tarea creada exitosamente',
      id: result.insertId
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar tarea (requiere autenticación)
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    // Verificar que la tarea pertenece al usuario
    const [tasks] = await db.execute(
      'SELECT user_id FROM tasks WHERE id = ?',
      [id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    if (tasks[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta tarea' });
    }

    const [result] = await db.execute(
      'UPDATE tasks SET title = ?, description = ?, completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, completed || false, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json({ message: 'Tarea actualizada exitosamente' });
  } catch (error) {
    next(error);
  }
});

// Eliminar tarea (requiere autenticación)
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que la tarea pertenece al usuario
    const [tasks] = await db.execute(
      'SELECT user_id FROM tasks WHERE id = ?',
      [id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    if (tasks[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta tarea' });
    }

    const [result] = await db.execute(
      'DELETE FROM tasks WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;