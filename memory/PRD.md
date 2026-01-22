# ReLocal - Travel-First Local Marketplace

## Original Problem Statement
Build a full-stack application called "ReLocal" - a travel-first marketplace for tourists to discover and buy authentic local products from physical shops, with a strong emphasis on door delivery to avoid carrying luggage.

## User Personas
1. **Tourists** - Travel and discover local products, prefer door delivery to avoid luggage
2. **Shopkeepers** - Local shop owners who list products and manage orders
3. **Admins** - Platform administrators who verify shops and products

## Core Requirements
- Multi-role authentication (Tourist, Shopkeeper, Admin)
- Email/Password and Google OAuth login
- Product discovery via QR codes in physical shops
- "Travel Light" USP - door delivery default, ship-after-trip options
- Order management and history with "Buy Again" feature
- QR code generation and analytics for shopkeepers
- Admin verification workflows

## Tech Stack
- **Backend**: FastAPI, Pydantic, MongoDB (motor)
- **Frontend**: React, react-router-dom, axios, Tailwind CSS, Shadcn UI
- **Integrations**: Emergent Google OAuth, Stripe payments, QR code generation

## Key Features Implemented

### Authentication
- [x] Email/Password registration and login
- [x] Google OAuth via Emergent
- [x] Session-based authentication with cookies
- [x] Role-based access control

### Tourist Features
- [x] Product browsing and detail view
- [x] QR code scanning (external camera -> product page)
- [x] Shopping cart and checkout
- [x] Order history with "Buy Again"
- [x] Travel Mode toggle
- [x] Shipping cost estimation

### Shopkeeper Features
- [x] Shop creation and management
- [x] Product listing with images and weight
- [x] QR code generation (View & Download)
- [x] Order fulfillment dashboard
- [x] Shop insights and analytics

### Admin Features
- [x] Pending shop verification
- [x] Pending product verification
- [x] Platform overview

## January 22, 2026 - Features Completed

### External QR Code Scanning Fix
- Backend `/api/qr/scan/{qr_code_id}` now returns 303 redirect to frontend product page
- Product page is accessible without authentication
- Auth modal appears when non-logged user attempts checkout

### Simplified Signup Flow
- Signup form has optional "Full Name" field
- Only email and password are required
- Full name can be added later in profile

### In-App QR Code Display
- Shopkeepers can now view QR codes in a modal (not just download)
- "View QR" and "Download" buttons on each product card
- Modal shows QR image with download option

## Database Schema
- **users**: user_id, email, name, role, travel_mode, addresses
- **shops**: shop_id, owner_id, name, location, verified
- **products**: product_id, shop_id, name, price, weight, qr_code_id, verified
- **orders**: order_id, buyer_id, items, delivery_preference, status
- **qr_codes**: qr_code_id, product_id, scans_count

## API Endpoints
- `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`
- `/api/auth/google`, `/api/auth/callback/google`
- `/api/products/{product_id}` (public)
- `/api/qr/scan/{qr_code_id}` (public, redirects)
- `/api/qr/generate/{product_id}` (authenticated)
- `/api/shops/my-shop`, `/api/shops/{shop_id}/products`
- `/api/orders`, `/api/shipping/estimate`
- `/api/admin/shops/pending`, `/api/admin/products/pending`

## Test Credentials
See `/app/TEST_USERS_GUIDE.md` for all test users

## Known Limitations
- **MOCKED**: Shipping estimation uses rule-based mock in `/app/backend/shipping_service.py`
- No real courier API integration yet

## Upcoming Tasks (P1)
1. Real shipping API integration (Shippo/Easyship)
2. Admin dispute and refund management
3. Commission rate configuration

## Future Tasks (P2+)
1. Gifting feature with custom messages
2. Logistics partner role
3. Apple Sign-In
4. Internationalization (i18n)
5. Refactor backend monolith into separate routers
