# Enjambre EAFIT

Plataforma para centralizar y gestionar la información de los **Grupos Estudiantiles**
de la Universidad EAFIT: grupos y sus comités/departamentos, la base de datos de
integrantes de cada grupo, los estados de miembro (con su objetivo de permanencia) y
la **tabla de permanencia** (actividades ponderadas y el puntaje de cada integrante).

El proyecto es _full‑stack_ y vive en dos carpetas dentro de `src/`:

| Carpeta         | Stack                                                                      | Puerto (dev) |
| --------------- | ------------------------------------------------------------------------- | ------------ |
| `src/backend`   | NestJS 12 · TypeORM · SQLite (better‑sqlite3) · JWT · class‑validator     | `3000`       |
| `src/frontend`  | Vue 3 · Vite · TypeScript · Pinia · Vue Router · Tailwind CSS v4 · axios  | `5173`       |

El frontend consume la API REST del backend (`http://localhost:3000/api`). La
autenticación es por **JWT**: al iniciar sesión se guarda el token y se envía en la
cabecera `Authorization: Bearer <token>` en todas las peticiones.

---

## 1. Requisitos

- **Node.js** `^22.18.0` o `>=24.12.0` (lo exige el frontend).
- **npm** (viene con Node).
- No hace falta ningún servidor de base de datos: el backend usa **SQLite** en un
  archivo local (`src/backend/database.sqlite`) que se crea solo.

---

## 2. Puesta en marcha rápida

```bash
# 1) Backend
cd src/backend
npm install
cp .env.example .env          # y edita JWT_SECRET (ver más abajo)
npm run seed                  # crea la BD + datos iniciales
npm run start:dev             # API en http://localhost:3000/api

# 2) Frontend (en otra terminal)
cd src/frontend
npm install
cp .env.example .env          # VITE_API_URL ya apunta al backend local
npm run dev                   # app en http://localhost:5173
```

Abre <http://localhost:5173> e inicia sesión con una de las **cuentas de
demostración**:

| Rol                                    | Usuario            | Contraseña |
| -------------------------------------- | ------------------ | ---------- |
| Administrador (Desarrollo Estudiantil) | `admin`            | `admin123` |
| Junta de SPIE                          | `junta.spie`       | `junta123` |
| Junta de Organización Estudiantil (OE) | `junta.oe`         | `junta123` |
| Junta de Capítulo IEEE EAFIT           | `junta.ieee`       | `junta123` |
| Junta de Innovación y Emprendimiento   | `junta.innovacion` | `junta123` |
| Junta de Semillero de Ciencia de Datos | `junta.datos`      | `junta123` |

> `admin` y `junta.spie` salen de las variables `ADMIN_*` / `BOARD_*` del `.env`
> del backend; las demás juntas usan el nombre que define el catálogo del seeder
> y la misma `BOARD_PASSWORD`. Cambia el `.env` y vuelve a seedear
> (`npm run seed:fresh`) si quieres otras credenciales.

---

## 3. Backend en detalle (`src/backend`)

### 3.1. Variables de entorno

Copia `.env.example` a `.env`. Variables:

| Variable          | Obligatoria | Por defecto              | Para qué sirve                                                        |
| ----------------- | ----------- | ------------------------ | -------------------------------------------------------------------- |
| `JWT_SECRET`      | **Sí**      | —                        | Firma/verificación de los JWT. Si falta, el servidor **no arranca**. |
| `JWT_EXPIRES_IN`  | No          | `1d`                     | Vigencia del token (formato de `jsonwebtoken`, p. ej. `8h`, `7d`).   |
| `PORT`            | No          | `3000`                   | Puerto del servidor HTTP.                                            |
| `CORS_ORIGIN`     | No          | `http://localhost:5173`  | Orígenes permitidos por CORS, separados por comas.                  |
| `ADMIN_USERNAME`  | Para seed   | —                        | Usuario admin que crea `npm run seed`.                              |
| `ADMIN_PASSWORD`  | Para seed   | —                        | Contraseña del admin (se guarda hasheada con bcrypt).              |
| `BOARD_USERNAME`  | Para seed   | —                        | Usuario de junta del **primer** grupo (SPIE).                       |
| `BOARD_PASSWORD`  | Para seed   | —                        | Contraseña de **todas** las juntas.                                 |
| `SEED_MEMBERS`    | No          | `150`                    | Cuántos integrantes genera el seeder.                               |
| `SEED_RANDOM_SEED`| No          | `20261118`               | Semilla del generador: misma semilla ⇒ mismos datos.                |
| `SEED_FRESH`      | No          | —                        | `1` para borrar y recrear el esquema antes de sembrar.              |

