# Voltra Backend API

Industry-standard **Node.js + Express + MongoDB** backend built specifically for the
**Voltra** Next.js e-commerce frontend. Ships with proper JWT authentication (access +
refresh tokens in httpOnly cookies), bcrypt password hashing, a clean MVC folder structure,
input validation, centralized error handling, and rate limiting — ready for a freelance
delivery or an interview project demo.

The API response shapes (products, cart, wishlist) are built to match your existing
frontend context files (`CartContext.jsx`, `WishlistContext.jsx`, `AuthContext.jsx`)
almost 1:1, so wiring the frontend up should mostly mean swapping local state calls for
`fetch`/`axios` calls.

---

## 1. Folder structure

```
voltra-backend/
├── server.js                  # entry point
├── package.json
├── .env.example                # copy to .env and fill in
├── src/
│   ├── app.js                  # express app, middleware wiring
│   ├── config/
│   │   └── db.js                # mongoose connection
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Product.model.js
│   │   ├── Cart.model.js
│   │   └── Order.model.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── cart.controller.js
│   │   ├── wishlist.controller.js
│   │   └── order.controller.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── product.routes.js
│   │   ├── cart.routes.js
│   │   ├── wishlist.routes.js
│   │   └── order.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js   # protect / restrictTo
│   │   ├── validate.middleware.js
│   │   ├── error.middleware.js  # notFound + global error handler
│   │   └── asyncHandler.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   └── order.validator.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   └── generateTokens.js
│   └── seed/
│       ├── products.data.js     # your 27 products, converted from the frontend
│       └── seedProducts.js      # run to load them into MongoDB
```

---

## 2. Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```
MONGO_URI=mongodb://127.0.0.1:27017/voltra        # or your MongoDB Atlas URI
CLIENT_URL=http://localhost:3000                    # your Next.js frontend origin
JWT_ACCESS_SECRET=<generate a long random string>
JWT_REFRESH_SECRET=<generate a different long random string>
```

Generate strong secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Seed the database with your existing 27 products (sneakers/tshirts/pants/formal):

```bash
npm run seed
```

Run the server:

```bash
npm run dev      # nodemon, auto-restart
# or
npm start
```

Server boots on `http://localhost:5000` by default. Health check: `GET /api/v1/health`.

---

## 3. Connecting the Next.js frontend

Two things need to change on the frontend:

1. Every `fetch`/`axios` call to the API must send `credentials: "include"` (fetch) or
   `withCredentials: true` (axios) so the httpOnly auth cookies are sent/received.
2. `AuthContext.jsx`, `CartContext.jsx`, `WishlistContext.jsx` currently hold everything in
   local React state — replace the local mutations with API calls, keeping the same
   function names (`login`, `signup`, `addItem`, `toggle`, etc.) so the rest of your
   components don't need to change.

Example (login):

```js
const res = await fetch("http://localhost:5000/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ email, password }),
});
const data = await res.json();
```

---

## 4. API Reference

Base URL: `/api/v1`

### Auth (`/auth`)

| Method | Route              | Access  | Description                          |
|--------|---------------------|---------|---------------------------------------|
| POST   | `/auth/register`    | Public  | Create account (name, email, password) |
| POST   | `/auth/login`        | Public  | Log in (email, password)              |
| POST   | `/auth/logout`       | Private | Clears auth cookies                   |
| POST   | `/auth/refresh`      | Public* | Issues new access token from refresh cookie |
| GET    | `/auth/me`           | Private | Get current logged-in user            |
| PATCH  | `/auth/me`           | Private | Update name / default address         |
| PATCH  | `/auth/update-password` | Private | Change password                    |

### Products (`/products`)

| Method | Route                      | Access | Description |
|--------|-----------------------------|--------|--------------|
| GET    | `/products`                 | Public | List products. Query: `category, tab, search, minPrice, maxPrice, sort, page, limit` |
| GET    | `/products/meta/categories` | Public | Category counts |
| GET    | `/products/:id`              | Public | Single product by id (e.g. `sn-001`) |
| POST   | `/products`                  | Admin  | Create product |
| PATCH  | `/products/:id`               | Admin  | Update product |
| DELETE | `/products/:id`               | Admin  | Delete product |

### Cart (`/cart`) — all Private

| Method | Route              | Description |
|--------|---------------------|--------------|
| GET    | `/cart`              | Get logged-in user's cart |
| POST   | `/cart/items`         | Add item `{ productId, color, size, qty }` |
| PATCH  | `/cart/items/:lineId` | Update quantity `{ qty }` |
| DELETE | `/cart/items/:lineId` | Remove one line |
| DELETE | `/cart`              | Clear cart |

### Wishlist (`/wishlist`) — all Private

| Method | Route              | Description |
|--------|---------------------|--------------|
| GET    | `/wishlist`          | Get wishlist (populated products) |
| POST   | `/wishlist/toggle`   | Toggle a product `{ productId }` |

### Orders (`/orders`) — all Private

| Method | Route                  | Access | Description |
|--------|--------------------------|--------|--------------|
| POST   | `/orders`                 | User   | Place order from current cart `{ shippingAddress, cardNumber? }` |
| GET    | `/orders`                  | User   | Get my orders |
| GET    | `/orders/:id`               | User/Admin | Get single order |
| GET    | `/orders/admin/all`         | Admin  | Get all orders |
| PATCH  | `/orders/:id/status`        | Admin  | Update order status |

All responses follow the same shape:

```json
{ "success": true, "data": { ... }, "message": "..." }
{ "success": false, "message": "...", "errors": [ { "field": "email", "message": "..." } ] }
```

---

## 5. Security features included

- Password hashing with bcrypt (cost factor 12)
- JWT access (15 min) + refresh (7 days) tokens, both httpOnly cookies
- `helmet` for secure HTTP headers
- `express-mongo-sanitize` against NoSQL injection
- `hpp` against HTTP parameter pollution
- Rate limiting (general API + stricter on auth routes)
- Centralized error handler — no stack traces leaked in production
- Input validation on every write route (`express-validator`)
- CORS locked to `CLIENT_URL` with credentials support

## 6. Making yourself an admin (for admin-only routes)

There's no public "become admin" endpoint by design. After registering a normal
account, open MongoDB (Compass, Atlas UI, or `mongosh`) and set that user's `role`
field to `"admin"`:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

## 7. Notes

- Checkout is a **demo payment flow** (same as your frontend) — no real card processor
  is integrated. Only the last 4 digits of any card number are ever stored, purely for
  display purposes on the order confirmation.
- The `id` field on products (`sn-001`, `nk-...` etc.) is preserved from your frontend
  data so `/product/[id]` routes keep working without any change.
