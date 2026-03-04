# Solución de Errores: Role Column y Token Inválido

## Problema 1: Error 412 - Column "role" does not exist

### Causa
La tabla `users` en PostgreSQL no tenía la columna `role`, pero el código intenta insertarla.

### Soluciones Aplicadas
1. ✅ Actualizado `backend/database/connection.js`:
   - Agregada columna `role VARCHAR(20) DEFAULT 'user'` al CREATE TABLE users
   - Actualizado INSERT de usuarios seed para incluir `role = 'user'`

2. ✅ Creado `backend/database/migrations.js`:
   - Migración que agrega la columna `role` a usuarios existentes
   - Usa IF NOT EXISTS para evitar errores si ya existe

3. ✅ Modificado `backend/server.js`:
   - Importada función `runMigrations` 
   - Ejecuta migraciones automáticamente al iniciar el servidor

### Acciones Necesarias
**Reinicia el contenedor de backend para ejecutar las migraciones:**
```bash
docker-compose down
docker-compose up --build
```

O si estás en desarrollo local:
```bash
npm start
```

## Problema 2: Error 401 - Token Inválido

### Posibles Causas
1. **Inconsistencia de JWT_SECRET**: El token fue generado con un JWT_SECRET diferente al actual
2. **Token expirado**: El token tiene más de 24 horas
3. **Usuario no existe en BD**: El usuario fue eliminado o la BD se reinició

### Diagnóstico
Abre tu navegador y accede a:
```
GET http://localhost:5000/api/debug/jwt
```
Deberías ver algo como:
```json
{
  "jwt_configured": true/false,
  "jwt_secret_hash": "abc12345...",
  "message": "JWT_SECRET está configurado en vars de entorno"
}
```

Si `jwt_configured` es `false`, necesitas configurar `JWT_SECRET` en:
- **Local**: Archivo `.env`
- **Docker**: `docker-compose.yml` en variables de entorno
- **Vercel**: Variables de entorno del proyecto

### Testing de Token
Después de hacer login, obtén el token y verifica su validez:
```bash
curl -X POST http://localhost:5000/api/debug/verify-token \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Solución
1. **Para desarrollo local**: Asegúrate que el archivo `.env` tenga:
   ```
   JWT_SECRET=your_secret_key_here
   ```

2. **Para Docker**: En `docker-compose.yml`, agrega:
   ```yaml
   environment:
     - JWT_SECRET=your_secret_key_here
   ```

3. **Limpiar BD e intentar de nuevo**:
   ```bash
   # Elimina el volumen PostgreSQL
   docker volume ls
   docker volume rm proyecto-final-full-stack_postgres_data
   
   # Reinicia los contenedores
   docker-compose down
   docker-compose up --build
   ```

## Flujo Correcto Después de las Correcciones

1. **Registrar usuario**:
   ```bash
   POST /api/auth/register
   {
     "username": "testuser",
     "name": "Test User",
     "email": "test@example.com",
     "password": "password123"
   }
   ```
   ✅ Obtiene un JWT token válido

2. **Crear review**:
   ```bash
   POST /api/reviews
   Headers: Authorization: Bearer {token}
   {
     "media_type": "movie",
     "media_title": "Test Movie",
     "review_text": "Great movie!",
     "rating": 5
   }
   ```
   ✅ No debe dar error 401

## Variables de Entorno Críticas

Asegúrate que en `.env` o `docker-compose.yml` estén configuradas:
- `JWT_SECRET`: Secret para firmar JWTs (obligatorio)
- `DATABASE_URL`: Conexión a PostgreSQL
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Credenciales si usas variables individuales

## Verificación Final

Después de reiniciar, verifica:
1. El servidor inicia sin errores de BD
2. Puedes registrar un usuario
3. El login devuelve un token
4. Puedes crear una review con token autenticado

Si aún hay problemas, activa debug:
```bash
DEBUG_AUTH=1 npm start
```
Esto mostrará logs detallados de autenticación.
