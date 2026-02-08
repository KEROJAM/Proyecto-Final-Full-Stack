CREATE DATABASE IF NOT EXISTS todo_db;
USE todo_db;

CREATE TABLE IF NOT EXISTS tasks (
	id INT AUTO_INCREMENT PRIMARY KEY,
	title VARCHAR(255) NOT NULL,
	description TEXT,
	completed BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	INDEX idx_created_at (created_at)
);

-- Insertar tareas de prueba
INSERT INTO tasks (title, description, completed) VALUES
('Aprender Express', 'Conceptos Básicos', FALSE),
('Conectar MySQL', 'Probar Conexion', TRUE);
