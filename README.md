# 🛒 Ecommerce MERN Backend

The REST API / backend for a full-stack MERN e-commerce application. It handles
users, products, orders, payments (Razorpay), coupons, and an admin analytics
dashboard, backed by MongoDB via Mongoose.

> **Backend only.** This repository does not include the React frontend. The
> expected frontend origin is configured with `FRONTEND_URL` (default
> `http://localhost:5173`, the Vite dev server).

---

## ✨ Features

- **Users** – create / read / delete users (client-supplied id model).
- **Products** – full CRUD with image upload, categories, search, price-range
  filtering, sorting, and pagination.
- **Orders** – create orders, list a user's orders, list all orders (admin),
  process order status workflow, delete orders.
- **Payments** – Razorpay order creation, signature verification, and publishable
  key delivery.
- **Coupons / Discounts** – create / read / update / delete coupons and apply a
  discount by coupon code.
- **Admin dashboard** – aggregate stats, pie charts, bar charts, and line charts
  for revenue/users/products over time.
- **Caching** – in-memory `node-cache` layer for product/order/dashboard reads.
- **TypeScript** – strict, ESM (`"type": "module"`) codebase compiled with `tsc`.

---

## 🧱 Tech Stack

| Concern     | Technology                                       |
| ----------- | ------------------------------------------------ |
| Runtime     | Node.js                                          |
| Framework   | Express 5                                        |
| Language    | TypeScript (ES2020, NodeNext modules, strict)    |
| Database    | MongoDB (Mongoose 9)                             |
| Auth\*      | Custom`adminOnly` middleware (see caveats below) |
| Payments    | Razorpay                                         |
| File upload | Multer (local disk storage in`uploads/`)         |
| Logging     | Morgan (dev format)                              |
| Caching     | node-cache                                       |
| Validation  | `validator` (email) + manual checks              |
| Dev tooling | `nodemon`, `@faker-js/faker`, `@types/*`         |

\* Authentication is currently a lightweight id-based check and is **not
production-grade**

---

## 📋 Prerequisites

- **Node.js** 18+ (recommended 20+)
- **MongoDB** – a local instance or a MongoDB Atlas connection string
- **Razorpay account** – API key id + secret (test keys work for development)
- **npm** (bundled with Node.js)

---

## 🔧 Installation

```bash
# 1. Clone the repository
git clone https://github.com/guptafactory/ecommerce-mern-backend.git
cd ecommerce-mern-backend

# 2. Install dependencies
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root. Use the following template (values
below are placeholders — **never commit real secrets**):

```env
# Server port
PORT=3000

# MongoDB connection string (local or Atlas)
MONGO_URI="mongodb://127.0.0.1:27017/ecommerce-mern"

# Razorpay credentials (get these from the Razorpay dashboard)
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"

# Allowed frontend origin
FRONTEND_URL="http://localhost:5173"

# Optional: products per page for the paginated products endpoint (default 8)
PRODUCT_PER_PAGE=8
```

| Variable              | Required | Default                 | Description                      |
| --------------------- | :------: | ----------------------- | -------------------------------- |
| `PORT`                |    no    | `3000`                  | HTTP port the server listens on  |
| `MONGO_URI`           |   yes    | –                       | MongoDB connection string        |
| `RAZORPAY_KEY_ID`     |   yes    | –                       | Razorpay key id                  |
| `RAZORPAY_KEY_SECRET` |   yes    | –                       | Razorpay key secret              |
| `FRONTEND_URL`        |    no    | `http://localhost:5173` | Intended allowed frontend origin |
| `PRODUCT_PER_PAGE`    |    no    | `8`                     | Page size for`GET /product/all`  |

---

## 🚀 Running the App

Because this project compiles TypeScript to `dist/` before running, the typical
development loop uses two terminals:

```bash
# Terminal 1 – watch & recompile TypeScript on change
npm run watch

# Terminal 2 – run the compiled output with auto-restart
npm run dev
```

### Scripts

| Script          | Command               | Description                           |
| --------------- | --------------------- | ------------------------------------- |
| `npm run build` | `tsc`                 | Compile TypeScript (`src/` → `dist/`) |
| `npm run watch` | `tsc -w`              | Recompile TypeScript on file changes  |
| `npm run dev`   | `nodemon dist/app.js` | Run compiled output with auto-restart |
| `npm start`     | `node dist/app.js`    | Run compiled output (production)      |

The server logs `Server is running on port <PORT>` on success, and
`DB connected to <host>` once Mongoose connects.

---

