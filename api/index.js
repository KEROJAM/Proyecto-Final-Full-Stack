// Cargar variables de entorno del backend
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

// Importar la función de conexión
const createConnectionPool = require('../backend/database/connection');

// Importar y exportar la app de Express
const app = require('../backend/server');

// Middleware para asegurar que la BD está inicializada antes de cualquier solicitud
let dbInitialized = false;

app.use(async (req, res, next) => {
  try {
    if (!dbInitialized) {
      console.log('[API] Inicializando conexión a BD...');
      await createConnectionPool();
      dbInitialized = true;
      console.log('[API] Conexión a BD inicializada');
    }
    next();
  } catch (error) {
    console.error('[API] Error inicializando BD:', error);
    res.status(503).json({ error: 'Database connection failed', message: error.message });
  }
});

// Log de todas las peticiones para debuguear
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Exportar la app para que Vercel la use como función serverless
module.exports = app;


