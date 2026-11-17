# Guía de defensa — TP Integrador TLP4 (Biblioteca)

Notas personales para preparar la defensa oral, etapa por etapa.

---

## Etapa 1 — Base del proyecto: Docker Compose + `DatabaseConnection` (Singleton)

### Qué se hizo

Se armó el esqueleto del repositorio y se conectó el backend a PostgreSQL. Todavía no hay
funcionalidades; lo único que expone la API es `GET /api/health`, que dice si la base responde.

### Archivos

| Archivo | Para qué está |
|---|---|
| `docker-compose.yml` | Levanta `db` (PostgreSQL 16) y `backend`. Volumen `db_data`, `healthcheck` con `pg_isready` y `depends_on: condition: service_healthy`. |
| `.env.example` | Plantilla de variables. Se copia a `.env`, que **no** se versiona (está en `.gitignore`). |
| `.gitignore` | Excluye `node_modules/`, `dist/` y `.env`. |
| `backend/package.json` | Proyecto independiente. Solo librerías de la sección 2.1: `express`, `cors`, `dotenv`, `sequelize`, `pg` y, como dev, `typescript`, `tsx` y `@types/*`. |
| `backend/tsconfig.json` | `"strict": true` (más chequeos extra como `noUnusedLocals`). |
| `backend/Dockerfile` | Build en dos etapas: la primera compila TS a JS y la segunda copia solo `dist/` y las dependencias de producción. |
| `backend/.dockerignore` | Evita copiar `node_modules`, `dist` y `.env` a la imagen. |
| `backend/src/config/env.ts` | Lee y **valida** las variables de entorno una sola vez. Si falta alguna, la app no arranca. |
| `backend/src/database/DatabaseConnection.ts` | **Singleton** que encapsula la única instancia de `Sequelize`. |
| `backend/src/app.ts` | Crea la app Express (cors, JSON, rutas, manejo de errores). No abre el puerto. |
| `backend/src/middlewares/errorHandler.ts` | 404 en JSON para rutas inexistentes y 500 centralizado para errores no controlados. |
| `backend/src/main.ts` | **Composition root**: crea los objetos, los conecta y levanta el servidor. |

### Patrón: Singleton (`DatabaseConnection`)

- **Problema que resuelve:** `new Sequelize(...)` abre un *pool* de conexiones a PostgreSQL. Si
  cada repositorio creara el suyo, habría varios pools compitiendo por la base, y los modelos
  quedarían definidos sobre conexiones distintas. Con el Singleton toda la app comparte **una sola**
  conexión.
- **Cómo se garantiza:**
  1. `private constructor()`: TypeScript no deja hacer `new DatabaseConnection()` fuera de la clase
     (error TS2673).
  2. `private static instance`: la clase guarda su propia instancia.
  3. `static getInstance()`: la crea la primera vez y después devuelve siempre la misma.

```ts
static getInstance(): DatabaseConnection {
  if (DatabaseConnection.instance === null) {
    DatabaseConnection.instance = new DatabaseConnection();
  }
  return DatabaseConnection.instance;
}
```

### Principios aplicados

- **S (responsabilidad única):** cada archivo tiene un solo motivo para cambiar. `env.ts` cambia si
  cambian las variables, `DatabaseConnection` si cambia la forma de conectarse, `app.ts` si cambian
  rutas o middlewares, y `main.ts` si cambia cómo se arma el sistema.
- **D (inversión de dependencias), en chiquito:** `app.ts` no importa `DatabaseConnection`. Recibe
  una función `checkDatabase` por parámetro, y `main.ts` decide qué función pasarle. Es la misma
  idea que vamos a usar con los services y los repositorios: las dependencias entran desde afuera.
- **Composition root (`main.ts`):** el único lugar donde se crean y conectan los objetos. En las
  próximas etapas acá se van a crear repositorios, services y controllers.

### Decisiones de Docker que conviene saber explicar

