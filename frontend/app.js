const API_URL = 'http://localhost:3000/api/tasks';

const container = document.getElementById('tasksContainer');
const form = document.getElementById('taskForm');

async function loadTasks() {
	const response = await fetch(API_URL);
	const tasks = await response.json();

	renderTasks(tasks);
}

async function deleteTask(id) {
	const confirmDelete = confirm('Desea eliminar esta tarea?');

	if (!confirmDelete) {
		return;
	}

	await fetch(`${API_URL}/${id}`, {
		method: 'DELETE'
	});
}

function renderTasks(tasks) {
	container.innerHTML = "";

	tasks.forEach(task => {
		const div = document.createElement('div');
		div.innerHTML = `
			<h3>${task.title}</h3>
			<p>${task.description}</p>
			<hr>
		`;
		container.appendChild(div);
	});
}

document.addEventListener('DOMContentLoaded', loadTasks);

form addEventListener('submit', async (e) => {
	e.preventDefault();
	const title = document.getElementById('title').value;
	const description = document.getElementById('description').value;

	await fetch(API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ title, description })
	});

	form.reset();

	loadTasks();
});

form.addEventListener('submit', async (e) => {
	e.preventDefault();

	const title = document
});
