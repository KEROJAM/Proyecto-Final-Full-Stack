const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

async function createConnectionPool() {
  // Si ya hay un pool, retornarlo
  if (pool) return pool;

  // Valores por defecto
  let config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'todo_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  // Si no hay variables de entorno, intentar conexión con valores por defecto
  if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
    try {
      console.log('Intentando conexión con valores por defecto...');
      const testPool = mysql.createPool(config);
      const connection = await testPool.getConnection();
      console.log('Conexión exitosa con valores por defecto');
      connection.release();
      pool = testPool;
      return pool;
    } catch (error) {
      console.log('Falló conexión con valores por defecto, solicitando credenciales...');
      
      // Solicitar credenciales al usuario
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const question = (prompt) => new Promise((resolve) => {
        rl.question(prompt, resolve);
      });

      // Ocultar entrada de contraseña
      const questionPassword = (prompt) => new Promise((resolve) => {
        const stdin = process.stdin;
        stdin.setRawMode(true);
        process.stdout.write(prompt);
        
        let password = '';
        stdin.on('data', function(char) {
          char = char.toString();
          switch (char) {
            case '\n':
            case '\r':
            case '\u0004':
              stdin.setRawMode(false);
              stdin.removeAllListeners('data');
              console.log();
              resolve(password);
              break;
            case '\u0003':
              process.exit();
              break;
            default:
              process.stdout.write('*');
              password += char;
              break;
          }
        });
      });

      try {
        const dbUser = await question('Usuario de MySQL: ');
        const dbPassword = await questionPassword('Contraseña de MySQL (presiona Enter si no tienes): ');
        const dbHost = await question('Host de MySQL (localhost): ') || 'localhost';
        const dbName = await question('Nombre de la base de datos (todo_db): ') || 'todo_db';

        rl.close();

        // Actualizar configuración con las credenciales ingresadas
        config = {
          host: dbHost,
          user: dbUser,
          password: dbPassword,
          database: dbName,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        };

        // Probar conexión con nuevas credenciales
        const testPool = mysql.createPool(config);
        const connection = await testPool.getConnection();
        console.log('Conexión exitosa con las credenciales ingresadas');
        connection.release();
        pool = testPool;
        return pool;

      } catch (authError) {
        rl.close();
        console.error('Error de autenticación con las credenciales ingresadas:', authError.message);
        process.exit(1);
      }
    }
  } else {
    // Usar variables de entorno
    pool = mysql.createPool(config);
    return pool;
  }
}

module.exports = createConnectionPool;