- **`healthcheck` + `depends_on: condition: service_healthy`:** un `depends_on` común solo espera a
  que el contenedor *arranque*, no a que Postgres *acepte conexiones*. Con el healthcheck, el
  backend recién arranca cuando `pg_isready` da OK, así que no falla al conectarse.
- **Volumen `db_data`:** los datos viven fuera del contenedor. Se probó creando una tabla, haciendo
  `docker compose down` y `up`: el dato seguía estando.
- **`DB_HOST=db`:** dentro de la red de Compose, cada servicio se encuentra por su nombre. `localhost`
  dentro del contenedor del backend sería el propio backend, no la base.
- **Puerto 5433 en el host:** la base se publica en `5433:5432` para no chocar con un PostgreSQL que
  la máquina ya tenga en 5432. El backend no usa ese puerto, porque habla con `db:5432` por la red
  interna.

### Cómo se probó

```bash
cp .env.example .env
docker compose up --build -d
curl http://localhost:3000/api/health      # {"status":"ok","database":"up"}            -> 200
curl http://localhost:3000/api/libros      # {"error":"Ruta no encontrada: ..."}        -> 404
docker compose stop db
curl http://localhost:3000/api/health      # {"status":"degraded","database":"down"}    -> 503
```

Además se verificó que dos llamadas a `getInstance()` devuelven el mismo objeto (`a === b` → `true`)
y que `new DatabaseConnection()` no compila.

### Preguntas posibles de la cátedra

1. **¿Por qué el constructor es privado y qué pasaría si fuera público?**
   Para que la única forma de obtener el objeto sea `getInstance()`. Si fuera público, cualquiera
   podría hacer `new` y crear otro pool de conexiones, y el patrón se rompería.

2. **¿Qué diferencia hay entre `depends_on` solo y con `condition: service_healthy`?**
   Sin la condición, Compose solo espera a que el contenedor de la base *arranque*. Con la
   condición, espera a que el healthcheck (`pg_isready`) dé OK, es decir, a que Postgres acepte
   conexiones. Así el backend no intenta conectarse antes de tiempo.

3. **¿Para qué sirve `main.ts` si ya existe `app.ts`?**
   `main.ts` es el *composition root*: crea los objetos (conexión, y más adelante repositorios,
   services y controllers), los conecta y levanta el servidor. `app.ts` solo arma Express con lo
   que recibe. Así ningún módulo crea sus propias dependencias y todo el cableado está en un solo
   lugar.

---

## Etapa 2 — Usuarios, roles, permisos y login con JWT

### Qué se hizo

Registro y login con email y contraseña (hasheada con `bcrypt`), sesión con JWT, roles y
permisos cargados por un seed automático, y administración de usuarios (listar y asignar rol).
Los permisos se validan **en el backend**: un endpoint sin permiso responde `403` aunque se lo
llame con curl.

### El recorrido de una request (las capas)

```
GET /api/users  (header Authorization: Bearer <token>)
  │
  ├─ routes/user.routes.ts        decide qué middlewares y qué controller corren
  ├─ middlewares/authenticate.ts  ¿QUIÉN sos?  verifica el JWT → req.user (con permisos)  → si no, 401
  ├─ middlewares/authorize.ts     ¿PODÉS?      ¿req.user.permissions incluye user:read?  → si no, 403
  ├─ controllers/UserController   lee y valida la request, llama al service, responde JSON
  ├─ services/UserService         lógica de negocio (no conoce Express: ni req ni res)
  └─ repositories/UserRepository  único que toca los modelos de Sequelize → PostgreSQL
```

Si algo falla en cualquier capa, se lanza un `AppError` con un **código de negocio**
(`FORBIDDEN`, `NOT_FOUND`...) y `middlewares/errorHandler.ts` lo traduce a status HTTP. Por eso
los services pueden decir "no existe" sin saber que eso es un 404.

### Archivos