Genera un `JWT_SECRET` aleatorio, por ejemplo:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3.2. Base de datos

- Motor: **SQLite** vía `better-sqlite3`. El archivo es `src/backend/database.sqlite`
  (está en `.gitignore`).
- El esquema se crea **automáticamente** con `synchronize: true` de TypeORM: tanto
  al levantar el servidor (`npm run start:dev`) como al correr `npm run seed`.
- No hay migraciones. Si cambias una entidad, TypeORM intenta ajustar el esquema en
  caliente; ante problemas, **re‑seedea desde cero** con `npm run seed:fresh`
  (ver [3.3](#33-sembrar-datos-npm-run-seed)).

### 3.3. Sembrar datos (`npm run seed`)

```bash
cd src/backend
npm run seed          # agrega lo que falte, sin tocar lo que ya existe
npm run seed:fresh    # BORRA todo y vuelve a sembrar desde cero
```

Ejecuta `src/database/seeds/index.ts`, que siembra en este orden:

1. **Grupos** (5, del catálogo del seeder).
2. **Usuarios**: `admin` (rol `ADMIN`) y una cuenta de junta (rol `BOARD`) por
   grupo. Las contraseñas se hashean con bcrypt.
3. **Estados de miembro** de cada grupo (5 por grupo, con su objetivo `target`).
4. **Integrantes** (150 por defecto, generados con nombres, programas, documento,
   correo y celular ficticios pero únicos).
5. **Vínculos integrante↔grupo** (`group_member`), cada uno con su estado. Un ~10 %
   pertenece a dos grupos.
6. **Comités** de cada grupo y los integrantes de cada comité.
7. **Actividades**: la hoja general de cada grupo (pesos que suman 60 %) y la hoja
   de cada comité (40 %), de modo que un integrante puede llegar a 100 puntos.
8. **Puntajes** (`permanence`) de cada integrante en las actividades que le aplican.
   Un ~12 % de las casillas queda **sin calificar** a propósito (así se ve en la
   aplicación: lo que no se califica no tiene fila).

Volumen que deja el seed por defecto:

| Tabla               | Filas |
| ------------------- | ----- |
| `group`             | 5     |
| `user`              | 6     |
| `member_status`     | 25    |
| `committee`         | 14    |
| `member`            | 150   |
| `group_member`      | 166   |
| `committee_member`  | 171   |
| `activity`          | 53    |
| `permanence`        | 946   |

Al terminar imprime un resumen (cuántas filas nuevas por tabla) y los totales.

#### Cómo re‑seedear

El seed es **idempotente**: comprueba antes de insertar, así que `npm run seed` dos
veces seguidas no duplica nada (la segunda reporta `0 nuevos`). Esto sirve para
**completar** datos que falten, pero **no** actualiza ni borra lo que ya está.

Para empezar de cero — que es lo que quieres cuando cambiaste una entidad, cambiaste
el catálogo del seeder o la base quedó inconsistente:

```bash
cd src/backend
npm run seed:fresh
```

`seed:fresh` **borra todas las tablas, las vuelve a crear** (`synchronize`) y siembra
de nuevo. Equivale a `npm run seed -- --fresh` o a `SEED_FRESH=1 npm run seed`.

> ⚠️ Borra **todo**, incluidos los datos que hayas creado tú desde la aplicación.
> Para en una terminal el backend (`npm run start:dev`) antes de correrlo.

Si prefieres borrar el archivo de la base a mano, también funciona:

```powershell
# PowerShell (Windows)
cd src\backend
Remove-Item database.sqlite -ErrorAction SilentlyContinue
npm run seed
```

```bash
# bash / macOS / Linux
cd src/backend
rm -f database.sqlite
npm run seed
```

(Con el backend corriendo, Windows no deja borrar el archivo: usa `seed:fresh`, que
no necesita borrarlo.)

#### Tamaño y datos deterministas

El seeder genera los datos con un generador pseudoaleatorio **con semilla**: la misma
semilla produce exactamente los mismos integrantes y puntajes, así que dos personas
del equipo sembrando con la misma configuración obtienen la misma base.

| Variable           | Por defecto | Para qué sirve                                      |
| ------------------ | ----------- | --------------------------------------------------- |
| `SEED_MEMBERS`     | `150`       | Cuántos integrantes generar.                        |
| `SEED_RANDOM_SEED` | `20261118`  | Semilla; cámbiala para obtener otro juego de datos. |

```powershell
# PowerShell: una base grande para probar rendimiento de las tablas
$env:SEED_MEMBERS = "1000"; npm run seed:fresh
```

```bash
# bash
SEED_MEMBERS=1000 npm run seed:fresh
```

#### Cómo está organizado el seeder

```
src/database/seeds/
├── index.ts                 orquesta los seeders en orden y soporta --fresh
├── data/
│   ├── catalog.ts           grupos, comités, actividades, estados, nombres, programas
│   ├── plan.ts              arma en memoria el plan completo (determinista)
│   ├── random.util.ts       generador pseudoaleatorio con semilla
│   └── report.util.ts       resúmenes por consola y guardado por lotes
└── *.seed.ts                un archivo por tabla; cada uno persiste su parte del plan
```

Para cambiar **qué** se siembra (otro grupo, otro comité, otra actividad) edita
`data/catalog.ts`; para cambiar **cuánto** y **cómo** se reparte, `data/plan.ts`. Los
pesos de cada hoja se validan al sembrar: si un comité del catálogo suma más de
100 %, el seed falla con un mensaje claro en vez de dejar datos inválidos.

> El seed usa el loader `ts-node/esm`. En Node 24+ imprime un aviso de _deprecation_
> sobre `--loader`; es inofensivo.

### 3.4. Levantar el servidor

```bash
cd src/backend
npm run start:dev     # watch mode; API en http://localhost:3000/api
```

Todos los endpoints están bajo el prefijo global `/api` y requieren JWT, **excepto**
`POST /api/auth/login`. La API valida los cuerpos con `class-validator` y **rechaza
propiedades no declaradas** (`forbidNonWhitelisted`).

### 3.5. Scripts útiles

| Comando              | Qué hace                                             |
| -------------------- | --------------------------------------------------- |
| `npm run start:dev`  | Servidor en watch mode.                             |
| `npm run start`      | Servidor sin watch.                                 |
| `npm run build`      | Compila a `dist/`.                                  |
| `npm run start:prod` | Ejecuta `dist/main` (requiere `build` previo).      |
| `npm run seed`       | Siembra lo que falte (idempotente).                 |
| `npm run seed:fresh` | Borra todo y vuelve a sembrar desde cero.           |
| `npm run test`       | Tests unitarios (Vitest).                           |
| `npm run lint`       | oxlint.                                             |
| `npm run format`     | Prettier `--write`.                                 |

### 3.6 Documentación de las APIs
La documentación de las APIs se realizó mediante OpenAPI y Swagger UI. Para acceder a la documentación, es necesario ejecutar previamente el backend y dirigirse a la siguiente ruta:


`http://localhost:3000/docs`
---

## 4. Frontend en detalle (`src/frontend`)

### 4.1. Variables de entorno

Copia `.env.example` a `.env`:

| Variable               | Por defecto                     | Para qué sirve                          |
| ---------------------- | ------------------------------- | -------------------------------------- |
| `VITE_API_URL`         | `http://localhost:3000/api`     | URL base de la API del backend.        |
| `VITE_APP_NAME`        | `Enjambre EAFIT`                | Nombre mostrado en la UI.              |
| `VITE_APP_INSTITUTION` | `Universidad EAFIT`             | Institución mostrada en la UI.         |
| `VITE_APP_DESCRIPTION` | (texto de la plataforma)        | Descripción mostrada en la landing.    |

### 4.2. Levantar la app

```bash
cd src/frontend
npm install
npm run dev           # http://localhost:5173
```

El frontend **no persiste nada en `localStorage`** salvo el token JWT
(`enjambre.token`); todo el estado se pide a la API en cada carga de pantalla. Al
arrancar, `AuthService.bootstrapSession()` usa el token guardado para rehidratar la
sesión contra `GET /api/auth/me`.

### 4.3. Scripts útiles

| Comando               | Qué hace                                    |
| --------------------- | ------------------------------------------- |
| `npm run dev`         | Servidor de desarrollo (Vite).             |
| `npm run build`       | `type-check` + build de producción a `dist/`. |
| `npm run preview`     | Sirve el build de producción.              |
| `npm run type-check`  | `vue-tsc --build`.                          |
| `npm run lint`        | oxlint + eslint (con `--fix`).             |
| `npm run format`      | Prettier `--write`.                        |

---

## 5. Orden de arranque recomendado

1. **Backend**: `.env` listo → `npm run seed` → `npm run start:dev`.
2. **Frontend**: `.env` listo → `npm run dev`.
3. Navegar a <http://localhost:5173>, iniciar sesión como `admin` / `admin123`.

Si el frontend muestra errores de red al cargar, casi siempre es porque el backend
no está arriba, el `.env` del backend no tiene `JWT_SECRET`, o la BD no está seedeada
(login válido pero pantallas vacías).

---

## 6. Estructura del proyecto

```
src/
├── backend/
│   └── src/
│       ├── auth/            # login, JWT, AuthGuard (global) y RolesGuard (@Roles)
│       ├── users/           # solo POST (crea usuarios de junta, rol BOARD)
│       ├── groups/          # Group + subrecursos GroupMember y MemberStatus
│       ├── committees/      # Committee (comités/departamentos de un grupo)
│       ├── members/         # Member (base de datos de integrantes)
│       ├── activities/      # Activity (actividades de permanencia; período automático)
│       ├── permanences/     # Permanence (puntos de un miembro en una actividad)
│       └── database/
│           ├── data-source.ts      # DataSource para el seed
│           └── seeds/              # datos de demostración (index.ts los orquesta)
│               └── data/           # catálogo, plan determinista y utilidades
└── frontend/
    └── src/
        ├── services/        # una clase por recurso; llaman a la API con axios
        ├── stores/          # solo Pinia para auth y toasts
        ├── views/           # pantallas (login, grupos, miembros, permanencia, board)
        ├── components/      # tablas, modales, sidebar, etc.
        ├── interfaces/      # tipos del dominio (respuestas de la API, aplanadas)
        └── dtos/            # tipos de los cuerpos que se envían a la API
```

### Modelo de datos (resumen)

- Un **Group** tiene comités (**Committee**), estados de miembro (**MemberStatus**,
  con `target`) y una cuenta de junta (**User** con rol `BOARD`).
- Un **Member** pertenece a un grupo a través de **GroupMember**
  (`UNIQUE(member, group)`, con un único `memberStatus` por vínculo) y puede
  pertenecer a varios **Committee** (relación M:N).
- Una **Activity** pertenece a un grupo y, opcionalmente, a un comité
  (`committeeId = null` ⇒ actividad general). Tiene un `weight` (%) y un `period`
  que **asigna el servidor** (semestre vigente).
- Una **Permanence** es el puntaje (`percentage`, entero, 0..`weight`) de un
  **Member** en una **Activity** (`UNIQUE(member, activity)`).
- Borrar un **Group** elimina en cascada sus comités, estados, actividades,
  permanencias, la cuenta de junta y los miembros que no pertenezcan a otro grupo.

### Autorización

- `AuthGuard` global: todo requiere JWT salvo `POST /api/auth/login`.
- `@Roles('ADMIN')` sobre las mutaciones de `groups`, `committees`,
  `member-statuses` y sobre `POST /api/users`. El resto de endpoints los puede usar
  cualquier usuario autenticado.

---

## 7. Notas y limitaciones conocidas

- **Validación de datos**: la API valida rangos, formatos y duplicados y responde
  400/409 con un mensaje en español que el frontend muestra tal cual. Las reglas
  están resumidas en [`docs/ai/AGENTS.md`](docs/ai/AGENTS.md) (sección 6).
- **Puntaje de la hoja general**: suma los puntos generales más los de los comités
  del integrante, así que puede pasar de 100 si las hojas se configuran con pesos
  que sumen más de 100 entre todas. Cada hoja por separado está limitada a 100.
- **Usuario de la junta en la UI**: no hay endpoint para listar/consultar usuarios,
  así que el nombre de la cuenta de junta no se muestra en el panel de grupos.
- **Sin _scoping_ por grupo para BOARD**: un usuario de junta puede leer/escribir
  `members` / `activities` / `permanences` de cualquier grupo llamando la API
  directamente (el frontend solo lo restringe por rutas).
- **JWT sin refresh**: el token vive `JWT_EXPIRES_IN` (1 día por defecto); al
  expirar hay que volver a iniciar sesión.
- **SQLite con `synchronize: true`**: cómodo para desarrollo, pero cambios de
  entidad pueden requerir re‑seedear desde cero (`npm run seed:fresh`).
- Tras cambiar los roles a `ADMIN`/`BOARD`, una BD antigua con roles en minúscula
  no enruta bien: `npm run seed:fresh`.
- **El seed no actualiza**: `npm run seed` solo agrega lo que falta. Si cambias el
  catálogo de `src/database/seeds/data/`, los registros ya creados se quedan como
  estaban; usa `npm run seed:fresh` para verlos reflejados.
