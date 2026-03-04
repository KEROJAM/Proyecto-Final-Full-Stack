console.log('[API BOOT] Starting...', new Date().toISOString());

// Cargar variables de entorno del backend PRIMERO
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const fs = require('fs');

const envPath = path.join(__dirname, '../backend/.env');
console.log('[API BOOT] Loading env from:', envPath);
console.log('[API BOOT] File exists:', fs.existsSync(envPath));
dotenv.config({ path: envPath });

console.log('[API BOOT] Environment loaded');
console.log('[API BOOT] DATABASE_URL:', process.env.DATABASE_URL ? '✅ present' : '❌ MISSING');
console.log('[API BOOT] JWT_SECRET:', process.env.JWT_SECRET ? '✅ configured' : '❌ USING DEFAULT');
console.log('[API BOOT] VERCEL:', process.env.VERCEL || 'local');

// Validar variables críticas en Vercel
const isVercel = process.env.VERCEL === '1';
if (isVercel) {
  const missingVars = [];
  if (!process.env.DATABASE_URL) missingVars.push('DATABASE_URL');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_super_secret_jwt_key_here_change_in_production') {
    missingVars.push('JWT_SECRET');
  }
  
  if (missingVars.length > 0) {
    console.error('[API BOOT] ❌ CRITICAL ERROR: Missing environment variables in Vercel:');
    missingVars.forEach(v => console.error(`  - ${v}`));
    console.error('[API BOOT] Instructions: Configure these in Vercel Dashboard → Settings → Environment Variables');
  }
}

// Crear app base de emergencia primero
const baseApp = express();
baseApp.use(express.json());

// Endpoints de debug siempre disponibles
baseApp.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

baseApp.get('/api/debug/env-status', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    environment: {
      DATABASE_URL: process.env.DATABASE_URL ? '✅ present' : '❌ MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? '✅ configured' : '❌ USING DEFAULT',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL || 'local',
      KEYS: Object.keys(process.env).filter(k => 
        k.includes('JWT') || k.includes('SECRET') || k.includes('DATABASE') || k.includes('DB_')
      )
    }
  });
});

let app;
let loadError = null;

// Intentar cargar server.js con manejo seguro de errores
try {
  console.log('[API BOOT] [1/3] Requiring config/jwt.js...');
  require('../backend/config/jwt.js'); // Test import
  console.log('[API BOOT] ✅ config/jwt.js loaded');
  
  console.log('[API BOOT] [2/3] Requiring backend/database/connection.js...');
  require('../backend/database/connection.js'); // Test import
  console.log('[API BOOT] ✅ database/connection.js loaded');
  
  console.log('[API BOOT] [3/3] Requiring backend/server.js...');
  app = require('../backend/server');
  console.log('[API BOOT] ✅ Server module loaded successfully');
} catch (error) {
  loadError = error;
  console.error('[API BOOT] ❌ CRITICAL ERROR loading modules:');
  console.error('  Message:', error.message);
  console.error('  Code:', error.code);
  console.error('  Module that failed:', error.module || 'unknown');
  if (error.stack) {
    const stackLines = error.stack.split('\n').slice(0, 8);
    console.error('  Stack:');
    stackLines.forEach(line => console.error('    ' + line));
  }
  
  // Si hay error al cargar, usar la app base
  app = baseApp;
  const errorApp = baseApp;
  
  errorApp.get('/api/error-status', (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: loadError.message,
      code: loadError.code,
      details: 'Backend modules failed to load. Check /api/debug/env-status',
      timestamp: new Date().toISOString()
    });
  });
  
  errorApp.all('/api/*', (req, res) => {
    res.status(503).json({
      error: 'Service unavailable',
      message: 'Backend failed to initialize',
      details: 'Check /api/error-status or /api/debug/env-status for more info',
      timestamp: new Date().toISOString()
    });
  });
  
  module.exports = errorApp;
  process.exit(1);
}

// Si llegamos aquí, app fue cargada exitosamente

// Variable para rastrear inicialización de BD
let dbInitialized = false;
let initPromise = null;
let dbError = null;

// Middleware para asegurar que la BD está inicializada
app.use(async (req, res, next) => {
  try {
    // Si ya hubo error previo, no intentar de nuevo
    if (dbError) {
      console.error('[API] DB error persists:', dbError.message);
      return res.status(503).json({
        error: 'Database connection failed',
        message: dbError.message,
        details: 'The database is not available. Check environment variables.',
        timestamp: new Date().toISOString()
      });
    }

    if (!dbInitialized && !initPromise) {
      console.log('[API] First request, initializing database...');
      const createConnectionPool = require('../backend/database/connection');
      initPromise = createConnectionPool().catch(err => {
        dbError = err;
        throw err;
      });
    }
    
    if (!dbInitialized && initPromise) {
      try {
        const pool = await initPromise;
        if (!pool) {
          throw new Error('Database pool is null');
        }
        dbInitialized = true;
        console.log('[API] Database initialized successfully');
      } catch (poolError) {
        dbError = poolError;
        console.error('[API] Database initialization error:', poolError.message);
        return res.status(503).json({
          error: 'Database initialization failed',
          message: poolError.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('[API] Database middleware error:', error.message);
    dbError = error;
    return res.status(503).json({
      error: 'Database initialization failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware global de error para capturar cualquier error no manejado
app.use((err, req, res, next) => {
  console.error('[API ERROR HANDLER] Unhandled error:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

console.log('[API BOOT] Ready to accept requests');

// Global error handlers para capturar cualquier error no manejado
process.on('unhandledRejection', (reason, promise) => {
  console.error('[GLOBAL ERROR] Unhandled Rejection:', reason);
  console.error('[GLOBAL ERROR] Promise:', promise);
});

process.on('uncaughtException', (error) => {
  console.error('[GLOBAL ERROR] Uncaught Exception:', error.message);
  console.error('[GLOBAL ERROR] Stack:', error.stack);
});

// Exportar la app para que Vercel la use como función serverless
module.exports = app;




