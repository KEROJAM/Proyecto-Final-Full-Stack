const express = require('express');
const mysql = require('mysql2');

const app = express();

const db = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	database: 'todo_db'
});

db.connect(err => {
	if (err) {
		console.error(err);
	} else {
		console.log('Conectado a MySQL');
	}
});

app.get('/api/tasks', (req, res) => {
	db.execute('SELECT * FROM tasks ORDER BY created_at DESC',
		(err, results) => {
			if (err) return res.status(500).json(err);
			res.json(results);
		});
});

app.listen(3000, () => {
	console.log('Servidor en http://localhost:3000');
});


app.post('/api/tasks', (req, res) => {
	const { title, description } = req.body;

	if (!title) {
		return res.status(400).json({ error: 'El titulo es obligatorio' });
	}
	const query = "INSERT INTO tasks (title, description) VALUES (?,?)";

	db.execute(query, [title, description], (err, results) => {
		if (err) return res.status(500).json(err);
		res.status(201).json({
			message: 'Tarea Creada',
			id: result.insertId
		});
	});
});
