require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./database/connection');

// Importar rutas
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas API
app.use('/api/tasks', taskRoutes);


// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);

  try {
    const connection = await pool.getConnection();
    console.log('Conectado a MySQL');
    connection.release();
  } catch (error) {
    console.error('Error al conectar a MySQL:', error.message);
  }
});
