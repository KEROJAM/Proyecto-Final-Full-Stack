const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

function pregunta(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

async function getDbCredentials() {
  const config = {
    host: process.env.DB_HOST || await pregunta('Servidor de MySQL (localhost): ') || 'localhost',
    user: process.env.DB_USER || await pregunta('Usuario de MySQL: '),
    password: process.env.DB_PASSWORD || await pregunta('Contraseña de MySQL: '),
    database: process.env.DB_NAME || await pregunta('Nombre de la base de datos (one_sentence_reviews): ') || 'one_sentence_reviews'
  };
  return config;
}

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) DEFAULT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    media_type ENUM('book', 'movie', 'tv', 'music', 'game', 'anime') NOT NULL,
    media_title VARCHAR(255) NOT NULL,
    cover VARCHAR(500) DEFAULT NULL,
    review_text VARCHAR(200) NOT NULL,
    rating INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_media_type (media_type),
    INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS review_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS review_tag_map (
    review_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (review_id, tag_id),
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES review_tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    user_id INT NOT NULL,
    emoji_type ENUM('heart', 'laughing', 'crying', 'surprised') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_reaction (review_id, user_id, emoji_type),
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_review_id (review_id)
);

INSERT IGNORE INTO review_tags (name) VALUES 
    ('funny'), ('serious'), ('made-me-cry'), ('thought-provoking'), 
    ('recommend'), ('skip-it'), ('underrated'), ('overrated'), 
    ('inspiring'), ('mind-blowing');

INSERT IGNORE INTO users (username, name, email, password) VALUES 
    ('demo', 'Juan Pérez', 'demo@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
    ('maria_dev', 'María García', 'maria@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
    ('david_tech', 'David López', 'david@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
    ('ana_arts', 'Ana Martínez', 'ana@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
    ('luis_gamer', 'Luis Rodríguez', 'luis@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

INSERT IGNORE INTO reviews (user_id, media_type, media_title, cover, review_text, rating) VALUES 
    (1, 'movie', 'Dune: Part Two', NULL, 'Visually stunning, but I needed 3 hours to recover emotionally.', 5),
    (2, 'book', 'Atomic Habits', NULL, 'Good concepts, but I skimmed 80% of it.', 3),
    (3, 'game', 'Hades', NULL, 'Finally beat it after 200 deaths, worth every one.', 5),
    (4, 'tv', 'Breaking Bad', NULL, 'Started watching at 11pm, finished season 1 at 3am. No regrets.', 5),
    (5, 'music', 'Random Access Memories', NULL, 'Made me feel like I was in a sci-fi movie soundtrack.', 4),
    (1, 'book', 'Project Hail Mary', NULL, 'The friendliest science book ever written.', 5),
    (2, 'movie', 'Everything Everywhere All At Once', NULL, 'I still do not understand the bagel.', 4),
    (3, 'tv', 'The Office', NULL, 'Watched it during hard times, it literally saved my mental health.', 5),
    (4, 'game', 'Stardew Valley', NULL, 'I have 400 hours and no shame.', 4),
    (5, 'music', 'Blue Moon', NULL, 'Listened to this on repeat for three days straight.', 3),
    (2, 'book', 'The Psychology of Money', NULL, 'Changed how I think about wealth.', 5),
    (3, 'game', 'Elden Ring', NULL, 'Best game I have ever played.', 5),
    (4, 'music', 'Starboy', NULL, 'This album is a masterpiece.', 4),
    (5, 'tv', 'Stranger Things', NULL, 'Binged all seasons in a week.', 4),
    (1, 'movie', 'Oppenheimer', NULL, 'Cillian Murphy deserves an Oscar.', 5);

INSERT IGNORE INTO review_tag_map (review_id, tag_id) VALUES 
    (1, 1), (1, 7),
    (2, 2), (2, 6),
    (3, 5),
    (4, 1), (4, 5),
    (5, 9), (5, 10),
    (6, 1), (6, 5),
    (7, 10),
    (8, 5), (8, 9),
    (9, 1),
    (10, 1);
`;

async function createConnectionPool() {
  if (pool) return pool;

  const config = await getDbCredentials();

  try {
    // Primero conectar SIN base de datos
    const tempConfig = { ...config };
    delete tempConfig.database;
    
    console.log('Conectando a MySQL sin base de datos...');
    const tempPool = mysql.createPool(tempConfig);
    const conn = await tempPool.getConnection();
    console.log('Conexión exitosa');
    
    // Crear base de datos si no existe
    const [dbs] = await conn.query('SHOW DATABASES LIKE ?', [config.database]);
    if (dbs.length === 0) {
      console.log(`Creando base de datos '${config.database}'...`);
      await conn.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
      console.log('Base de datos creada');
    } else {
      console.log(`Base de datos '${config.database}' ya existe`);
    }
    
    conn.release();
    await tempPool.end();
    
    // Ahora conectar CON la base de datos
    console.log('Conectando a la base de datos...');
    pool = mysql.createPool(config);
    const dbConn = await pool.getConnection();
    console.log('Conexión exitosa a la base de datos');
    
    // Crear tablas si no existen
    console.log('Verificando tablas...');
    const [tables] = await dbConn.query('SHOW TABLES');
    if (tables.length === 0) {
      console.log('Creando tablas...');
      const statements = CREATE_TABLES_SQL.split(';').map(s => s.trim()).filter(s => s);
      for (const stmt of statements) {
  config.waitForConnections = true;
  config.connectionLimit = 10;
  config.queueLimit = 0;

  rl.close();

  try {
          await dbConn.query(stmt);
        } catch (e) {
          console.warn('Advertencia:', e.message);
        }
      }
      console.log('Tablas creadas exitosamente');
    } else {
      console.log('Las tablas ya existen');
    }
    
    dbConn.release();
    return pool;
    
  } catch (error) {
    console.error('Error de conexión:', error.message);
    process.exit(1);
  }
}

module.exports = createConnectionPool();
