const express = require('express');
const router = express.Router();
const createConnectionPool = require('../database/connection');


// Obtener todas las tareas (público)
router.get('/', async (req, res, next) => {
  try {
    const db = await createConnectionPool();
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
    const db = await createConnectionPool();
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

    const db = await createConnectionPool();
    const [result] = await db.execute(
      'INSERT INTO tasks (title, description) VALUES (?, ?)',
      [title, description || '']
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

    // Obtener la tarea actual para conservar datos si no se proporcionan
    const db = await createConnectionPool();
    const [currentTask] = await db.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );

    if (currentTask.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const task = currentTask[0];
    
    // Validar que se proporciona título si no existe uno previo
    const finalTitle = title !== undefined ? title : task.title;
    if (!finalTitle) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }

    const [result] = await db.execute(
      'UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ?',
      [
        finalTitle, 
        description !== undefined ? description : task.description, 
        completed !== undefined ? completed : task.completed, 
        id
      ]
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

    const db = await createConnectionPool();
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