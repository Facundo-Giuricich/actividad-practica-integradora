# Biblioteca — TP Integrador TLP4

**Dominio:** C — Biblioteca
**Base de datos:** PostgreSQL + Sequelize
**Organización del backend:** Carpeta por tipo de archivo (Forma 1)

## Integrantes

- Giuricich, Facundo — [Facundo-Giuricich](https://github.com/Facundo-Giuricich)

## Descripción

Aplicación web full stack en TypeScript para gestionar los libros de una biblioteca. Cada libro
tiene un estado (`DISPONIBLE`, `PRESTADO` o `EN_REPARACION`). Los usuarios pueden suscribirse a
un libro y, cada vez que cambia su estado, reciben una notificación en su bandeja (in-app) y se
registra una línea en la consola del backend. El acceso a cada acción depende del rol del usuario
(`admin`, `operador` o `usuario`) y se valida en el backend.

## Requisitos previos

- Docker y Docker Compose
- Git
- (Opcional, para desarrollo local) Node.js 24

## Cómo ejecutar el proyecto

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/Facundo-Giuricich/<nombre-del-repo>.git
   cd <nombre-del-repo>
   ```

2. Crear el archivo de variables de entorno:

   ```bash
   cp .env.example .env
   ```

3. Levantar los servicios:

   ```bash
   docker compose up --build
   ```

4. No hay pasos extra: al iniciar, el backend crea las tablas y ejecuta el **seed automático**
   (permisos, roles, usuarios de prueba y algunos libros de ejemplo). En el log aparece:

   ```
   [SEED] 10 permisos, 3 roles, 3 usuarios de prueba nuevos, 4 libros de ejemplo nuevos
   [API] Escuchando en http://localhost:3000/api
   ```

5. Abrir la aplicación:
   - Frontend: http://localhost:5173
   - API: http://localhost:3000/api (estado: http://localhost:3000/api/health)

> **Si un puerto ya está en uso** en tu máquina: el backend usa `API_PORT` (3000). Cambialo en
> `.env` junto con `VITE_API_URL` (por ejemplo `API_PORT=3010` y
> `VITE_API_URL=http://localhost:3010/api`) y volvé a ejecutar `docker compose up --build`. La base
> se publica en el puerto `5433` de tu máquina (`DB_HOST_PORT`) para no chocar con un PostgreSQL
> local. El frontend usa el `5173`.

Para empezar de cero (borrando los datos): `docker compose down -v`.

## Ejecución sin Docker (opcional)

Se necesita una base PostgreSQL. La forma más simple es levantar solo la del Compose:

```bash
docker compose up -d db
```

**Backend** (desde `backend/`):

```bash
cd backend
cp ../.env .env      # y en backend/.env cambiar: DB_HOST=localhost y DB_PORT=5433
npm install
npm run dev          # tsx en modo watch
```

**Frontend** (desde `frontend/`, en otra terminal). Lee `VITE_API_URL` del `.env` de la raíz:

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DB_HOST` | Host de la base de datos (en Docker, el nombre del servicio) | `db` |
| `DB_PORT` | Puerto de la base de datos | `5432` |
| `DB_USER` | Usuario | `tlp4` |
| `DB_PASSWORD` | Contraseña | `tlp4` |
| `DB_NAME` | Nombre de la base | `tp_integrador` |
| `DB_HOST_PORT` | Puerto por el que se publica la base en la máquina host | `5433` |
| `JWT_SECRET` | Clave para firmar los tokens | `cambiar-esto` |
| `API_PORT` | Puerto del backend | `3000` |
| `VITE_API_URL` | URL de la API para el frontend (la usa el navegador) | `http://localhost:3000/api` |

## Usuarios de prueba

| Rol | Email | Contraseña |
|---|---|---|
| admin | admin@tp.com | admin123 |
| operador | operador@tp.com | operador123 |
| usuario | usuario@tp.com | usuario123 |

Todo usuario que se registra desde la aplicación queda con el rol `usuario`.

## Cómo probar el flujo de notificaciones

1. Ingresar como `usuario` (usuario@tp.com / usuario123), abrir un libro y tocar **Suscribirse**.
2. En otra ventana (o en incógnito), ingresar como `operador` (operador@tp.com / operador123),
   abrir ese mismo libro y cambiarle el estado con **Cambiar estado → Aplicar**.
3. Volver a la sesión de `usuario`: en unos segundos el contador de **Notificaciones** de la barra
   muestra `1`, y la notificación aparece en la bandeja.
4. Verificar la notificación en la consola del backend:

   ```bash
   docker compose logs backend
   ```

   ```
   [NOTIFICACIÓN] Para: usuario@tp.com | Libro #3 | Estado: DISPONIBLE → PRESTADO
   ```

## Endpoints principales

Todas las rutas (salvo registro, login y health) requieren el header
`Authorization: Bearer <token>`. Sin token → `401`; sin el permiso → `403`.

| Método | Ruta | Permiso requerido |
|---|---|---|
| POST | /api/auth/register | — |
| POST | /api/auth/login | — |
| GET | /api/auth/me | sesión iniciada |
| GET | /api/libros | `libro:read` |
| GET | /api/libros/:id | `libro:read` |
| POST | /api/libros | `libro:create` |
| PUT | /api/libros/:id | `libro:update` |
| PATCH | /api/libros/:id/status | `libro:change-status` |
| DELETE | /api/libros/:id | `libro:delete` |
| POST | /api/libros/:id/subscription | `subscription:create` |
| DELETE | /api/libros/:id/subscription | `subscription:delete` |
| GET | /api/subscriptions | `libro:read` (solo las propias) |
| GET | /api/notifications | `notification:read` |
| GET | /api/notifications/unread-count | `notification:read` |
| PATCH | /api/notifications/:id/read | `notification:read` |
| PATCH | /api/notifications/read-all | `notification:read` |
| GET | /api/users | `user:read` |
| PATCH | /api/users/:id/role | `user:assign-role` |
| GET | /api/roles | `user:assign-role` |
| GET | /api/health | — |

Ejemplo con curl (un `usuario` no puede listar usuarios):

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@tp.com","password":"usuario123"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')
curl -i http://localhost:3000/api/users -H "Authorization: Bearer $TOKEN"   # → 403 Forbidden
```

## Patrones y principios SOLID

Ver [PATTERNS.md](./PATTERNS.md).
