CREATE DATABASE IF NOT EXISTS todo_db;
USE todo_db;

CREATE TABLE IF NOT EXISTS tasks (
	id INT AUTO_INCREMEMNT PRIMARY KEY,
	title VARCHAR(255) NOT NULL,
	descsription TEXT,
	completed BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tasks (title, description, completed) VAULES
('Aprender Express', 'Concpetos Basicos', FALSE),
('COnectar MySQL', 'Probar Conexion', TRUE);
