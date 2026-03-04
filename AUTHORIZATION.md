# Sistema de Autorización por Roles

Este documento describe cómo usar el sistema de autorización por roles implementado en el backend.

## Estructura

### 1. **Roles Disponibles**
- `user`: Usuario regular con acceso limitado
- `admin`: Administrador con acceso completo

### 2. **Archivos Principales**

- **`middleware/auth.js`**: Middleware de autenticación. Verifica el JWT y obtiene el usuario actual incluyendo su rol.
- **`middleware/authorization.js`**: Middleware de autorización. Protege rutas según el rol del usuario.
- **`models/User.js`**: Modelo de datos. Incluye métodos para gestionar roles.
- **`controllers/roleController.js`**: Controlador para operaciones administrativas de roles.
- **`database.sql`**: Schema de la base de datos con la columna `role` agregada a la tabla `users`.

## Cómo Usar

### Proteger una Ruta (Require Admin)

```javascript
const authMiddleware = require('./middleware/auth');
const { requireAdmin } = require('./middleware/authorization');

// Ruta que solo admins pueden acceder
app.delete('/api/reviews/:id', 
    authMiddleware,           // Primero autenticar
    requireAdmin,             // Luego verificar que es admin
    reviewController.deleteReview
);
```

### Proteger una Ruta (Require Rol Específico)

```javascript
const { requireRole } = require('./middleware/authorization');

// Solo usuarios con rol 'admin' pueden acceder
app.post('/api/admin/users/:userId/role',
    authMiddleware,
    requireRole('admin'),
    roleController.updateUserRole
);

// Múltiples roles permitidos
app.get('/api/dashboard',
    authMiddleware,
    requireRole(['admin', 'moderator']),
    dashboardController.getDashboard
);
```

### Proteger una Ruta (Owner o Admin)

```javascript
const { requireOwnerOrAdmin } = require('./middleware/authorization');

// El usuario solo puede modificar sus propias reviews, pero los admins pueden modificar cualquiera
app.put('/api/reviews/:id',
    authMiddleware,
    requireOwnerOrAdmin('userId'), // Parámetro por defecto es 'userId'
    reviewController.updateReview
);

// O con un parámetro personalizado
app.put('/api/users/:userId/profile',
    authMiddleware,
    requireOwnerOrAdmin('userId'),
    userController.updateProfile
);
```

### Obtener el Rol del Usuario Actual

```javascript
// En cualquier ruta protegida, el usuario y su rol están disponibles en req.user

app.get('/api/profile',
    authMiddleware,
    (req, res) => {
        res.json({
            id: req.user.id,
            username: req.user.username,
            role: req.user.role  // <-- Rol del usuario
        });
    }
);
```

## Operaciones Administrativas

### Obtener Todos los Usuarios (Admin)

```javascript
const { requireAdmin } = require('./middleware/authorization');
const roleController = require('./controllers/roleController');

app.get('/api/admin/users',
    authMiddleware,
    requireAdmin,
    roleController.getAllUsers
);
```

**Parámetros Query:**
- `page` (default: 1): Número de página
- `limit` (default: 20): Usuarios por página

**Respuesta:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "username": "demo",
            "name": "Juan Pérez",
            "email": "demo@example.com",
            "role": "admin",
            "created_at": "2024-01-15T10:00:00Z"
        },
        // ... más usuarios
    ],
    "pagination": {
        "total": 50,
        "page": 1,
        "limit": 20,
        "pages": 3
    }
}
```

### Cambiar el Rol de un Usuario (Admin)

```javascript
app.post('/api/admin/users/:userId/role',
    authMiddleware,
    requireAdmin,
    roleController.updateUserRole
);
```

**Body:**
```json
{
    "role": "admin"
}
```

**Respuesta:**
```json
{
    "success": true,
    "message": "Rol de usuario actualizado a \"admin\"",
    "data": {
        "id": 2,
        "username": "maria_dev",
        "email": "maria@example.com",
        "role": "admin"
    }
}
```

### Obtener Información de un Usuario (Admin)

```javascript
app.get('/api/admin/users/:userId',
    authMiddleware,
    requireAdmin,
    roleController.getUserById
);
```

### Obtener Información del Usuario Actual (Autenticado)

```javascript
app.get('/api/me',
    authMiddleware,
    roleController.getCurrentUser
);
```

## Ejemplo Completo de Rutas

```javascript
// routes/admin.js
const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authorization');
const roleController = require('../controllers/roleController');

const router = express.Router();

// Obtener todos los usuarios
router.get('/users', 
    authMiddleware, 
    requireAdmin, 
    roleController.getAllUsers
);

// Cambiar rol de un usuario
router.post('/users/:userId/role', 
    authMiddleware, 
    requireAdmin, 
    roleController.updateUserRole
);

// Obtener detalles de un usuario
router.get('/users/:userId', 
    authMiddleware, 
    requireAdmin, 
    roleController.getUserById
);

module.exports = router;

// En server.js
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
```

## Cambio en la Base de Datos

Se agregó una columna `role` a la tabla `users`:

```sql
ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user';
```

Usuarios de prueba:
- `demo` (admin): puede administrar el sistema
- `maria_dev`, `david_tech`, `ana_arts`, `luis_gamer` (user): usuarios regulares

## Consideraciones de Seguridad

1. **Protege siempre las rutas admin**: Usa `requireAdmin` o `requireRole` en todas las rutas sensibles.

2. **Orden de middlewares**: Siempre coloca `authMiddleware` ANTES de `requireAdmin` o `requireRole`.

3. **Validación adicional**: Para operaciones críticas, valida los datos de entrada además de los permisos.

4. **Logging**: Registra cambios de roles para auditoría:

```javascript
async updateUserRole(req, res) {
    // ... código ...
    console.log(`Admin ${req.user.username} cambió rol de usuario ${userId} a ${role}`);
    // ... más código ...
}
```

5. **Prevenir auto-exclusión**: No permitas que un admin se quite a sí mismo los permisos (ya implementado en `roleController.js`).

## Tokens JWT

Los tokens JWT ahora incluyen el ID del usuario. El rol se obtiene de la base de datos durante la autenticación, lo que significa que los cambios de rol toman efecto inmediatamente en el siguiente request.

Estructura del token (decodificado):
```json
{
    "userId": 1,
    "iat": 1234567890
}
```

## Flujo de Autenticación y Autorización

```
Request HTTP
    ↓
authMiddleware (verifica JWT, obtiene usuario y rol)
    ↓
requireAdmin / requireRole (verifica rol)
    ↓
Controlador
```

Si falta el token → 401 Unauthorized
Si token inválido → 401 Unauthorized
Si token expirado → 401 Token expirado
Si usuario no autenticado → 401 No autenticado
Si rol insuficiente → 403 Acceso denegado
