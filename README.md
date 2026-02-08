# Sistema de Gestión de Tareas - Full Stack Application

## Descripción del Proyecto

Esta es una aplicación full stack para la gestión de tareas personales con autenticación de usuarios. La aplicación permite a los usuarios registrarse, iniciar sesión, crear, editar, eliminar y marcar tareas como completadas.

## Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución JavaScript
- **Express.js** - Framework web para Node.js
- **MySQL** - Base de datos relacional
- **JWT (JSON Web Tokens)** - Autenticación y autorización
- **bcryptjs** - Encriptación de contraseñas
- **cors** - Configuración de CORS
- **dotenv** - Gestión de variables de entorno

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos con diseño Glassmorphism
- **JavaScript (ES6+)** - Lógica del cliente
- **Fetch API** - Comunicación con el backend

## Estructura del Proyecto

```
Proyecto-Final-Full-Stack-cp/
├── backend/
│   ├── middleware/
│   │   ├── auth.js          # Middleware de autenticación
│   │   └── errorHandler.js  # Middleware de manejo de errores
│   ├── routes/
│   │   ├── auth.js          # Rutas de autenticación
│   │   └── tasks.js         # Rutas de gestión de tareas
│   ├── database/
│   │   └── connection.js    # Configuración de base de datos
│   ├── .env                 # Variables de entorno
│   ├── package.json         # Dependencias del proyecto
│   └── server.js            # Servidor principal
├── frontend/
│   ├── index.html           # Página principal
│   ├── styles.css           # Estilos CSS
│   └── script.js            # Lógica JavaScript
├── mysql.sql                # Script de base de datos
└── README.md               # Documentación
```

## Endpoints de la API

### Autenticación

#### POST /api/auth/register
Registra un nuevo usuario.

**Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Usuario registrado exitosamente",
  "token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string"
  }
}
```

#### POST /api/auth/login
Inicia sesión de un usuario existente.

**Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login exitoso",
  "token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string"
  }
}
```

### Tareas

#### GET /api/tasks
Obtiene todas las tareas públicas.

**Response:**
```json
[
  {
    "id": "number",
    "title": "string",
    "description": "string",
    "completed": "boolean",
    "user_id": "number",
    "created_at": "string",
    "updated_at": "string"
  }
]
```

#### GET /api/tasks/my-tasks
Obtiene las tareas del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "number",
    "title": "string",
    "description": "string",
    "completed": "boolean",
    "user_id": "number",
    "created_at": "string",
    "updated_at": "string"
  }
]
```

#### POST /api/tasks
Crea una nueva tarea.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "string",
  "description": "string"
}
```

**Response:**
```json
{
  "message": "Tarea creada exitosamente",
  "id": "number"
}
```

#### PUT /api/tasks/:id
Actualiza una tarea existente.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "string",
  "description": "string",
  "completed": "boolean"
}
```

**Response:**
```json
{
  "message": "Tarea actualizada exitosamente"
}
```

#### DELETE /api/tasks/:id
Elimina una tarea.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Tarea eliminada exitosamente"
}
```

## Configuración del Entorno

### Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/` con las siguientes variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=todo_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5500
```

### Base de Datos

1. Asegúrate de tener MySQL instalado y corriendo
2. Ejecuta el script `mysql.sql` para crear la base de datos y las tablas:
   ```bash
   mysql -u root -p < mysql.sql
   ```

## Instalación y Ejecución

### Backend

1. Navega a la carpeta del backend:
   ```bash
   cd backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno (ver sección anterior)

4. Ejecuta el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   O en modo producción:
   ```bash
   npm start
   ```

El servidor estará corriendo en `http://localhost:3000`

### Frontend

El frontend se sirve automáticamente desde el backend. Puedes acceder a la aplicación en `http://localhost:3000`

## Características Principales

### Autenticación y Seguridad
- Registro de usuarios con validación
- Inicio de sesión con JWT
- Encriptación de contraseñas con bcrypt
- Middleware de autenticación
- Manejo seguro de errores

### Gestión de Tareas
- CRUD completo de tareas
- Filtros (Todas, Pendientes, Completadas)
- Asignación de tareas a usuarios
- Actualización de estado (completada/pendiente)
- Timestamps de creación y actualización

### Interfaz de Usuario
- Diseño moderno con Glassmorphism
- Responsive design
- Animaciones y transiciones suaves
- Toast notifications para feedback
- Validación de formularios
- Interacciones dinámicas sin recargar página

## Seguridad Implementada

### Backend
- Encriptación de contraseñas con bcrypt (salt rounds: 10)
- Tokens JWT con expiración configurable
- Middleware de autenticación para rutas protegidas
- Validación de entrada en todos los endpoints
- Manejo de errores sin exponer información sensible
- Configuración CORS segura

### Frontend
- Sanitización de HTML para prevenir XSS
- Validación de formularios en el cliente
- Almacenamiento seguro de tokens en localStorage
- Manejo seguro de credenciales

## Mejores Prácticas

- Código modular y mantenible
- Separación de responsabilidades
- Manejo centralizado de errores
- Variables de entorno para configuración
- Comentarios descriptivos
- Convenciones de nomenclatura consistentes
- Responsive design
- Accesibilidad web (WCAG)

## Despliegue

### Local
Sigue los pasos de instalación mencionados anteriormente.

### Producción (Opcional)
1. Configura las variables de entorno para producción
2. Cambia `NODE_ENV=production`
3. Usa un secreto JWT seguro
4. Configura HTTPS
5. Considera usar PM2 para gestión de procesos
6. Implementa una base de datos en la nube (AWS RDS, etc.)

## Contribuciones

Este proyecto fue desarrollado como parte de un reto full stack para demostrar competencias en:
- Desarrollo backend con Node.js/Express
- Diseño y desarrollo frontend
- Autenticación y seguridad
- Gestión de bases de datos
- Despliegue de aplicaciones web

## Licencia

Este proyecto es para fines educativos y de demostración.