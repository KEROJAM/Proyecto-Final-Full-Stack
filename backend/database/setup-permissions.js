const mysql = require('mysql2/promise');
require('dotenv').config();

const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

function pregunta(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

async function setup() {
  console.log('\n=== Configuración de permisos MySQL ===\n');
  
  const rootConfig = {
    host: process.env.DB_HOST || await pregunta('Servidor de MySQL (localhost): ') || 'localhost',
    user: process.env.DB_ROOT_USER || await pregunta('Usuario root de MySQL: '),
    password: process.env.DB_ROOT_PASSWORD || await pregunta('Contraseña root de MySQL: ')
  };

  const appUser = process.env.DB_USER || await pregunta('Usuario de la app (isabella): ') || 'isabella';
  const dbName = process.env.DB_NAME || 'one_sentence_reviews';

  try {
    const connection = await mysql.createConnection(rootConfig);
    console.log('✓ Conexión exitosa como root');

    await connection.query(`GRANT ALL PRIVILEGES ON ${dbName}.* TO '${appUser}'@'localhost'`);
    await connection.query('FLUSH PRIVILEGES');
    
    console.log(`✓ Permisos otorgados a '${appUser}'@'localhost' sobre '${dbName}'`);
    
    await connection.end();
    console.log('\n✓ Configuración completada\n');
    rl.close();
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

setup();
