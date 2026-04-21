# Sneaker E-commerce Platform

Production-grade full-stack sneaker commerce baseline inspired by Nike/Jordan premium experiences.

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS
- Framer Motion
- Zustand
- TanStack Query
- Axios
- React Hook Form + Zod

### Backend
- Django 5 + Django REST Framework
- PostgreSQL
- Redis cache
- JWT auth with httpOnly cookies
- Django Admin
- drf-spectacular (Swagger/OpenAPI)
- WhiteNoise

## Project Structure

- backend
- frontend
- docker-compose.yml

## Implemented Features

### Storefront
- Premium dark-themed hero inspired by Jumpman design language
- Featured product section
- Product listing with:
  - Debounced search
  - Filtering (category/brand/price/size/color/availability)
  - Sort options
  - Grid/list toggle
  - Infinite scrolling
- Product detail with gallery, variant selection, quantity control, tabs
- Cart page with quantity updates, removal, pricing summary
- Checkout flow with multi-step UI and order creation
- Login/Register pages with validation
- Account dashboard, orders, wishlist
- Contact/Support page with FAQ + placeholders for chat/map

### Backend APIs
- Auth
  - POST /api/auth/register/
  - POST /api/auth/login/
  - POST /api/auth/logout/
  - POST /api/auth/refresh/
  - POST /api/auth/password-reset/
  - POST /api/auth/password-reset-confirm/
  - GET/PUT /api/auth/profile/
- Products
  - GET /api/products/
  - GET /api/products/{slug}/
  - GET /api/products/featured/
  - GET /api/products/categories/
  - GET /api/products/brands/
- Cart
  - GET /api/cart/
  - POST /api/cart/add/
  - PUT /api/cart/update/{item_id}/
  - DELETE /api/cart/remove/{item_id}/
  - DELETE /api/cart/clear/
- Orders
  - POST /api/orders/create/
  - GET /api/orders/
  - GET /api/orders/{id}/
  - POST /api/orders/{id}/cancel/
- Addresses
  - GET /api/addresses/
  - POST /api/addresses/
  - PUT /api/addresses/{id}/
  - DELETE /api/addresses/{id}/
  - PATCH /api/addresses/{id}/default/
- Wishlist
  - GET /api/wishlist/
  - POST /api/wishlist/add/
  - DELETE /api/wishlist/remove/{id}/
- Contact
  - POST /api/contact/

### Admin
- Product, brand, category, variant management
- Cart/cart item management
- Order workflow management
- User/address/wishlist management
- Contact inbox management

### Security/Performance Baseline
- JWT + secure cookie options
- CORS + CSRF trusted origins
- Throttle support for auth endpoints
- ORM-based queries (SQL injection resistant)
- Cache support (Redis)
- select_related/prefetch_related optimization in key API views

## Local Setup

### 1) Docker (recommended)

```bash
cp .env.example .env
docker compose up --build
```

The root `.env` file is used by Docker Compose for database credentials, Django secrets, CORS origins, and frontend API URL.

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Swagger: http://localhost:8000/api/docs/
- Django Admin: http://localhost:8000/admin/

### 2) Manual Backend Setup

```bash
cd backend
python -m venv .venv
# activate .venv
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 2b) Manual Backend Setup (SQLite quick mode)

Use this when you want to run locally without PostgreSQL/Redis.

```bash
cd backend
python -m venv .venv
# activate .venv
pip install -r requirements.txt
cp .env.example .env
# ensure USE_SQLITE=true in .env
python manage.py migrate
python manage.py runserver
```

### 3) Manual Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Testing

### Backend

```bash
cd backend
python manage.py test
# or
pytest
```

### Frontend

```bash
cd frontend
npm run test
npx playwright install
npm run test:e2e
```

## API Docs

- OpenAPI schema: /api/schema/
- Swagger UI: /api/docs/

## Netlify Deployment (Frontend)

This repository is configured for Netlify to deploy the Next.js app from the `frontend` folder.

### What was added

- Root `netlify.toml` with:
  - `base = "frontend"`
  - `command = "npm run build"`
  - `publish = ".next"`
  - Next.js runtime plugin (`@netlify/plugin-nextjs`)

### Deploy Steps

1. Push the repo to GitHub (already done).
2. In Netlify: **Add new site** -> **Import from Git**.
3. Select this repository.
4. Netlify will read `netlify.toml` automatically.
5. Add required environment variable in Netlify site settings:
   - `NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api`
6. Trigger deploy.

### Important: Backend Must Be Hosted Separately

Netlify hosts the frontend only in this setup. Deploy Django backend to a backend host (Render/Railway/Fly.io/VM/etc), then configure backend environment variables for cross-site cookie auth.

Recommended backend production values (`backend/.env`):

```env
DEBUG=false
ALLOWED_HOSTS=api.your-domain.com
FRONTEND_URLS=https://your-site.netlify.app
PASSWORD_RESET_FRONTEND_URL=https://your-site.netlify.app

JWT_COOKIE_SECURE=true
JWT_COOKIE_SAMESITE=None
SESSION_COOKIE_SECURE=true
CSRF_COOKIE_SECURE=true
```

Without these cookie/security settings, login/session flows may fail when frontend and backend run on different domains.

## Notes

- Stripe payment is scaffolded as a selectable method with a mock checkout path; complete Stripe intents/webhooks should be added for production payment processing.
- Bulk CSV/Excel import, advanced analytics charts, and richer admin report exports are designed as extension points on top of this baseline.
- Run migrations after model changes.
