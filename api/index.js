console.log('[API BOOT] Starting...');

// Cargar variables de entorno del backend PRIMERO
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '../backend/.env');
console.log('[API BOOT] Loading env from:', envPath);
dotenv.config({ path: envPath });

console.log('[API BOOT] Environment loaded');
console.log('[API BOOT] DATABASE_URL:', process.env.DATABASE_URL ? 'present' : 'MISSING');
console.log('[API BOOT] VERCEL:', process.env.VERCEL);

let app;
try {
  console.log('[API BOOT] Requiring backend/server...');
  app = require('../backend/server');
  console.log('[API BOOT] Server module loaded successfully');
} catch (error) {
  console.error('[API BOOT] CRITICAL ERROR loading server:', error.message);
  console.error(error.stack);
  
  // Crear una app de emergencia que devuelva el error
  const express = require('express');
  const fallbackApp = express();
  fallbackApp.get('/api/health', (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  });
  fallbackApp.all('*', (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message
    });
  });
  module.exports = fallbackApp;
  process.exit(1);
}

// Variable para rastrear inicialización de BD
let dbInitialized = false;
let initPromise = null;

// Middleware para asegurar que la BD está inicializada
app.use(async (req, res, next) => {
  try {
    if (!dbInitialized && !initPromise) {
      console.log('[API] First request, initializing database...');
      const createConnectionPool = require('../backend/database/connection');
      initPromise = createConnectionPool();
    }
    
    if (!dbInitialized && initPromise) {
      const pool = await initPromise;
      if (!pool) {
        throw new Error('Database pool is null');
      }
      dbInitialized = true;
      console.log('[API] Database initialized successfully');
    }
    
    next();
  } catch (error) {
    console.error('[API] Database initialization error:', error.message);
    return res.status(503).json({
      error: 'Database initialization failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

console.log('[API BOOT] Ready to accept requests');

// Exportar la app para que Vercel la use como función serverless
module.exports = app;




