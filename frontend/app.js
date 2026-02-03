const API_URL = 'http://localhost:3000/api/tasks';

const container = document.getElementById('tasksContainer');

async function loadTasks() {
	const response = await fetch(API_URL);
	const tasks = await response.json();

	renderTasks(tasks);
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
