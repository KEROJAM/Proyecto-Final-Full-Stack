const express = require('express');
const mysql = require('mysql2');
//const cors = require('cors');

const app = express();

const db = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	database: 'todo_db'
});

//app.use(cors());

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
	const title = req.body.title;
	const description = req.body.description;

	if (!title) {
		return res.status(400).json({ error: 'El titulo es obligatorio' });
	}
	const query = "INSERT INTO tasks (title, description) VALUES (?,?)";

	db.execute(query, [title, description], (err, result) => {
		if (err) return res.status(500).json(err);
		res.status(201).json({
			message: 'Tarea Creada',
			id: result.insertId
		});
	});
});

app.delete('/api/tasks/:id', (req, res) => {
	const { id } = req.params;

	const query = "DELETE FROM tasks WHERE id =?";

	db.execute(query, [id], (err, result) => {
		if (err) return res.status(500).json(err);

		if (result.affectedRows == 0) {
			return res.status(404).json({ erro: 'Tarea no encontrada' });
		}

		res.json({ message: 'Tarea eliminada' });
	});
});
