#!/usr/bin/env node

/**
 * Script de diagnóstico local
 * Ejecuta: node api/test-boot.js
 */

console.log('='.repeat(60));
console.log('DIAGNOSTIC TEST - API BOOT');
console.log('='.repeat(60));
console.log('Time:', new Date().toISOString());
console.log('CWD:', process.cwd());
console.log('Node version:', process.version);

// 1. Test environment loading
console.log('\n[TEST 1] Loading environment...');
const path = require('path');
const dotenv = require('dotenv');
const envPath = path.join(__dirname, '../backend/.env');

try {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('❌ Error:', result.error.message);
  } else {
    console.log('✅ .env loaded, variables:', Object.keys(result.parsed || {}).length);
  }
} catch (e) {
  console.error('❌ Exception:', e.message);
}

console.log('  DATABASE_URL:', process.env.DATABASE_URL ? `✅ (${process.env.DATABASE_URL.substring(0, 50)}...)` : '❌ MISSING');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? `✅ (length: ${process.env.JWT_SECRET.length})` : '❌ MISSING');

// 2. Test config/jwt import
console.log('\n[TEST 2] Testing config/jwt.js import...');
try {
  const jwt = require('../backend/config/jwt.js');
  console.log('✅ Imported successfully');
  console.log('  Exports:', Object.keys(jwt));
  const info = jwt.getJWTSecretInfo();
  console.log('  JWT Info:', {
    configured: info.configured,
    hashPreview: info.hash,
    message: info.message
  });
} catch (e) {
  console.error('❌ Import failed:', e.message);
  console.error('  Stack:', e.stack.split('\n').slice(0, 3).join('\n'));
}

// 3. Test connection.js import
console.log('\n[TEST 3] Testing database/connection.js import...');
try {
  const conn = require('../backend/database/connection.js');
  console.log('✅ Imported successfully');
  console.log('  Exports type:', typeof conn);
  console.log('  Is function:', typeof conn === 'function');
} catch (e) {
  console.error('❌ Import failed:', e.message);
  if (e.code === 'MODULE_NOT_FOUND') {
    console.error('  File not found:', e.path);
  }
  console.error('  Stack:', e.stack.split('\n').slice(0, 3).join('\n'));
}

// 4. Test database connection (don't wait for it)
console.log('\n[TEST 4] Testing database connection (async, no wait)...');
try {
  const createPool = require('../backend/database/connection.js');
  console.log('✅ Function imported');
  console.log('  Calling createConnectionPool()...');
  
  const poolPromise = createPool();
  console.log('✅ Promise created');
  
  // Don't wait, just check the promise
  poolPromise
    .then(pool => {
      console.log('  ✅ Pool connected successfully');
    })
    .catch(err => {
      console.error('  ❌ Pool connection failed:', err.message);
    });
} catch (e) {
  console.error('❌ Exception:', e.message);
}

// 5. Test server.js import (the critical one)
console.log('\n[TEST 5] Testing backend/server.js import...');
try {
  const express = require('express');
  const server = require('../backend/server.js');
  console.log('✅ Imported successfully');
  console.log('  Type:', typeof server);
  console.log('  Is Express app:', typeof server.use === 'function');
  console.log('  Methods:', Object.keys(server).filter(k => typeof server[k] === 'function').slice(0, 5));
} catch (e) {
  console.error('❌ Import failed:', e.message);
  console.error('  Error name:', e.name);
  console.error('  Stack (first 10 lines):');
  e.stack.split('\n').slice(0, 10).forEach(line => console.error('    ' + line));
}

console.log('\n' + '='.repeat(60));
console.log('DIAGNOSTIC COMPLETE');
console.log('='.repeat(60));
