/**
 * Diagnóstico de inicialización
 * Ejecuta checks antes de intentar cargar el servidor
 */

console.log('[DIAGNOSTIC] Starting diagnostic...', new Date().toISOString());

const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// 1. Check environment variables
console.log('[DIAGNOSTIC] Checking .env file...');
const envPath = path.join(__dirname, '../backend/.env');
console.log('[DIAGNOSTIC] .env path:', envPath);
console.log('[DIAGNOSTIC] .env exists:', fs.existsSync(envPath));

dotenv.config({ path: envPath });

console.log('[DIAGNOSTIC] Environment variables loaded:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅' : '❌');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅' : '❌');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  VERCEL:', process.env.VERCEL);

// 2. Check critical files
console.log('[DIAGNOSTIC] Checking critical files...');
const filesToCheck = [
  '../backend/server.js',
  '../backend/config/jwt.js',
  '../backend/database/connection.js',
  '../backend/controllers/authController.js',
];

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  console.log(`  ${file}: ${fs.existsSync(filePath) ? '✅' : '❌'}`);
});

// 3. Try to require config/jwt.js
console.log('[DIAGNOSTIC] Testing config/jwt.js import...');
try {
  const jwtConfig = require('../backend/config/jwt.js');
  console.log('  ✅ config/jwt.js imported successfully');
  console.log('  ✅ getJWTSecret:', typeof jwtConfig.getJWTSecret);
  console.log('  ✅ getJWTSecretInfo:', typeof jwtConfig.getJWTSecretInfo);
} catch (error) {
  console.error('  ❌ Failed to import config/jwt.js:', error.message);
  process.exit(1);
}

// 4. Try to require server.js
console.log('[DIAGNOSTIC] Testing server.js import...');
try {
  const server = require('../backend/server.js');
  console.log('  ✅ server.js imported successfully');
  console.log('  ✅ server is Express app:', typeof server.use);
} catch (error) {
  console.error('  ❌ Failed to import server.js:');
  console.error('    Message:', error.message);
  console.error('    Code:', error.code);
  if (error.stack) {
    console.error('    Stack trace:');
    error.stack.split('\n').slice(0, 10).forEach((line, i) => {
      console.error('    ', line);
    });
  }
  process.exit(1);
}

console.log('[DIAGNOSTIC] ✅ All diagnostics passed!');
