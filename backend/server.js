const express = require('express');
const mysql = require('mysql2');

const app = express();

const db = mysql.createConnection({
	host: 'localhost',
	user: 'tu_usuario',
	password: 'tu_password',
	database: 'todo_db'
});

db.connect(err => {
	if (err) {
		console.error(err);
	} else {
		console.log('Conectado a MySQL');
	}
});

app.get('api/tasks', (req, res) => {
	db.execute('SELECT * FROM tasks ORDER BY created_at DESC',
		(err, results) => {
			if (err) return res.status(500).json(err);
			res.json(results);
		});
});

app.listen(3000, () => {
	console.log('Servidor en http://localhost:3000');
});
