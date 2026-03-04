require('dotenv').config();
const path = require('path');

process.chdir(path.join(__dirname, '..'));

module.exports = require('./backend/server');
