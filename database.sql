-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS one_sentence_reviews;
USE one_sentence_reviews;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) DEFAULT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de reviews
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    media_type ENUM('book', 'movie', 'tv', 'anime', 'music', 'game') NOT NULL,
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

-- Tabla de tags (tipos de review: funny, serious, made-me-cry, etc.)
CREATE TABLE IF NOT EXISTS review_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla pivote para relación review-tags
CREATE TABLE IF NOT EXISTS review_tag_map (
    review_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (review_id, tag_id),
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES review_tags(id) ON DELETE CASCADE
);

-- Tabla de reacciones (heart, laughing, crying, surprised)
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

-- Insertar tags por defecto
INSERT INTO review_tags (name) VALUES 
    ('funny'),
    ('serious'),
    ('made-me-cry'),
    ('thought-provoking'),
    ('recommend'),
    ('skip-it'),
    ('underrated'),
    ('overrated'),
    ('inspiring'),
    ('mind-blowing')
ON DUPLICATE KEY UPDATE name = name;

-- Insertar usuarios de prueba (password: password123)
INSERT INTO users (username, name, email, password, role) VALUES 
    ('demo', 'Juan Pérez', 'demo@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
    ('maria_dev', 'María García', 'maria@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
    ('david_tech', 'david López', 'david@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
    ('ana_arts', 'Ana Martínez', 'ana@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
    ('luis_gamer', 'Luis Rodríguez', 'luis@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user')
ON DUPLICATE KEY UPDATE username = username;

-- Insertar reviews de ejemplo
INSERT INTO reviews (user_id, media_type, media_title, cover, review_text, rating) VALUES 
    (1, 'movie', 'Dune: Part Two', 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', 'Visually stunning, but I needed 3 hours to recover emotionally.', 5),
    (2, 'book', 'Atomic Habits', 'https://images-na.ssl-images-amazon.com/images/I/81wgcld4wxL.jpg', 'Good concepts, but I skimmed 80% of it.', 3),
    (3, 'game', 'Hades', 'https://image.api.nintendo.com/v1/cat_box/repo/np/pl/70010000042508/box.png', 'Finally beat it after 200 deaths, worth every one.', 5),
    (4, 'tv', 'Breaking Bad', 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', 'Started watching at 11pm, finished season 1 at 3am. No regrets.', 5),
    (5, 'music', 'Random Access Memories', 'https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg', 'Made me feel like I was in a sci-fi movie soundtrack.', 4),
    (2, 'book', 'Project Hail Mary', 'https://images-na.ssl-images-amazon.com/images/I/91vS2Ph2S5L.jpg', 'The friendliest science book ever written.', 5),
    (3, 'movie', 'Everything Everywhere All At Once', 'https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', 'I still do not understand the bagel.', 4),
    (4, 'tv', 'The Office', 'https://image.tmdb.org/t/p/w500/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg', 'Watched it during hard times, it literally saved my mental health.', 5),
    (5, 'game', 'Stardew Valley', 'https://image.api.nintendo.com/v1/cat_box/repo/np/pl/70010000037653/box.png', 'I have 400 hours and no shame.', 4),
    (1, 'music', 'Blue Moon', 'https://upload.wikimedia.org/wikipedia/en/7/71/Blue_Moon_%28Young_Thug_album%29.jpg', 'Listened to this on repeat for three days straight.', 3);

-- Agregar tags a las reviews de ejemplo
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
    (10, 1);
