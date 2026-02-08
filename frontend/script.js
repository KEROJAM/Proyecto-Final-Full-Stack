const API_URL = 'http://localhost:3001/api';

// Elementos del DOM
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const appSection = document.getElementById('appSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const taskForm = document.getElementById('taskForm');
const tasksList = document.getElementById('tasksList');
const userDisplay = document.getElementById('userDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Variables globales
let currentUser = null;
let currentTasks = [];
let currentFilter = 'all';

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    showApp();
    loadTasks();
});

// Configurar event listeners
function setupEventListeners() {
    // Formularios
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    taskForm.addEventListener('submit', handleTaskSubmit);

    // Navegación
    logoutBtn.addEventListener('click', handleLogout);
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegister();
    });
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });

    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            setFilter(e.target.dataset.filter);
        });
    });
}

// Verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
        currentUser = JSON.parse(user);
        showApp();
        loadTasks();
    } else {
        showLogin();
    }
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;

            showToast('Login exitoso', 'success');
            showApp();
            loadTasks();
        } else {
            showToast(data.error || 'Error en el login', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
        console.error('Error en login:', error);
    }
}

// Manejar registro
async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showToast('Las contraseñas no coinciden', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;

            showToast('Registro exitoso', 'success');
            showApp();
            loadTasks();
        } else {
            showToast(data.error || 'Error en el registro', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
        console.error('Error en registro:', error);
    }
}

// Manejar envío de tarea
async function handleTaskSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description })
        });

        const data = await response.json();

        if (response.ok) {
            showToast(data.message, 'success');
            taskForm.reset();
            loadTasks();
        } else {
            showToast(data.error || 'Error al crear tarea', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
        console.error('Error al crear tarea:', error);
    }
}

// Cargar tareas
async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks/my-tasks`);

        const tasks = await response.json();

        if (response.ok) {
            currentTasks = tasks;
            renderTasks();
        } else {
            showToast('Error al cargar tareas', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
        console.error('Error al cargar tareas:', error);
    }
}

// Renderizar tareas
function renderTasks() {
    const filteredTasks = filterTasks(currentTasks, currentFilter);

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<p class="loading">No hay tareas para mostrar</p>';
        return;
    }

    tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-header">
                <div>
                    <h3 class="task-title">${escapeHtml(task.title)}</h3>
                    ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                </div>
            </div>
            <div class="task-meta">
                <span>${formatDate(task.created_at)}</span>
                <div class="task-actions">
                    <button class="task-btn btn-complete" onclick="toggleTask(${task.id}, ${!task.completed})">
                        ${task.completed ? 'Pendiente' : 'Completar'}
                    </button>
                    <button class="task-btn btn-edit" onclick="editTask(${task.id})">
                        Editar
                    </button>
                    <button class="task-btn btn-delete" onclick="deleteTask(${task.id})">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Filtrar tareas
function filterTasks(tasks, filter) {
    switch (filter) {
        case 'completed':
            return tasks.filter(task => task.completed);
        case 'pending':
            return tasks.filter(task => !task.completed);
        default:
            return tasks;
    }
}

// Establecer filtro
function setFilter(filter) {
    currentFilter = filter;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    renderTasks();
}

// Toggle tarea (completar/pendiente)
async function toggleTask(id, completed) {
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed })
        });

        const data = await response.json();

        if (response.ok) {
            showToast(data.message, 'success');
            loadTasks();
        } else {
            showToast(data.error || 'Error al actualizar tarea', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
        console.error('Error al actualizar tarea:', error);
    }
}

// Editar tarea
function editTask(id) {
    const task = currentTasks.find(t => t.id === id);
    if (!task) return;

    const newTitle = prompt('Editar título:', task.title);
    if (!newTitle || newTitle === task.title) return;

    const newDescription = prompt('Editar descripción:', task.description || '');

    updateTask(id, newTitle, newDescription, task.completed);
}

// Actualizar tarea
async function updateTask(id, title, description, completed) {
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description, completed })
        });

        const data = await response.json();

        if (response.ok) {
            showToast(data.message, 'success');
            loadTasks();
        } else {
            showToast(data.error || 'Error al actualizar tarea', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
        console.error('Error al actualizar tarea:', error);
    }
}

// Eliminar tarea
async function deleteTask(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;

    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            showToast(data.message, 'success');
            loadTasks();
        } else {
            showToast(data.error || 'Error al eliminar tarea', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
        console.error('Error al eliminar tarea:', error);
    }
}

// Manejar logout
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    currentTasks = [];

    showToast('Sesión cerrada', 'success');
    showLogin();
}

// Mostrar login
function showLogin() {
    loginSection.style.display = 'flex';
    registerSection.style.display = 'none';
    appSection.style.display = 'none';
    loginForm.reset();
}

// Mostrar registro
function showRegister() {
    loginSection.style.display = 'none';
    registerSection.style.display = 'flex';
    appSection.style.display = 'none';
    registerForm.reset();
}

// Mostrar aplicación
function showApp() {
    loginSection.style.display = 'none';
    registerSection.style.display = 'none';
    appSection.style.display = 'block';
    
    userDisplay.textContent = `👤 Invitado`;
    logoutBtn.style.display = 'none';
}

// Mostrar toast
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Utilidades
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-ES');
}
