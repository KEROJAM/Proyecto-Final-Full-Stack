console.log('[API BOOT] Starting...');

// Cargar variables de entorno del backend PRIMERO
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '../backend/.env');
console.log('[API BOOT] Loading env from:', envPath);
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
  fallbackApp.use(express.json());
  
  fallbackApp.get('/api/health', (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  });
  
  fallbackApp.get('/api/debug/env-status', (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      environment: {
        DATABASE_URL: process.env.DATABASE_URL ? 'present' : 'MISSING',
        JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'MISSING',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL
      }
    });
  });
  
  fallbackApp.all('*', (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      details: 'Check /api/debug/env-status for environment diagnostics'
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