| Archivo | Para qué está |
|---|---|
| `src/config/permissions.ts` | Catálogo de roles, permisos y qué permisos tiene cada rol (tabla RF2). Es la única fuente de verdad, la usan el seed y las rutas. |
| `src/config/env.ts` | Se agregó `JWT_SECRET` como obligatoria. |
| `src/database/DatabaseConnection.ts` | Se agregó `sync()` (crea las tablas) y `underscored` (columnas `snake_case`). |
| `src/database/seed.ts` | Carga los 10 permisos, los 3 roles y los 3 usuarios de prueba. Es idempotente. |
| `src/models/Permission.ts`, `Role.ts`, `User.ts` | Modelos de Sequelize. |
| `src/models/index.ts` | Registra los modelos sobre la conexión única y define las relaciones: Rol N─M Permiso (tabla `role_permissions`), Rol 1─N Usuario. |
| `src/types/user.ts` | Tipos del dominio (`UserSummary`, `AuthUser`...): objetos planos, sin Sequelize. |
| `src/types/express.d.ts` | Le enseña a TypeScript que `req.user` existe. |
| `src/errors/AppError.ts` | Error de la aplicación con código de negocio. |
| `src/repositories/interfaces/IUserRepository.ts`, `IRoleRepository.ts` | **Contratos** de acceso a datos (se definen antes que la implementación). |
| `src/repositories/UserRepository.ts`, `RoleRepository.ts` | Implementación con Sequelize. Convierten modelos en objetos planos. |
| `src/services/TokenService.ts` | `ITokenService` + `JwtTokenService`: firma y verifica JWT. |
| `src/services/AuthService.ts` | Registro, login y "quién es el usuario de este token". |
| `src/services/UserService.ts` | Listar usuarios, listar roles y asignar rol. |
| `src/utils/password.ts` | `hashPassword` / `verifyPassword` con bcrypt. |
| `src/utils/validators.ts` | Validación manual del body (`req.body` se trata como `unknown`). |
| `src/middlewares/authenticate.ts`, `authorize.ts` | 401 y 403. |
| `src/middlewares/errorHandler.ts` | Traduce `AppError` a status HTTP. |
| `src/controllers/AuthController.ts`, `UserController.ts` | Capa HTTP. |
| `src/routes/auth.routes.ts`, `user.routes.ts` | Qué URL va a qué controller y con qué permiso. |
| `src/main.ts` | Composition root: crea repos → services → controllers → rutas. |

### Endpoints de esta etapa

| Método | Ruta | Permiso |
|---|---|---|
| POST | `/api/auth/register` | — (queda con rol `usuario`) |
| POST | `/api/auth/login` | — |
| GET | `/api/auth/me` | sesión iniciada |
| GET | `/api/users` | `user:read` |
| PATCH | `/api/users/:id/role` | `user:assign-role` |
| GET | `/api/roles` | `user:assign-role` |

### Principios SOLID

- **D — Inversión de dependencias** (el más importante de esta etapa). `AuthService` y
  `UserService` reciben `IUserRepository`, `IRoleRepository` e `ITokenService`, que son
  **interfaces**. No saben que abajo hay Sequelize o JWT. Las clases concretas se eligen en un solo
  lugar, `main.ts`:
  ```ts
  const userRepository = new UserRepository();               // concreto
  const authService = new AuthService(userRepository, roleRepository, tokenService);
  // AuthService solo ve: constructor(private readonly users: IUserRepository, ...)
  ```
  Si mañana se cambia a MongoDB, se escribe otro `UserRepository` que cumpla la interfaz y los
  services no se tocan.
- **S — Responsabilidad única.** Cada capa tiene un solo motivo para cambiar. El controller
  cambia si cambia el formato HTTP, el service si cambia la regla de negocio y el repositorio si
  cambia la base. `authenticate` (quién sos) y `authorize` (qué podés) están separados.
- **I — Segregación de interfaces.** `IRoleRepository` tiene solo 2 métodos de lectura, porque no
  hay ABM de roles. Nadie depende de métodos que no usa.

### Decisiones que conviene saber explicar

- **El token solo lleva el id del usuario (`sub`)**, no los permisos. En cada request,
  `authenticate` busca en la base el rol y los permisos actuales. Ventaja: si el admin cambia un
  rol, vale **en el momento** (se probó: Ana pasó de `usuario` a `operador` y con el mismo token
  ya tenía los permisos nuevos). Costo: una consulta por request, que en una app así es
  despreciable.
