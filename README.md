# Sistema de Gestión de Tareas - Full Stack Application

## Descripción del Proyecto

Esta es una aplicación full stack para la gestión de tareas personales. La aplicación permite a los usuarios crear, editar, eliminar y marcar tareas como completadas sin necesidad de autenticación, simplificando el uso y enfocándose en la funcionalidad principal.

## Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución JavaScript
- **Express.js** - Framework web para Node.js
- **MySQL** - Base de datos relacional
- **mysql2** - Driver MySQL para Node.js
- **cors** - Configuración de CORS
- **dotenv** - Gestión de variables de entorno

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos con diseño moderno
- **JavaScript (ES6+)** - Lógica del cliente
- **Fetch API** - Comunicación con el backend

## Estructura del Proyecto

```
Proyecto-Final-Full-Stack/
├── backend/
│   ├── database/
│   │   └── connection.js    # Configuración de base de datos con auto-configuración
│   ├── middleware/
│   │   └── errorHandler.js  # Middleware de manejo de errores
│   ├── routes/
│   │   └── tasks.js         # Rutas de gestión de tareas
│   ├── package.json         # Dependencias del proyecto
│   └── server.js            # Servidor principal
├── frontend/
│   ├── index.html           # Página principal
│   ├── styles.css           # Estilos CSS
│   └── script.js            # Lógica JavaScript
├── mysql.sql                # Script de base de datos
├── DESPLIEGUE.md            # Guía completa de despliegue
└── README.md               # Documentación
```

## Endpoints de la API

### Tareas

#### GET /api/tasks
Obtiene todas las tareas ordenadas por fecha de creación.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Aprender Express",
    "description": "Conceptos Básicos",
    "completed": false,
    "created_at": "2024-01-01T10:00:00.000Z",
    "updated_at": "2024-01-01T10:00:00.000Z"
  }
]
```

#### GET /api/tasks/my-tasks
Endpoint alternativo que retorna todas las tareas (para compatibilidad).

#### POST /api/tasks
Crea una nueva tarea.

**Body:**
```json
{
  "title": "Nueva Tarea",
  "description": "Descripción opcional"
}
```

**Response:**
```json
{
  "message": "Tarea creada exitosamente",
  "id": 123
}
```

#### PUT /api/tasks/:id
Actualiza una tarea existente.

**Body:**
```json
{
  "title": "Título Actualizado",
  "description": "Descripción actualizada",
  "completed": true
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

**Response:**
```json
{
  "message": "Tarea eliminada exitosamente"
}
```

## Configuración del Entorno

## Base de Datos

El sistema incluye auto-configuración de la base de datos:

1. Al iniciar, intenta conectar con valores por defecto (localhost, root sin contraseña)
2. Si falla, solicita credenciales por terminal
3. Verifica si la base de datos existe
4. Si no existe, ejecuta automáticamente el script `mysql.sql`

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

3. Ejecuta el servidor:
   ```bash
   npm start
   ```

El servidor estará corriendo en `http://localhost:3001`

### Frontend

El frontend se sirve automáticamente desde el backend. Puedes acceder a la aplicación en `http://localhost:3001`

## Características Principales

### Gestión de Tareas
- CRUD completo de tareas sin autenticación
- Filtros (Todas, Pendientes, Completadas)
- Actualización de estado (completada/pendiente)
- Timestamps de creación y actualización
- Interfaz limpia y directa

### Interfaz de Usuario
- Diseño moderno y responsivo
- Animaciones y transiciones suaves
- Toast notifications para feedback
- Validación de formularios
- Interacciones dinámicas sin recargar página

### Características Técnicas
- Auto-configuración de base de datos
- Conexión segura a MySQL
- Manejo centralizado de errores
- API RESTful bien estructurada
- Código modular y mantenible

## Seguridad Implementada

### Backend
- Validación de entrada en todos los endpoints
- Manejo de errores sin exponer información sensible
- Configuración CORS segura
- Conexión segura a base de datos

### Frontend
- Sanitización de HTML para prevenir XSS
- Validación de formularios en el cliente
- Manejo seguro de credenciales de base de datos

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

Para una guía completa de despliegue, incluyendo configuración local y producción, consulta el archivo [DESPLEGUE.md](./DESPLEGUE.md).

### Local Rápido
1. Instala Node.js y MySQL
2. Clona el repositorio
3. Ejecuta `npm install` en la carpeta backend
4. Ejecuta `npm start`
5. Accede a `http://localhost:3001`

