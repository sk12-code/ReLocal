# ReLocal Test Users Guide

## 🔐 Authentication Methods

ReLocal now supports **two authentication methods**:

1. **Email/Password** - Direct login with test credentials below
2. **Google OAuth** - Emergent-managed Google authentication

---

## 👥 Test User Accounts

### 📱 TOURIST USERS

#### Tourist User 1 - New User (No Orders)
- **Email:** `test.tourist1@relocal.com`
- **Password:** `password123`
- **User ID:** `test_tourist_001`
- **Session Token:** `test_session_test_tourist_001`
- **Use Case:** First-time user experience, empty dashboard

#### Tourist User 2 - Active User (Has Orders)
- **Email:** `test.tourist2@relocal.com`
- **Password:** `password123`
- **User ID:** `test_tourist_002`
- **Session Token:** `test_session_test_tourist_002`
- **Use Case:** User with purchase history, reorder testing
- **Orders:** 3 orders (confirmed, shipped, pickup)

---

### 🏪 SHOPKEEPER USERS

#### Seller User 1 - New Seller (No Shop)
- **Email:** `test.seller1@relocal.com`
- **Password:** `password123`
- **User ID:** `test_shopkeeper_001`
- **Session Token:** `test_session_test_shopkeeper_001`
- **Use Case:** Shop onboarding flow

#### Seller User 2 - Established Seller (Verified Shop)
- **Email:** `test.seller2@relocal.com`
- **Password:** `password123`
- **User ID:** `test_shopkeeper_002`
- **Session Token:** `test_session_test_shopkeeper_002`
- **Use Case:** Full seller dashboard, product management
- **Shop:** Barcelona Pottery Studio (Verified)
- **Products:** 2 verified products
- **Orders:** 3 orders to fulfill

#### Seller User 3 - Pending Verification (Unverified Shop)
- **Email:** `test.seller3@relocal.com`
- **Password:** `password123`
- **User ID:** `test_shopkeeper_003`
- **Session Token:** `test_session_test_shopkeeper_003`
- **Use Case:** Pending verification workflow
- **Shop:** Tokyo Textile Art (Pending Verification)
- **Products:** 1 unverified product

---

### 👑 ADMIN USER

#### Admin User - Platform Administrator
- **Email:** `test.admin@relocal.com`
- **Password:** `admin123`
- **User ID:** `test_admin_001`
- **Session Token:** `test_session_test_admin_001`
- **Use Case:** Admin dashboard, verification workflows
- **Permissions:** Verify shops, verify products, manage categories

---

## 🏬 Test Shops

### Shop 1: Barcelona Pottery Studio ✅ VERIFIED
- **Shop ID:** `test_shop_001`
- **Owner:** Seller User 2
- **Location:** Carrer de la Rambla 42, Barcelona, Spain
- **Categories:** Pottery, Ceramics, Handicrafts
- **Status:** Verified & Active
- **Products:** 2 verified products

### Shop 2: Tokyo Textile Art ⏳ PENDING
- **Shop ID:** `test_shop_002`
- **Owner:** Seller User 3
- **Location:** Shibuya 123, Tokyo, Japan
- **Categories:** Textiles, Art, Traditional Crafts
- **Status:** Pending Verification
- **Products:** 1 unverified product

---

## 📦 Test Products

### Product 1: Handcrafted Ceramic Bowl ✅
- **Product ID:** `test_product_001`
- **Shop:** Barcelona Pottery Studio
- **Price:** $45.00
- **Status:** Verified
- **QR Scans:** 15
- **Image:** Blue and white ceramic bowl

### Product 2: Artisan Coffee Mug Set ✅
- **Product ID:** `test_product_002`
- **Shop:** Barcelona Pottery Studio
- **Price:** $68.00
- **Status:** Verified
- **QR Scans:** 22
- **Image:** Set of 4 handmade mugs

### Product 3: Traditional Kimono Fabric ⏳
- **Product ID:** `test_product_003`
- **Shop:** Tokyo Textile Art
- **Price:** $95.00
- **Status:** Pending Verification
- **QR Scans:** 5
- **Image:** Authentic silk fabric

---

## 📋 Test Orders

### Order 1: $90.00 - CONFIRMED
- **Order ID:** `test_order_001`
- **Buyer:** Tourist User 2
- **Shop:** Barcelona Pottery Studio
- **Items:** 2x Handcrafted Ceramic Bowl
- **Delivery:** Door delivery to New York
- **Status:** Confirmed (awaiting shipment)