- **401 vs 403.** 401 = "no sé quién sos" (sin token, token inválido o vencido). 403 = "sé quién
  sos, pero tu rol no tiene permiso".
- **Mismo mensaje para email inexistente y contraseña mala** ("Email o contraseña incorrectos"),
  así un atacante no puede averiguar qué emails están registrados.
- **bcrypt** guarda el hash, nunca la contraseña. Incluye una "sal" aleatoria, así dos usuarios
  con la misma contraseña tienen hashes distintos, y es lento a propósito (costo 10) para que
  probar contraseñas por fuerza bruta sea caro. La contraseña admite hasta 72 caracteres porque
  bcrypt ignora lo que viene después.
- **El seed es idempotente**: usa `findOrCreate`, así que se puede ejecutar en cada arranque sin
  duplicar datos. Usa los modelos directamente (no los repositorios) porque no es parte del flujo
  de la aplicación, sino de la preparación de la base, como una migración.
- **Un admin no puede cambiarse su propio rol**, para que no deje el sistema sin
  administrador. Es una regla agregada, no la pide la consigna.
- **Tablas con `sequelize.sync()`**, porque `sequelize-cli` (migraciones) no está entre las
  librerías permitidas.
- **Permisos como tipos literales.** Escribir `authorize('user:raed')` no compila, porque
  `PermissionName` solo acepta los 10 permisos del catálogo.

### Cómo se probó

Con curl contra `docker compose`:

| Prueba | Resultado |
|---|---|
| Login admin / operador / usuario | 200 + token + permisos |
| Contraseña incorrecta y email inexistente | 401, mismo mensaje |
| Registro nuevo (`Ana@TP.com`) | 201, email normalizado a minúsculas, rol `usuario` |
| Registro con email repetido | 409 |
| Nombre vacío, email inválido, JSON mal formado | 400 |
| `GET /users` sin token / token falso | 401 / 401 |
| `GET /users` como usuario / operador / admin | 403 / 403 / 200 |
| `PATCH /users/3/role` como operador | 403 |
| Admin cambiándose su propio rol / rol inválido / usuario 999 | 400 / 400 / 404 |
| Admin asciende a Ana → `/auth/me` con el token viejo | ya figura `operador` con sus permisos |
| Reinicio del backend | `[SEED] ... 0 usuarios de prueba nuevos` (no duplica) |
| `docker compose down -v` + `up` (base vacía) | se crean las 4 tablas, seed completo, login 200 |

Ejemplo para repetir en la defensa:

```bash
TOKEN=$(curl -s -X POST localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"usuario@tp.com","password":"usuario123"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')
curl -i localhost:3000/api/users -H "Authorization: Bearer $TOKEN"   # → 403
```

### Preguntas posibles de la cátedra

1. **¿Dónde se valida que un usuario tenga permiso, y qué pasa si alguien llama al endpoint con
   curl salteando el frontend?**
   En el backend, en el middleware `authorize(permiso)`, que corre antes del controller en cada
   ruta protegida. Como está en el servidor, da igual desde dónde venga la request: si el rol no
   tiene el permiso, responde 403. Ocultar botones en el frontend es solo comodidad visual.

2. **¿Por qué `AuthService` recibe un `IUserRepository` y no un `UserRepository`?**
   Por inversión de dependencias: el service depende de una abstracción (qué operaciones necesita)
   y no de la implementación (cómo se hacen con Sequelize). La clase concreta se elige en
   `main.ts`. Así se podría cambiar la base, o pasarle un repositorio falso para probar, sin tocar
   el service.

3. **Si un admin le cambia el rol a un usuario que ya está logueado, ¿cuándo se entera el
   sistema?**
   En la siguiente request. El JWT solo guarda el id del usuario, y `authenticate` lee el rol y
   los permisos actuales de la base en cada request. Si los permisos estuvieran dentro del token,
   el usuario conservaría los viejos hasta que el token venciera (8 h).
