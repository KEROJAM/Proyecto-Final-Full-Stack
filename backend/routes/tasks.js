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

// Obtener todas las tareas (público)
router.get('/my-tasks', async (req, res, next) => {
  try {
    const [tasks] = await db.execute(
      'SELECT * FROM tasks ORDER BY created_at DESC'
    );
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Crear nueva tarea (público)
router.post('/', async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }

    const [result] = await db.execute(
      'INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)',
      [title, description || '', 1]
    );

    res.status(201).json({
      message: 'Tarea creada exitosamente',
      id: result.insertId
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar tarea (público)
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

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

// Eliminar tarea (público)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

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