## 🗂️ Project Structure

```text
ecommerce-mern-backend/
├── src/
│   ├── app.ts                 # Express app entry point
│   ├── controllers/           # Route handlers (business logic)
│   │   ├── user.ts
│   │   ├── product.ts
│   │   ├── order.ts
│   │   ├── payment.ts
│   │   └── dashboard.ts
│   ├── middlewares/
│   │   ├── auth.ts            # adminOnly middleware
│   │   ├── error.ts           # TryCatch wrapper + error middleware
│   │   └── multer.ts          # File upload config (disk storage)
│   ├── models/                # Mongoose schemas
│   │   ├── user.ts
│   │   ├── product.ts
│   │   ├── order.ts
│   │   └── payment.ts         # Coupon model
│   ├── routes/                # Route definitions
│   │   ├── user.ts
│   │   ├── product.ts
│   │   ├── order.ts
│   │   ├── payment.ts
│   │   └── dashboard.ts
│   ├── types/                 # Shared TypeScript types
│   └── utils/
│       ├── db.ts              # Mongoose connection
│       ├── cache.ts           # Cache invalidation helpers
│       ├── error-handler.ts   # Custom ErrorHandler class
│       ├── product-stock.ts   # Stock reduction on order
│       └── dashboard.ts       # Chart/percent calculations
├── uploads/                   # Uploaded images (runtime, git-ignored)
├── dist/                      # Compiled JavaScript (generated)
├── .env                       # Environment variables (git-ignored)
├── tsconfig.json
└── package.json
```

---

## 🧩 Data Models

### User

| Field    | Type      | Notes                                |
| -------- | --------- | ------------------------------------ |
| `_id`    | String    | Client-supplied id (required)        |
| `name`   | String    | Required                             |
| `email`  | String    | Required, unique, validated as email |
| `photo`  | String    | Required                             |
| `role`   | String    | `admin` \| `user` (default `user`)   |
| `gender` | String    | `male` \| `female`                   |
| `dob`    | Date      | Required                             |
| `age`    | (virtual) | Computed from`dob`                   |

### Product

| Field      | Type   | Notes           |
| ---------- | ------ | --------------- |
| `name`     | String | Required        |
| `category` | String | Required        |
| `price`    | Number | Required        |
| `stock`    | Number | Required        |
| `photo`    | String | Required (path) |

### Order

| Field             | Type   | Notes                                                           |
| ----------------- | ------ | --------------------------------------------------------------- |
| `shippingInfo`    | Object | address, city, state, country, pinCode                          |
| `user`            | String | Ref → User                                                      |
| `subtotal`        | Number | Required                                                        |
| `tax`             | Number | Required                                                        |
| `shippingCharges` | Number | Default`0`                                                      |
| `discount`        | Number | Default`0`                                                      |
| `total`           | Number | Required                                                        |
| `status`          | String | `Processing` \| `Shipped` \| `Delivered` (default `Processing`) |
| `orderItems`      | Array  | name, photo, price, quantity, productId (Ref → Product)         |

### Coupon (model file `payment.ts`)

| Field    | Type   | Notes               |
| -------- | ------ | ------------------- |
| `code`   | String | Required, unique    |
| `amount` | Number | Required (discount) |

---

## 🛣️ API Reference

All endpoints are prefixed with `/api/v1`. Success responses follow the shape
`{ success: true, message, ...data }`; errors follow
`{ success: false, message }`.

> **Auth note:** routes marked 🔒 use the `adminOnly` middleware, which currently
> trusts a user id passed via `req.query.id` (`?id=...`).

### Users — `/api/v1/user`

| Method | Endpoint | Auth | Description                                    |
| ------ | -------- | :--: | ---------------------------------------------- |
| POST   | `/new`   |  –   | Create a user (or "welcome back" if id exists) |
| GET    | `/all`   |  🔒  | List all users                                 |
| GET    | `/:id`   |  –   | Get a single user by id                        |
| DELETE | `/:id`   |  🔒  | Delete a user by id                            |

### Products — `/api/v1/product`

| Method | Endpoint          | Auth | Description                                    |
| ------ | ----------------- | :--: | ---------------------------------------------- |
| POST   | `/new`            |  🔒  | Create a product (multipart form field`photo`) |
| GET    | `/categories`     |  –   | List all distinct categories                   |
| GET    | `/latest`         |  –   | Latest 5 products                              |
| GET    | `/all`            |  –   | Paginated products with search/filter/sort     |
| GET    | `/admin-products` |  🔒  | All products (admin view)                      |
| GET    | `/:id`            |  –   | Get a single product by id                     |
| PUT    | `/:id`            |  🔒  | Update a product (optional new`photo`)         |
| DELETE | `/:id`            |  🔒  | Delete a product                               |

