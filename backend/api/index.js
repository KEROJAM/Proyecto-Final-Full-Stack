// Cargar variables de entorno del backend
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Importar y exportar la app de Express
const app = require('../server');

// Exportar la app para que Vercel la use como función serverless
// Vercel automáticamente la detectará y la usará para todas las rutas /api
module.exports = app;



