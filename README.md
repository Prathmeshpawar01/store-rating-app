# StoreRate – Full Stack Store Rating Application

A web application where customers rate stores from 1 to 5 stars, store owners see who rated their stores, and system administrators manage users and stores.

- **Frontend:** React 18, Vite, React Router, Axios, plain responsive CSS
- **Backend:** Node.js, Express, REST, JWT authentication, bcrypt password hashing
- **Database:** MySQL 8 (mysql2 driver, parameterized queries)

---

## Table of contents

1. [Project overview](#project-overview)
2. [Features](#features)
3. [Technology stack](#technology-stack)
4. [Project structure](#project-structure)
5. [Database setup](#database-setup)
6. [Environment variables](#environment-variables)
7. [Backend installation](#backend-installation)
8. [Frontend installation](#frontend-installation)
9. [How to run](#how-to-run)
10. [Demo credentials](#demo-credentials)
11. [API documentation](#api-documentation)
12. [Validation rules](#validation-rules)
13. [Testing](#testing)
14. [Git commands](#git-commands)
15. [Troubleshooting](#troubleshooting)
16. [Design decisions and known limitations](#design-decisions-and-known-limitations)

---

## Project overview

There is one login page for three roles. After logging in, each role is sent to its own area:

| Role                     | Lands on            | Can do                                                                                   |
| ------------------------ | ------------------- | ---------------------------------------------------------------------------------------- |
| `ADMIN` (system admin)   | `/admin/dashboard`  | See platform statistics, add stores, add normal users / admins / store owners, search, filter and sort users and stores, view full details |
| `USER` (normal user)     | `/user/stores`      | Sign up, browse and search stores, submit a 1–5 star rating, edit their rating, change password |
| `OWNER` (store owner)    | `/owner/dashboard`  | See their store's average rating and total ratings, see which users rated and what they gave, change password |

Every API call is authorized on the server: the JWT is verified and the user's **current role is re-read from the database** on each request, so the role shown in the browser is never trusted.

## Features

**Authentication & security**
- Single login page for all roles with role-based redirect
- Public sign-up always creates a `USER` (any `role` sent by a client is discarded)
- JWT (HS256) sent as `Authorization: Bearer <token>`; passwords hashed with bcrypt
- `authenticateToken` + `authorizeRoles(...)` middleware on every protected route
- Tokens issued before a password change are rejected
- Failed login/sign-up attempts are rate limited per IP
- Parameterized SQL everywhere; sort columns come from a whitelist; LIKE wildcards in search input are escaped
- Centralized error handler with a consistent JSON shape; no passwords, hashes, stack traces or SQL in responses
- CORS restricted to configured origins; secrets only in `.env` (git-ignored)

**System administrator**
- Dashboard cards: total users, total stores, total ratings, total store owners (plus top-rated stores and platform average)
- Add store (name, email, address, owner chosen from store-owner accounts – a new owner can be created from the same dialog)
- Add normal user, add administrator, add store owner
- Users page: search by name / email / address, filter by role, sort ascending/descending by any column, pagination, details page (owners show their stores and rating; users show the ratings they gave)
- Stores page: search by name / email / address, sort ascending/descending (name, email, address, owner, average rating, number of ratings), pagination
- Store details: name, email, address, owner name and email, average rating, total ratings, rating breakdown, and every individual rating with user name, user email, rating and date

**Normal user**
- Sign up (name, email, address, password, confirm password)
- Store list with overall rating, own rating, and a "Rate store" / "Edit rating" button
- Search by store name or address; sort by name, average rating, address or own rating, ascending or descending
- Star picker (click or arrow keys) – one rating row per user per store, enforced by `UNIQUE(user_id, store_id)`
- Change password (current / new / confirm)

**Store owner**
- Dashboard: store name, address, average rating, total ratings, number of customers who rated, rating breakdown, latest ratings
- Ratings page: user name, user email, rating, rating date – searchable, filterable by star value (and by store if the owner has several), sortable
- Only ever sees data for stores where `stores.owner_id` is their own id

**UI**
- Responsive layout (desktop, tablet, mobile) with a collapsible sidebar
- Dashboard cards, tables, forms, modal dialogs, search bars, dropdown filters, rating stars
- Toast notifications, loading skeletons, error states with retry, empty states
- Live field validation with character counters and a password checklist
- Keyboard accessible (focus rings, focus-trapped dialogs, labelled controls, `aria-sort` on sortable headers)

## Technology stack

| Layer     | Technology |
| --------- | ---------- |
| Frontend  | React 18, Vite 5, React Router 6, Axios, CSS (custom design system) |
| Backend   | Node.js ≥ 20.10, Express 4, jsonwebtoken, bcryptjs, cors, dotenv |
| Database  | MySQL 8.0.16+ via mysql2 (promise pool) |
| Testing   | Node's built-in test runner (`node:test`) + real HTTP requests with `fetch` against a real MySQL test database |

## Project structure

```text
store-rating-app/
├── README.md
├── package.json                  # convenience scripts for the whole project
├── .gitignore
├── database/
│   ├── schema.sql                # tables, keys, constraints, indexes
│   └── seed.sql                  # SQL alternative to `npm run db:seed`
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js            # reads .env, validates JWT_SECRET
│   │   │   └── database.js       # mysql2 connection pool
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── adminController.js
│   │   │   ├── userController.js
│   │   │   ├── storeController.js
│   │   │   └── ownerController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js        # authenticateToken
│   │   │   ├── roleMiddleware.js        # authorizeRoles
│   │   │   ├── validationMiddleware.js  # validateBody, validateIdParam
│   │   │   └── errorMiddleware.js       # notFound, errorHandler
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── adminRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── storeRoutes.js
│   │   │   └── ownerRoutes.js
│   │   ├── validators/
│   │   │   ├── rules.js          # name, email, password, address, rating rules
│   │   │   └── schemas.js        # request body schemas
│   │   ├── utils/                # ApiError, response helpers, query/sort helpers, security, rate limiter
│   │   ├── scripts/
│   │   │   ├── initDb.js         # creates the database and applies schema.sql
│   │   │   ├── seed.js           # inserts demo data
│   │   │   └── seedData.js
│   │   ├── app.js                # Express app (exported for tests)
│   │   └── server.js             # starts the HTTP server
│   └── tests/                    # *.test.js + helpers.js
└── frontend/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── vite.config.js            # dev server + /api proxy to the backend
    ├── public/favicon.svg
    └── src/
        ├── components/
        │   ├── Navbar.jsx  Sidebar.jsx  Layout.jsx  ProtectedRoute.jsx
        │   ├── RatingStars.jsx  RatingStamp.jsx  SearchBar.jsx  SortHeader.jsx
        │   ├── Loading.jsx  States.jsx  Modal.jsx  Pagination.jsx
        │   ├── FormField.jsx  StatCard.jsx  RoleBadge.jsx  Icon.jsx
        │   └── admin/AddUserModal.jsx  admin/AddStoreModal.jsx
        ├── pages/
        │   ├── Login.jsx  Register.jsx  NotFound.jsx  AuthAside.jsx
        │   ├── admin/   Dashboard.jsx  Users.jsx  UserDetails.jsx  Stores.jsx  StoreDetails.jsx
        │   ├── user/    Stores.jsx  ChangePassword.jsx
        │   └── owner/   Dashboard.jsx  Ratings.jsx
        ├── services/api.js       # axios instance + API functions
        ├── context/AuthContext.jsx  context/ToastContext.jsx
        ├── hooks/                # useAsync, useListParams, useSearchInput, useDebounce
        ├── utils/                # validation.js (mirrors backend rules), format.js
        ├── App.jsx               # routes
        ├── main.jsx
        └── index.css             # design tokens + all styles
```

## Database setup

Requirements: **MySQL 8.0.16 or newer** running locally (MySQL Server, XAMPP/WAMP with MySQL 8, or Docker).

### Schema

```text
users    (id PK, name, email UNIQUE, password, address, role ENUM('ADMIN','USER','OWNER'), created_at, updated_at)
stores   (id PK, name, email UNIQUE, address, owner_id FK -> users.id, created_at, updated_at)
ratings  (id PK, user_id FK -> users.id, store_id FK -> stores.id, rating 1-5, created_at, updated_at,
          UNIQUE(user_id, store_id))
```

- Foreign keys: `stores.owner_id → users.id` (ON DELETE RESTRICT), `ratings.user_id → users.id` and `ratings.store_id → stores.id` (ON DELETE CASCADE)
- CHECK constraints: `rating BETWEEN 1 AND 5`, `CHAR_LENGTH(users.name) BETWEEN 20 AND 60`
- Indexes: `users.email` (unique), `users.role`, `users.name`, `users.created_at`, `stores.name`, `stores.email` (unique), `stores.address`, `stores.owner_id`, `ratings.store_id`, `ratings.user_id`, `ratings(user_id, store_id)` (unique)

### Option A – one command (recommended)

After configuring `backend/.env` (next section):

```bash
cd backend
npm install
npm run db:setup      # creates the database, applies database/schema.sql, inserts demo data
```

`db:setup` = `db:init` (create database + schema) followed by `db:seed` (demo data). Both can be run separately.
**Warning:** `schema.sql` drops and re-creates the tables, so `db:init`/`db:setup` erase existing data.

### Option B – plain SQL (MySQL CLI or MySQL Workbench)

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS store_rating CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p store_rating < database/schema.sql
mysql -u root -p store_rating < database/seed.sql
```

## Environment variables

### Backend – `backend/.env`

```bash
cd backend
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
```

| Variable             | Default                  | Description |
| -------------------- | ------------------------ | ----------- |
| `PORT`               | `5000`                   | API port |
| `NODE_ENV`           | `development`            | `test` is set automatically by the test runner |
| `CORS_ORIGIN`        | `http://localhost:5173`  | Comma-separated allowed browser origins |
| `DB_HOST`            | `localhost`              | MySQL host |
| `DB_PORT`            | `3306`                   | MySQL port |
| `DB_USER`            | `root`                   | MySQL user |
| `DB_PASSWORD`        | *(empty)*                | MySQL password |
| `DB_NAME`            | `store_rating`           | Application database |
| `DB_NAME_TEST`       | `store_rating_test`      | Database used by `npm test` (wiped on every run) |
| `JWT_SECRET`         | **required**             | Secret for signing tokens – use a long random string |
| `JWT_EXPIRES_IN`     | `1d`                     | Token lifetime |
| `BCRYPT_SALT_ROUNDS` | `10`                     | bcrypt cost factor |

Generate a strong secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend – `frontend/.env` (optional)

| Variable       | Default | Description |
| -------------- | ------- | ----------- |
| `VITE_API_URL` | `/api`  | API base URL. In development Vite proxies `/api` to `http://localhost:5000`. Set a full URL for a production build served from another origin. |

## Backend installation

```bash
cd backend
npm install
cp .env.example .env        # then edit DB_PASSWORD and JWT_SECRET
npm run db:setup
```

## Frontend installation

```bash
cd frontend
npm install
```

## How to run

Open two terminals.

**Terminal 1 – API**

```bash
cd backend
npm run dev          # nodemon, restarts on changes  (or: npm start)
```

The API listens on <http://localhost:5000>. Check <http://localhost:5000/api/health>.

**Terminal 2 – web app**

```bash
cd frontend
npm run dev
```

Open <http://localhost:5173>.

**Production build of the frontend**

```bash
cd frontend
npm run build        # outputs frontend/dist
npm run preview      # serves the build on http://localhost:4173
```

When serving `dist/` from a different origin than the API, set `VITE_API_URL` before building and add that origin to the backend `CORS_ORIGIN`.

Convenience scripts from the project root: `npm run install:all`, `npm run db:setup`, `npm run dev:backend`, `npm run dev:frontend`, `npm test`, `npm run build`.

## Demo credentials

Created by `npm run db:setup` (or `database/seed.sql`). The login page also has one-click buttons that fill these in.

| Role          | Email                | Password     | Notes |
| ------------- | -------------------- | ------------ | ----- |
| Administrator | `admin@example.com`  | `Admin@1234` | |
| Store owner   | `owner@example.com`  | `Admin@1234` | Owns *Sunrise Fresh Mart* and *Sunrise Electronics Hub* |
| Store owner   | `owner2@example.com` | `Admin@1234` | Owns *Green Leaf Organics* |
| Store owner   | `owner3@example.com` | `Admin@1234` | Owns *Golden Crust Bakery* and *City Book Corner* (no ratings yet) |
| Normal user   | `user@example.com`   | `User@1234`  | Rahul – has rated 3 stores |
| Normal user   | `amit@example.com`, `sneha@example.com`, `vikram@example.com`, `neha@example.com` | `User@1234` | |

Seed totals: 9 users, 5 stores, 11 ratings.

## API documentation

Base URL: `http://localhost:5000/api`

All responses use one envelope:

```json
{ "success": true,  "message": "Operation successful", "data": { } }
{ "success": false, "message": "Invalid email or password" }
{ "success": false, "message": "Name must be between 20 and 60 characters", "errors": { "name": "..." } }
```

Status codes: `200` OK, `201` created, `400` validation / bad input, `401` missing/invalid/expired token or wrong credentials, `403` wrong role, `404` not found, `409` duplicate (email, store email, second rating), `429` too many failed login attempts, `500` unexpected error.

Authenticated requests send `Authorization: Bearer <token>`.

### Authentication

| Method | Path                         | Access        | Body / notes |
| ------ | ---------------------------- | ------------- | ------------ |
| POST   | `/auth/register`             | Public        | `{ name, email, address, password, confirmPassword? }` → `{ token, user }`. Role is always `USER`. |
| POST   | `/auth/login`                | Public        | `{ email, password }` → `{ token, user }` |
| GET    | `/auth/me`                   | Any logged-in | Current user |
| POST   | `/auth/change-password`      | Any logged-in | `{ currentPassword, newPassword, confirmNewPassword }` → `{ token, user }` (new token; older tokens stop working) |
| GET    | `/health`                    | Public        | API + database health check |

### Admin (`ADMIN` only)

| Method | Path                   | Description |
| ------ | ---------------------- | ----------- |
| GET    | `/admin/dashboard`     | `{ totalUsers, totalStores, totalRatings, totalStoreOwners, totalNormalUsers, totalAdmins, averageRating }` |
| GET    | `/admin/users`         | List users. Query: `search` (name/email/address), `name`, `email`, `address`, `role` (`ADMIN`/`USER`/`OWNER`), `sortBy` (`name`,`email`,`address`,`role`,`createdAt`), `order` (`asc`/`desc`), `page`, `limit` (≤100). Owners include `ownerRating`. |
| POST   | `/admin/users`         | `{ name, email, address, password, role }` – create a normal user, admin or store owner |
| GET    | `/admin/users/:id`     | User details. Owners: `stores[]`, `ownerRating`, `ownerTotalRatings`. Users: `ratings[]`. |
| GET    | `/admin/owners`        | All `OWNER` accounts (for the "Add store" owner dropdown) |
| GET    | `/admin/stores`        | List stores with owner, `averageRating`, `totalRatings`. Query: `search`, `name`, `email`, `address`, `ownerId`, `sortBy` (`name`,`email`,`address`,`owner`,`rating`,`totalRatings`,`createdAt`), `order`, `page`, `limit` |
| POST   | `/admin/stores`        | `{ name, email, address, ownerId }` – `ownerId` must be a user with role `OWNER` |
| GET    | `/admin/stores/:id`    | Store, owner (name/email), `averageRating`, `totalRatings`, `ratingDistribution`, and `ratings[]` with `{ rating, createdAt, updatedAt, user: { id, name, email } }` |

### Normal user (`USER` only)

| Method | Path                    | Description |
| ------ | ----------------------- | ----------- |
| GET    | `/stores`               | Stores with `averageRating`, `totalRatings`, `myRating`. Query: `search` (name or address), `name`, `address`, `sortBy` (`name`,`address`,`rating`,`totalRatings`,`myRating`,`createdAt`), `order`, `page`, `limit` |
| GET    | `/stores/:id`           | One store with `myRating` |
| POST   | `/stores/:id/rating`    | `{ rating }` (1–5). First rating → `201`. A second POST → `409` (use PUT). |
| PUT    | `/stores/:id/rating`    | `{ rating }` – modify the existing rating (`404` if the user hasn't rated yet) |
| GET    | `/users/me`             | Profile + `{ totalRatings, averageRatingGiven }` |
| GET    | `/users/me/ratings`     | Every rating the user has submitted |

### Store owner (`OWNER` only)

| Method | Path                 | Description |
| ------ | -------------------- | ----------- |
| GET    | `/owner/dashboard`   | `stores[]` (name, address, averageRating, totalRatings) and `summary` (averageRating, totalRatings, uniqueRaters, totalStores, ratingDistribution) |
| GET    | `/owner/ratings`     | Users who rated the owner's stores: `{ rating, createdAt, updatedAt, user: { name, email }, store }`. Query: `storeId` (must be the owner's own – otherwise `403`), `search` (user name/email), `rating` (1–5), `sortBy` (`date`,`rating`,`name`,`email`,`store`), `order`, `page`, `limit` |

### Examples

```bash
# Log in
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@1234"}'

# Search users (admin token)
curl "http://localhost:5000/api/admin/users?search=pune&role=USER&sortBy=name&order=asc" \
  -H "Authorization: Bearer <token>"

# Stores in Pune sorted by rating (user token)
curl "http://localhost:5000/api/stores?search=pune&sortBy=rating&order=desc" \
  -H "Authorization: Bearer <token>"

# Rate a store, then change the rating (user token)
curl -X POST http://localhost:5000/api/stores/5/rating -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" -d '{"rating":4}'
curl -X PUT  http://localhost:5000/api/stores/5/rating -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" -d '{"rating":5}'
```

List endpoints return `{ items: [...], pagination: { page, limit, total, totalPages } }`.

## Validation rules

Enforced in the browser (`frontend/src/utils/validation.js`) **and** on the server (`backend/src/validators/rules.js`); the database adds CHECK / UNIQUE constraints as a last line of defence.

| Field          | Rule |
| -------------- | ---- |
| User name      | Required, trimmed, **20–60 characters** |
| Address        | Required, trimmed, **max 400 characters** |
| Email          | Required, trimmed, lower-cased, matches `^[^\s@]+@[^\s@]+\.[^\s@]+$`, max 255; unique per user (and per store) |
| Password       | **8–16 characters**, at least **one uppercase letter** and **one special character**: `^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$` |
| Rating         | Only the integers **1, 2, 3, 4, 5** (`"3"` is accepted as 3). Rejects `0`, `6`, `-1`, `5.5`, `"abc"`, empty |
| Role (admin)   | `ADMIN`, `USER` or `OWNER` |
| Store name     | Required, trimmed, 3–60 characters (see design decisions) |
| Store owner    | Must be an existing user with role `OWNER` |
| List queries   | `sortBy` must be one of the documented fields, `order` is `asc`/`desc`, `page` ≥ 1, `1 ≤ limit ≤ 100` – anything else is `400` |
| Route ids      | Positive integers only |

## Testing

The test suite runs against a **real MySQL database** (`DB_NAME_TEST`, default `store_rating_test`). Each test file drops and re-creates its tables, loads the seed data, starts the API on a random port and calls it over HTTP.

```bash
cd backend
npm test
```

MySQL must be running and the user in `backend/.env` must be allowed to create databases. `JWT_SECRET` is not needed for tests.

What is covered (87 tests):

| File                        | Covers |
| --------------------------- | ------ |
| `auth.test.js`              | Login success (all roles), login failure, unknown email, invalid email, register, public register can't become ADMIN/OWNER, duplicate email, invalid password, confirm password, tampered tokens, change password (wrong current, rules, mismatch, success, old token revoked) |
| `authorization.test.js`     | Admin can access admin APIs; user and owner get 403; no token → 401; user can't access owner APIs; owner/admin can't use rating APIs; forged and `alg: none` tokens rejected |
| `validation.test.js`        | Unit tests of every rule plus API tests: invalid name / address / email / password / rating / role / store fields, boundary lengths, trimming, sort-field injection, SQL-looking search input, `%` matched literally, bad ids |
| `ratings.test.js`           | Submit rating, numeric string rating, duplicate POST → 409 with no new row, DB unique constraint, modify rating, PUT before rating → 404, unknown store, admin view reflects ratings |
| `admin.test.js`             | Dashboard counts, create user / admin / owner / store, duplicate emails, non-owner store owner, search users by name / email / address, filter by role, sort asc/desc, pagination, user details, search / sort stores, store details |
| `owner.test.js`             | Own store rating and totals, users who rated, filter/sort, cannot access another owner's store (403), empty store, cannot create users/stores or change ratings |
| `stores.test.js`            | Store list with overall and own rating, search by name and address, sort by name/rating/address both ways, single store, profile |

## Git commands

The project is already a Git repository with a history of meaningful commits. To publish it:

```bash
cd store-rating-app
git status
git log --oneline
git remote add origin https://github.com/<your-username>/store-rating-app.git
git push -u origin main
```

Starting fresh instead:

```bash
git init
git add .
git commit -m "Initial commit: store rating application"
```

`.gitignore` excludes `node_modules/`, `.env`, `dist/`, `coverage/` and `*.log`.

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| `JWT_SECRET is not set` when starting the API | Copy `backend/.env.example` to `backend/.env` and set `JWT_SECRET`. |
| `Could not connect to MySQL` / `ECONNREFUSED 127.0.0.1:3306` | Start MySQL; check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`. |
| `ER_ACCESS_DENIED_ERROR` | Wrong MySQL user/password in `backend/.env`. |
| `ER_NOT_SUPPORTED_AUTH_MODE` (old MySQL clients) | Use MySQL 8 with mysql2 (already used), or `ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'yourpassword';`. |
| `Table 'store_rating.users' doesn't exist` | Run `npm run db:setup` in `backend`. |
| Ratings of 0 or 6 are accepted by MySQL directly | You're on MySQL < 8.0.16 (CHECK constraints ignored). The API still rejects them; upgrading is recommended. |
| Frontend shows "Cannot reach the server" | Start the backend (`npm run dev` in `backend`) – Vite proxies `/api` to port 5000. If the API runs elsewhere, start Vite with `VITE_PROXY_TARGET=http://host:port npm run dev`. |
| CORS error in the browser | Add the frontend origin to `CORS_ORIGIN` in `backend/.env` and restart the API. |
| "Too many attempts, please try again later" | 20 failed login/sign-up attempts from one IP in 15 minutes. Wait, or restart the API in development. |
| Port 5000 already in use (macOS AirPlay uses 5000) | Set `PORT=5001` in `backend/.env` and start Vite with `VITE_PROXY_TARGET=http://localhost:5001 npm run dev`. |
| Logged out unexpectedly | The token expired (`JWT_EXPIRES_IN`) or the password was changed on another device. Log in again. |
| `npm test` fails with access denied creating a database | Give the MySQL user `CREATE`/`DROP` rights, or create `store_rating_test` yourself and grant the user full rights on it. |

## Design decisions and known limitations

- **Store name length:** the 20–60 character rule is applied to people's names, as specified. Store names use 3–60 characters, because typical store names (e.g. "ABC Store") are shorter than 20. To apply the 20-character minimum to stores too, change `STORE_NAME_MIN` in `backend/src/validators/rules.js` and `frontend/src/utils/validation.js`.
- **Owners and stores:** a store has exactly one owner; an owner may own several stores. The owner dashboard shows every store they own (one store is the common case).
- **Ratings:** `POST` creates and `PUT` modifies, as in the spec. A rating can't be deleted by anyone through the API.
- **Token storage:** the JWT is kept in `localStorage` so sessions survive a refresh, and is validated against the server on load. An httpOnly cookie would be more resistant to XSS; the app renders no user-supplied HTML, which keeps that risk low.
- **Rate limiter:** in-memory, per process. Use a shared store (e.g. Redis) when running several API instances.
- **bcryptjs** (pure-JavaScript bcrypt) is used instead of the native `bcrypt` package: same algorithm and hash format (`$2a$`/`$2b$`), but no native build step, so `npm install` works on every OS.
- **Lockfiles:** `package-lock.json` files are generated on your first `npm install`.
- **Tests** need a running MySQL server; there are no frontend unit tests (the frontend was verified end-to-end in a browser).