**`GET /product/all` query parameters:**

| Param      | Type   | Description                                     |
| ---------- | ------ | ----------------------------------------------- |
| `search`   | string | Case-insensitive regex match on`name`           |
| `category` | string | Exact category match                            |
| `minPrice` | number | Minimum price (`$gte`)                          |
| `maxPrice` | number | Maximum price (`$lte`)                          |
| `sort`     | string | `asc` or `desc` by price (anything else → desc) |
| `page`     | number | Page number (default`1`)                        |

Response also includes `totalPages`.

### Orders — `/api/v1/order`

| Method | Endpoint | Auth | Description                                               |
| ------ | -------- | :--: | --------------------------------------------------------- |
| POST   | `/new`   |  –   | Create an order (reduces stock)                           |
| GET    | `/my`    |  –   | Orders for a user (`?id=<userId>`)                        |
| GET    | `/all`   |  🔒  | All orders                                                |
| GET    | `/:id`   |  –   | Get a single order by id                                  |
| PUT    | `/:id`   |  🔒  | Advance order status (`Processing → Shipped → Delivered`) |
| DELETE | `/:id`   |  🔒  | Delete an order                                           |

### Payments — `/api/v1/payment`

| Method | Endpoint      | Auth | Description                              |
| ------ | ------------- | :--: | ---------------------------------------- |
| POST   | `/create`     |  –   | Create a Razorpay order from`{ amount }` |
| GET    | `/getKey`     |  –   | Get Razorpay publishable key id          |
| POST   | `/verify`     |  –   | Verify Razorpay signature                |
| POST   | `/coupon/new` |  🔒  | Create a coupon                          |
| GET    | `/coupon/all` |  🔒  | List all coupons                         |
| GET    | `/coupon/:id` |  –   | Get a coupon by id                       |
| PUT    | `/coupon/:id` |  🔒  | Update a coupon                          |
| DELETE | `/coupon/:id` |  🔒  | Delete a coupon                          |
| GET    | `/discount`   |  –   | Apply a coupon (`?coupon=<code>`)        |

### Dashboard — `/api/v1/dashboard` (all 🔒 admin)

| Method | Endpoint | Description                                          |
| ------ | -------- | ---------------------------------------------------- |
| GET    | `/stats` | Headline stats (revenue, counts, trends, etc.)       |
| GET    | `/pie`   | Pie chart data (categories, user ratio)              |
| GET    | `/bar`   | Bar chart data (users, products, orders)             |
| GET    | `/line`  | Line chart data (users, products, discount, revenue) |

### Health

| Method | Endpoint | Auth | Description                             |
| ------ | -------- | :--: | --------------------------------------- |
| GET    | `/`      |  –   | Returns`"Welcome to ecommerce backend"` |

Uploaded images are served statically from `/uploads/<filename>`.

---

## ⚠️ Known Limitations

This project is a learning/development codebase and is **not yet production
hardened**

---

## 🗺️ Roadmap / Future Improvements

**Security**

- [ ] Replace id-based auth with JWT authentication (login + `bcrypt` password
      hashing).
- [ ] Add ownership checks to prevent IDOR on user/order endpoints.
- [ ] Derive payment amounts and order totals server-side from the DB.
- [ ] Restrict CORS to `FRONTEND_URL`.
- [ ] Complete payment verification and mark orders as paid.

**Reliability**

- [ ] Atomic, transactional stock decrement; restore stock on order cancel/delete.
- [ ] Fail fast / exit on DB connection error and add graceful shutdown.
- [ ] Add input validation (e.g. `zod` / `express-validator`).

**Operations**

- [ ] Rate limiting, request body size limits, and `helmet` hardening.
- [ ] Structured logging.
- [ ] Replace in-memory cache with Redis (or add TTL + eviction) for scale.
- [ ] Add a dedicated `/health` endpoint.
- [ ] Move uploads to cloud storage (e.g. S3/Cloudinary) with type/size checks.
- [ ] Centralized, validated environment configuration.

**Quality**

- [ ] Expand order statuses (Cancelled, Refunded, Returned, etc.).
- [ ] Add tests (unit + integration).
- [ ] Add API docs (e.g. Swagger/OpenAPI).

---

## 📄 License

ISC

---

## 👤 Author

**Himanshu Gupta**
