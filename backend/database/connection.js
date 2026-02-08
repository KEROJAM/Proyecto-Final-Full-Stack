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
      
      // Verificar si la base de datos existe, si no, crearla
      await setupDatabase(connection, config);
      
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

      try {
        const dbUser = await question('Usuario de MySQL: ');
        const dbPassword = await question('Contraseña de MySQL (presiona Enter si no tienes): ');
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
        
        // Verificar si la base de datos existe, si no, crearla
        await setupDatabase(connection, config);
        
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
    
    // Verificar si la base de datos existe
    const connection = await pool.getConnection();
    await setupDatabase(connection, config);
    connection.release();
    
    return pool;
  }
}

async function setupDatabase(connection, config) {
  try {
    // Primero conectarse sin especificar la base de datos para poder crearla si no existe
    const tempConfig = { ...config };
    delete tempConfig.database;
    
    const tempPool = mysql.createPool(tempConfig);
    const tempConnection = await tempPool.getConnection();
    
    // Verificar si la base de datos existe
    const [databases] = await tempConnection.execute('SHOW DATABASES LIKE ?', [config.database]);
    
    if (databases.length === 0) {
      console.log(`Base de datos '${config.database}' no encontrada. Creándola...`);
      
      // Leer y ejecutar el archivo SQL
      const fs = require('fs').promises;
      const path = require('path');
      
      try {
        const sqlPath = path.join(__dirname, '../../mysql.sql');
        const sqlContent = await fs.readFile(sqlPath, 'utf8');
        
        // Separar las sentencias SQL y ejecutarlas
        const statements = sqlContent
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
          if (statement.trim()) {
            await tempConnection.execute(statement);
          }
        }
        
        console.log(`Base de datos '${config.database}' creada exitosamente`);
      } catch (sqlError) {
        console.error('Error al ejecutar el archivo SQL:', sqlError.message);
        tempConnection.release();
        await tempPool.end();
        throw sqlError;
      }
    } else {
      console.log(`Base de datos '${config.database}' ya existe`);
    }
    
    tempConnection.release();
    await tempPool.end();
    
  } catch (error) {
    console.error('Error al configurar la base de datos:', error.message);
    throw error;
  }
}

module.exports = createConnectionPool;