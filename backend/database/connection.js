const { Pool } = require('pg');
require('dotenv').config();

let pool;
let poolPromise = null;

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) DEFAULT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    media_type VARCHAR(20) NOT NULL,
    media_title VARCHAR(255) NOT NULL,
    cover VARCHAR(500) DEFAULT NULL,
    review_text VARCHAR(200) NOT NULL,
    rating INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON reviews(media_type);
CREATE INDEX IF NOT EXISTS idx_created_at ON reviews(created_at);

CREATE TABLE IF NOT EXISTS review_tags (
    id SERIAL PRIMARY KEY,
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
    id SERIAL PRIMARY KEY,
    review_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    emoji_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (review_id, COALESCE(user_id, 0), emoji_type)
);

CREATE INDEX IF NOT EXISTS idx_review_id_reactions ON reactions(review_id);

CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    review_id INT NOT NULL,
    user_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_review_id_comments ON comments(review_id);
`;

const SEED_DATA_SQL = `
INSERT INTO review_tags (name) VALUES 
    ('funny'), ('serious'), ('made-me-cry'), ('thought-provoking'), 
    ('recommend'), ('skip-it'), ('underrated'), ('overrated'), 
    ('inspiring'), ('mind-blowing')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (username, name, email, password) VALUES 
    ('demo', 'Juan Pérez', 'demo@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
    ('maria_dev', 'María García', 'maria@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
    ('david_tech', 'David López', 'david@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
    ('ana_arts', 'Ana Martínez', 'ana@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
    ('luis_gamer', 'Luis Rodríguez', 'luis@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (username) DO NOTHING;

INSERT INTO reviews (user_id, media_type, media_title, cover, review_text, rating) VALUES 
    (1, 'movie', 'Dune: Part Two', 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', 'Visually stunning, but I needed 3 hours to recover emotionally.', 5),
    (2, 'book', 'Atomic Habits', 'https://images-na.ssl-images-amazon.com/images/I/81wgcld4wxL.jpg', 'Good concepts, but I skimmed 80% of it.', 3),
    (3, 'game', 'Hades', 'https://image.api.nintendo.com/v1/cat_box/repo/np/pl/70010000042508/box.png', 'Finally beat it after 200 deaths, worth every one.', 5),
    (4, 'tv', 'Breaking Bad', 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', 'Started watching at 11pm, finished season 1 at 3am. No regrets.', 5),
    (5, 'music', 'Random Access Memories', 'https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg', 'Made me feel like I was in a sci-fi movie soundtrack.', 4),
    (1, 'book', 'Project Hail Mary', 'https://images-na.ssl-images-amazon.com/images/I/91vS2Ph2S5L.jpg', 'The friendliest science book ever written.', 5),
    (2, 'movie', 'Everything Everywhere All At Once', 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', 'I still do not understand the bagel.', 4),
    (3, 'tv', 'The Office', 'https://image.tmdb.org/t/p/w500/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg', 'Watched it during hard times, it literally saved my mental health.', 5),
    (4, 'game', 'Stardew Valley', 'https://image.api.nintendo.com/v1/cat_box/repo/np/pl/70010000037653/box.png', 'I have 400 hours and no shame.', 4),
    (5, 'music', 'Blue Moon', 'https://upload.wikimedia.org/wikipedia/en/7/71/Blue_Moon_%28Young_Thug_album%29.jpg', 'Listened to this on repeat for three days straight.', 3),
    (2, 'book', 'The Psychology of Money', 'https://images-na.ssl-images-amazon.com/images/I/81Dky+tyvqL.jpg', 'Changed how I think about wealth.', 5),
    (3, 'game', 'Elden Ring', 'https://image.api.nintendo.com/v1/cat_box/repo/np/pl/70010000061369/box.png', 'Best game I have ever played.', 5),
    (4, 'music', 'Starboy', 'https://upload.wikimedia.org/wikipedia/en/a/a9/Starboy_The_Weeknd_album_cover.png', 'This album is a masterpiece.', 4),
    (5, 'tv', 'Stranger Things', 'https://image.tmdb.org/t/p/w500/o7qi2097KejWCO1q2z1Pg85oi82.jpg', 'Binged all seasons in a week.', 4),
    (1, 'movie', 'Oppenheimer', 'https://image.tmdb.org/t/p/w500/8Gxv8kSoNmQQciqVTXAwaay6OnO.jpg', 'Cillian Murphy deserves an Oscar.', 5)
ON CONFLICT DO NOTHING;

INSERT INTO review_tag_map (review_id, tag_id) VALUES 
    (1, 1), (1, 7),
    (2, 2), (2, 6),
    (3, 5),
    (4, 1), (4, 5),
    (5, 9), (5, 10),
    (6, 1), (6, 5),
    (7, 10),
    (8, 5), (8, 9),
    (9, 1),
    (10, 1)
ON CONFLICT DO NOTHING;

-- Update covers for existing reviews (migration)
UPDATE reviews SET cover = 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg' WHERE media_title = 'Dune: Part Two';
UPDATE reviews SET cover = 'https://images-na.ssl-images-amazon.com/images/I/81wgcld4wxL.jpg' WHERE media_title = 'Atomic Habits';
UPDATE reviews SET cover = 'https://image.api.nintendo.com/v1/cat_box/repo/np/pl/70010000042508/box.png' WHERE media_title = 'Hades';
UPDATE reviews SET cover = 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg' WHERE media_title = 'Breaking Bad';
UPDATE reviews SET cover = 'https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg' WHERE media_title = 'Random Access Memories';
UPDATE reviews SET cover = 'https://images-na.ssl-images-amazon.com/images/I/91vS2Ph2S5L.jpg' WHERE media_title = 'Project Hail Mary';
UPDATE reviews SET cover = 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg' WHERE media_title = 'Everything Everywhere All At Once';
UPDATE reviews SET cover = 'https://image.tmdb.org/t/p/w500/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg' WHERE media_title = 'The Office';
UPDATE reviews SET cover = 'https://image.api.nintendo.com/v1/cat_box/repo/np/pl/70010000037653/box.png' WHERE media_title = 'Stardew Valley';
UPDATE reviews SET cover = 'https://upload.wikimedia.org/wikipedia/en/7/71/Blue_Moon_%28Young_Thug_album%29.jpg' WHERE media_title = 'Blue Moon';
UPDATE reviews SET cover = 'https://images-na.ssl-images-amazon.com/images/I/81Dky+tyvqL.jpg' WHERE media_title = 'The Psychology of Money';
UPDATE reviews SET cover = 'https://image.api.nintendo.com/v1/cat_box/repo/np/pl/70010000061369/box.png' WHERE media_title = 'Elden Ring';
UPDATE reviews SET cover = 'https://upload.wikimedia.org/wikipedia/en/a/a9/Starboy_The_Weeknd_album_cover.png' WHERE media_title = 'Starboy';
UPDATE reviews SET cover = 'https://image.tmdb.org/t/p/w500/o7qi2097KejWCO1q2z1Pg85oi82.jpg' WHERE media_title = 'Stranger Things';
UPDATE reviews SET cover = 'https://image.tmdb.org/t/p/w500/8Gxv8kSoNmQQciqVTXAwaay6OnO.jpg' WHERE media_title = 'Oppenheimer';
`;

async function createConnectionPool() {
  if (pool) return pool;
  if (poolPromise) return poolPromise;

  poolPromise = initPool();
  return poolPromise;
}

async function initPool() {
  const isVercel = process.env.VERCEL === '1';
  
  console.log('[DB] Inicializando pool de conexión...');
  console.log('[DB] VERCEL:', isVercel);
  console.log('[DB] DATABASE_URL existe:', !!process.env.DATABASE_URL);
  
  let config;
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    console.log('[DB] Parseando DATABASE_URL...');
    console.log('[DB] DATABASE_URL (primeros 50 chars):', url.substring(0, 50) + '...');
    
    try {
      const params = new URL(url);
      const port = params.port || (url.includes('pooler') ? 6543 : 5432);
      config = {
        host: params.hostname,
        port: parseInt(port),
        database: params.pathname?.replace('/', '') || 'postgres',
        user: params.username,
        password: params.password,
        ssl: { rejectUnauthorized: false },
        max: isVercel ? 1 : 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: isVercel ? 5000 : 10000
      };
      console.log('[DB] Config parseada:');
      console.log('[DB]   Host:', config.host);
      console.log('[DB]   Port:', config.port);
      console.log('[DB]   Database:', config.database);
      console.log('[DB]   User:', config.user);
      console.log('[DB]   Is pooler:', url.includes('pooler'));
    } catch (parseError) {
      console.error('[DB] Error parseando URL:', parseError.message);
      throw parseError;
    }
  } else {
    console.log('[DB] No hay DATABASE_URL, usando configuración manual');
    config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'postgres',
      port: process.env.DB_PORT || 5432,
      max: isVercel ? 1 : 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: isVercel ? 5000 : 10000
    };
  }

  try {
    console.log('[DB] Creando Pool...');
    pool = new Pool(config);
    
    console.log('[DB] Pool creado, intentando obtener conexión...');
    const dbConn = await pool.connect();
    console.log('[DB] Conexión exitosa a la base de datos');

    console.log('[DB] Verificando tablas...');
    const tablesCheck = await dbConn.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    if (tablesCheck.rows.length === 0) {
      console.log('[DB] Creando tablas...');
      const statements = CREATE_TABLES_SQL.split(';').map(s => s.trim()).filter(s => s);
      for (const stmt of statements) {
        try {
          await dbConn.query(stmt);
        } catch (e) {
          console.warn('[DB] Advertencia:', e.message);
        }
      }
      console.log('[DB] Tablas creadas exitosamente');

      console.log('[DB] Insertando datos iniciales...');
      const seedStatements = SEED_DATA_SQL.split(';').map(s => s.trim()).filter(s => s);
      for (const stmt of seedStatements) {
        try {
          await dbConn.query(stmt);
        } catch (e) {
          console.warn('[DB] Advertencia seed:', e.message);
        }
      }
      console.log('[DB] Datos iniciales insertados');
    } else {
      console.log('[DB] Las tablas ya existen');
    }

    dbConn.release();

    console.log('[DB] 🎉 Base de datos lista!');

    return pool;
    
  } catch (error) {
    console.error('[DB] Error de conexión a la base de datos:', error.message);
    console.error('[DB] Error stack:', error.stack);
    console.error('[DB] DATABASE_URL:', process.env.DATABASE_URL ? 'present' : 'MISSING');
    if (!isVercel) {
      process.exit(1);
    }
    // En Vercel, devolver null y loguear
    return null;
  }
}

module.exports = createConnectionPool;

module.exports.closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    poolPromise = null;
  }
};