### Order 2: $68.00 - SHIPPED
- **Order ID:** `test_order_002`
- **Buyer:** Tourist User 2
- **Shop:** Barcelona Pottery Studio
- **Items:** 1x Artisan Coffee Mug Set
- **Delivery:** Door delivery to New York
- **Tracking:** TRACK123456789
- **Status:** Shipped

### Order 3: $45.00 - PICKUP
- **Order ID:** `test_order_003`
- **Buyer:** Tourist User 2
- **Shop:** Barcelona Pottery Studio
- **Items:** 1x Handcrafted Ceramic Bowl
- **Delivery:** Shop pickup
- **Status:** Confirmed (ready for pickup)

---

## 🧪 Test Scenarios

### Scenario 1: New Tourist Journey
1. Login as `test.tourist1@relocal.com`
2. View empty dashboard
3. Scan QR code or browse products
4. Add to cart and checkout
5. View order history

### Scenario 2: Repeat Buyer
1. Login as `test.tourist2@relocal.com`
2. View 3 existing orders
3. Click "Buy Again" on any order
4. Complete reorder

### Scenario 3: New Seller Onboarding
1. Login as `test.seller1@relocal.com`
2. Complete shop creation form
3. Add first product
4. Generate QR code
5. Wait for admin verification

### Scenario 4: Active Seller Operations
1. Login as `test.seller2@relocal.com`
2. View shop insights (revenue, orders, QR scans)
3. Manage 2 existing products
4. View and fulfill orders
5. Add tracking ID to shipment

### Scenario 5: Admin Verification
1. Login as `test.admin@relocal.com`
2. View pending shops (Tokyo Textile Art)
3. View pending products (Traditional Kimono Fabric)
4. Verify or reject submissions
5. Monitor platform activity

### Scenario 6: QR Code Analytics
1. Login as `test.seller2@relocal.com`
2. Navigate to Shop Insights
3. View QR scan statistics
4. Download QR codes for products
5. Track conversion rates

---

## 🔗 Quick Access URLs

- **Landing Page:** http://localhost:3000/
- **Login:** http://localhost:3000/login
- **Tourist Dashboard:** http://localhost:3000/dashboard
- **Seller Dashboard:** http://localhost:3000/shop-dashboard
- **Admin Dashboard:** http://localhost:3000/admin-dashboard
- **Product Detail:** http://localhost:3000/products/test_product_001

---

## 🧑‍💻 API Testing

### Using Session Tokens (Direct API Access)

```bash
# Tourist API call
curl -H "Authorization: Bearer test_session_test_tourist_002" \
  http://localhost:8001/api/orders

# Seller API call
curl -H "Authorization: Bearer test_session_test_shopkeeper_002" \
  http://localhost:8001/api/orders/seller

# Admin API call
curl -H "Authorization: Bearer test_session_test_admin_001" \
  http://localhost:8001/api/admin/shops/pending
```

### Using Email/Password Login

```bash
# Login and get session cookie
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test.tourist2@relocal.com", "password": "password123"}' \
  -c cookies.txt

# Use session cookie for authenticated requests
curl -b cookies.txt http://localhost:8001/api/orders
```

---

## 📊 Expected Metrics

### Shop Insights (Barcelona Pottery Studio)
- **Total Revenue:** $203.00
- **Total Orders:** 3
- **Repeat Buyers:** 1 (Tourist User 2)
- **Total Products:** 2
- **Total QR Scans:** 37
- **Average Order Value:** $67.67
- **QR Engagement Rate:** 18.5 scans/product

---

## 🎯 Feature Coverage

✅ Email/Password Authentication
✅ Google OAuth Authentication
✅ Multi-role system (Tourist, Shopkeeper, Admin)
✅ Shop creation and management
✅ Product listing with QR codes
✅ QR code generation and analytics
✅ Order placement (delivery & pickup)
✅ Order history and reordering
✅ Payment integration (Stripe)
✅ Admin verification workflows
✅ Shop insights and analytics
✅ Session management
✅ Role-based access control

---

## 🔒 Security Notes

- All passwords are hashed with bcrypt
- Sessions expire after 30 days for test users
- Session tokens stored as httpOnly cookies
- Role-based API authorization
- MongoDB ObjectId properly excluded from responses
- Environment variables for sensitive data

---

## 🚀 Getting Started

1. Navigate to http://localhost:3000/login
2. Choose any test account from the list above
3. Explore the features based on the user role
4. Test different scenarios and user journeys

**Happy Testing! 🎉**
