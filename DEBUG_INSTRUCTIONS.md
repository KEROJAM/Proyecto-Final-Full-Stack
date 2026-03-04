# Guía de Diagnóstico: Errores de Autenticación y Registro

He agregado logging detallado para diagnosticar los dos problemas:
1. Error 500 en `/api/auth/register`
2. Error 401 "Token inválido" en `/api/reviews`

## Pasos para Diagnosticar

### 1. Verifica el Jest JWT_SECRET

#### Opción A: Endpoint de debug (recomendado)

```bash
# GET /api/debug/jwt
curl https://proyecto-final-full-stack-eight.vercel.app/api/debug/jwt

# Respuesta esperada:
# {
#   "jwt_configured": true,
#   "jwt_secret_hash": "abc12345...",
#   "message": "JWT_SECRET está configurado en vars de entorno"
# }
```

Si `jwt_configured` es `false`, **necesitas configurar JWT_SECRET en Vercel**.

#### Opción B: Debug completo con token

```bash
# POST /api/debug/jwt-status
# Con Authorization header
curl -X POST https://proyecto-final-full-stack-eight.vercel.app/api/debug/jwt-status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"

# O sin Authorization (solamente verifica config)
curl -X POST https://proyecto-final-full-stack-eight.vercel.app/api/debug/jwt-status \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN_HERE"}'
```

Esto mostrará:
- Si JWT_SECRET está configurado
- Hash del secret siendo usado
- Análisis del token (si proporcionas uno)

### 2. Intenta Registrar un Usuario y Revisa los Logs

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Si falla, revisa el log:**
- Backend mostrará `[REGISTER] ❌ Error en register:` con detalles específicos
- El error tendrá: `message`, `code`, `detail`, `hint`

### 3. Si el Registro Funciona, Testea el Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Respuesta aquí será:
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

### 4. Usa el Token para Crear una Review

```bash
curl -X POST http://localhost:5000/api/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "media_type": "movie",
    "media_title": "Test Movie",
    "review_text": "Great movie!",
    "rating": 5
  }'
```

## Errores Comunes y Cómo Resolverlos

### Error 500 en Registration: "Error al registrar usuario"

**Causas posibles (en orden de probabilidad):**

1. **Columna `role` no existe en BD**: 
   - Solución: Reinicia los contenedores para ejecutar migraciones
   ```bash
   docker-compose down
   docker-compose up --build
   ```

2. **Conexión a BD fallida**:
   - Revisa logs: `[USER.CREATE] ❌ Error al crear usuario`
   - Verifica variables de entorno: `DATABASE_URL` o `DB_HOST`, `DB_USER`, etc.

3. **Email/Username duplicado**:
   - El error debería ser 400, no 500
   - Usa un email y username únicos

---

### Error 401 "Token inválido" en /api/reviews

**Causas posibles:**

#### 1. **JWT_SECRET inconsistente** (Problema más probable en Vercel)

Login usa un JWT_SECRET, pero la validación usa otro.

**Solución:**
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Settings → Environment Variables
4. Agrega o actualiza `JWT_SECRET` con un valor consistente:
   ```
   JWT_SECRET=tu_clave_secret_super_segura_aqui_cambiala
   ```
5. Redeploy el proyecto

#### 2. **Token expirado**

JWT tiene expiración de 24h. Si el token es antiguo:
- Solución: Haz login de nuevo para obtener un token fresco

#### 3. **Usuario fue eliminado/BD fue reseteada**

Si la BD se resetea pero tienes un token antiguo:
- Solución: Registra usuario nuevo, haz login, obtén token nuevo

---

## Variables de Entorno Requeridas

### Para un deploy en Vercel:

```
JWT_SECRET=tu_secret_aqui_cambialo_en_produccion
DATABASE_URL=postgresql://user:password@host:5432/dbname
DEBUG_AUTH=0
```

### Para desarrollo local (.env):

```
JWT_SECRET=dev_secret_key
DATABASE_URL=postgresql://localhost:5432/reviews_db
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=reviews_db
DEBUG_AUTH=1
```

---

## Logs Detallados Esperados

### Registro exitoso:
```
[REGISTER] Iniciando registro para: test@example.com
[REGISTER] Hasheando password...
[REGISTER] Creando usuario en BD...
[USER.CREATE] Iniciando creación de usuario: { username: 'testuser', email: 'test@example.com', role: 'user' }
[USER.CREATE] Ejecutando query: INSERT INTO users...
[USER.CREATE] ✅ Usuario creado con ID: 42
[REGISTER] Usuario creado con ID: 42
[REGISTER] Generando JWT...
[REGISTER] ✅ Registro exitoso para: test@example.com
```

### Login exitoso:
```
[LOGIN] Iniciando login para: test@example.com
[LOGIN] ✅ Login exitoso para: 42 | JWT_SECRET configured: true
```

### Verificación de token exitosa:
```
[AUTH MIDDLEWARE] Verificando token para: POST /api/reviews
[AUTH MIDDLEWARE] Token preview: eyJhbGciOiJIUzI1NiIs...
[AUTH MIDDLEWARE] JWT_SECRET configured: true
[AUTH MIDDLEWARE] ✅ JWT verificado exitosamente para userId: 42
[AUTH MIDDLEWARE] ✅ Usuario encontrado: 42 testuser
```

---

## Resumen de Soluciones Rápidas

Si tienes los dos problemas:

### 1. Error 500 en registro:
```bash
docker-compose down
docker-compose up --build
```

### 2. Token inválido en reviews (en Vercel):
1. Verifica: `GET /api/debug/jwt`
2. Si `jwt_configured` es `false`:
   - Configura `JWT_SECRET` en Vercel Environment Variables
   - Redeploy

### 3. Si aún falla:
1. Activa logs: `DEBUG_AUTH=1` en variables de entorno
2. Ejecuta: `GET /api/debug/jwt-status` con un token para ver análisis detallado
3. Registra usuario nuevo y prueba de nuevo
