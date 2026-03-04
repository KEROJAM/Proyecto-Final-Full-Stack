console.log('[API BOOT] Starting...', new Date().toISOString());

// Cargar variables de entorno del backend PRIMERO
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const fs = require('fs');

const envPath = path.join(__dirname, '../backend/.env');
console.log('[API BOOT] Loading env from:', envPath);
console.log('[API BOOT] File exists:', fs.existsSync(envPath));

try {
  dotenv.config({ path: envPath });
  console.log('[API BOOT] ✅ Environment loaded');
  console.log('[API BOOT] DATABASE_URL:', process.env.DATABASE_URL ? '✅ present' : '❌ MISSING');
  console.log('[API BOOT] JWT_SECRET:', process.env.JWT_SECRET ? `✅ (length: ${process.env.JWT_SECRET.length})` : '❌ MISSING');
  console.log('[API BOOT] VERCEL:', process.env.VERCEL || 'local');
} catch (envError) {
  console.error('[API BOOT] ❌ Error loading .env:', envError.message);
}

// Validar variables críticas en Vercel
const isVercel = process.env.VERCEL === '1';
if (isVercel) {
  const missingVars = [];
  if (!process.env.DATABASE_URL) missingVars.push('DATABASE_URL');
  if (!process.env.JWT_SECRET) {
    missingVars.push('JWT_SECRET');
  }
  
  if (missingVars.length > 0) {
    console.error('[API BOOT] ❌ CRITICAL ERROR: Missing environment variables in Vercel:');
    missingVars.forEach(v => console.error(`  - ${v}`));
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
      JWT_SECRET: process.env.JWT_SECRET ? `✅ (length: ${process.env.JWT_SECRET.length})` : '❌ MISSING',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL || 'local',
      KEYS: Object.keys(process.env).filter(k => 
        k.includes('JWT') || k.includes('SECRET') || k.includes('DATABASE') || k.includes('DB_')
      ).slice(0, 10)
    }
  });
});

let app = null;
let loadError = null;

// Intentar cargar server.js con manejo seguro de errores
console.log('[API BOOT] [STARTUP] Attempting to load backend...');
try {
  console.log('[API BOOT] [1/3] Testing require("../backend/config/jwt.js")...');
  const jwtModule = require('../backend/config/jwt.js');
  console.log('[API BOOT] ✅ [1/3] config/jwt.js loaded, exports:', Object.keys(jwtModule));
  
  console.log('[API BOOT] [2/3] Testing require("../backend/database/connection.js")...');
  const connModule = require('../backend/database/connection.js');
  console.log('[API BOOT] ✅ [2/3] database/connection.js loaded');
  
  console.log('[API BOOT] [3/3] Testing require("../backend/server.js")...');
  app = require('../backend/server');
  console.log('[API BOOT] ✅ [3/3] Server module loaded successfully');
  console.log('[API BOOT] ✅ Server is Express app:', typeof app === 'object' && typeof app.use === 'function');
} catch (error) {
  loadError = error;
  console.error('[API BOOT] ❌ CRITICAL ERROR during module loading:');
  console.error('  Error Name:', error.name);
  console.error('  Error Message:', error.message);
  console.error('  Error Code:', error.code);
  
  if (error.stack) {
    const lines = error.stack.split('\n');
    console.error('  Stack Trace:');
    lines.slice(0, 10).forEach(line => {
      console.error('    ' + line);
    });
  }
  
  // Usar app base (fallback)
  app = baseApp;
}

// Variable para rastrear inicialización de BD
let dbInitialized = false;
let initPromise = null;
let dbError = null;

// SOLO agregar middleware de BD si app fue cargada exitosamente
if (app !== baseApp) {
  console.log('[API] Adding database initialization middleware...');
  
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
      url: req.url,
      method: req.method
    });
    
    if (err.stack) {
      console.error('[API ERROR HANDLER] Stack:', err.stack.split('\n').slice(0, 5).join('\n'));
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  });
  
  console.log('[API] ✅ Database and error middleware configured');
} else {
  console.log('[API] ⚠️  Using fallback app, skipping database middleware');
  
  // Agregue handler de error en la app base también
  app.get('/api/error-status', (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: loadError?.message || 'Unknown error',
      code: loadError?.code,
      details: 'Backend modules failed to load. Check /api/debug/env-status',
      timestamp: new Date().toISOString()
    });
  });
  
  app.all('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(503).json({
        error: 'Service unavailable',
        message: 'Backend failed to initialize',
        details: 'Check /api/error-status or /api/debug/env-status for more info',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).send('Not found');
    }
  });
}

console.log('[API BOOT] Ready to accept requests');

// Global error handlers para capturar cualquier error no manejado
process.on('unhandledRejection', (reason, promise) => {
  console.error('[GLOBAL ERROR] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[GLOBAL ERROR] Uncaught Exception:', error.message);
});

// Asegurar que siempre exportamos una app válida
if (!app) {
  console.error('[API FATAL] app is null, using baseApp');
  app = baseApp;
}

console.log('[API BOOT] Exporting app, type:', typeof app, 'has use:', typeof app?.use);

// Exportar la app para que Vercel la use como función serverless
module.exports = app;




