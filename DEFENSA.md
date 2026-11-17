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
