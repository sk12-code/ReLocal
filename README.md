# ReLocal 🌍✈️

**A Travel-First Marketplace for Authentic Local Products**

ReLocal connects tourists with local shopkeepers, enabling travelers to discover and purchase authentic local products without the hassle of carrying them in their luggage. Simply scan a QR code in any partner shop, and we'll deliver your purchases directly to your door anywhere in the world.

![ReLocal](https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800)

---

## 🎯 The Problem We Solve

Travelers often miss out on buying authentic local products because:
- **Luggage limitations** - Can't fit fragile pottery or bulky textiles
- **Airline restrictions** - Weight limits and baggage fees
- **Fragile items** - Fear of damage during travel
- **Liquids & customs** - Restrictions on certain products

## 💡 Our Solution: Travel Light

ReLocal's **"Travel Light"** philosophy means you can shop freely and we handle the logistics. Browse products in physical shops, scan the QR code, and have everything shipped to your home after your trip ends.

---

## ✨ Features

### For Tourists 🧳

| Feature | Description |
|---------|-------------|
| **QR Code Scanning** | Scan product QR codes with your phone camera - no app needed |
| **Public Product Pages** | View product details without logging in |
| **Travel Mode** | Enable travel mode to see shipping estimates and luggage savings |
| **Door Delivery** | Get products shipped directly to your home address |
| **Shop Pickup** | Option to pick up from the store if preferred |
| **Order History** | Track all your purchases in one place |
| **Buy Again** | Reorder favorite products with one click |
| **Shipping Estimates** | See estimated delivery costs at checkout |

### For Shopkeepers 🏪

| Feature | Description |
|---------|-------------|
| **Shop Dashboard** | Manage your shop profile and settings |
| **Product Management** | Add, edit, and organize your products |
| **QR Code Generation** | Generate and download QR codes for each product |
| **In-App QR View** | View QR codes directly in the app (NEW) |
| **Order Management** | View and fulfill customer orders |
| **Tracking Updates** | Add shipping tracking numbers |
| **Shop Insights** | Analytics on revenue, orders, and QR scans |

### For Admins 👑

| Feature | Description |
|---------|-------------|
| **Shop Verification** | Review and approve new shop registrations |
| **Product Verification** | Verify products before they go live |
| **Platform Overview** | Monitor overall platform activity |

---

## 🚀 Recent Updates (January 2026)

### New Features

1. **📱 External QR Scanning**
   - Scan product QR codes using your phone's native camera app
   - Automatically redirects to the product page in your browser
   - No app installation required

2. **🔐 Auth at Checkout**
   - Browse products without logging in
   - Prompted to sign in only when ready to purchase
   - Seamless return to checkout after authentication

3. **📝 Simplified Signup**
   - Quick registration with just email and password
   - Full name is optional (can be added later)
   - Faster onboarding for new users

4. **👁️ In-App QR Display**
   - Shopkeepers can view QR codes directly in the app
   - No need to download files to show customers
   - Easy sharing and display options

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT sessions + Google OAuth (Emergent)
- **Payments**: Stripe
- **QR Codes**: Python `qrcode` library

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI
- **Animations**: Framer Motion
- **HTTP Client**: Axios

---

## 📁 Project Structure

```
/app
├── backend/
│   ├── server.py           # FastAPI application
│   ├── shipping_service.py # Shipping cost estimation
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main app component
│   │   ├── pages/         # Page components
│   │   └── components/    # Reusable components
│   ├── package.json       # Node dependencies
│   └── .env              # Frontend environment
└── docs/
    ├── README.md                    # This file
    ├── TEST_USERS_GUIDE.md         # Test credentials
    ├── TRAVEL_LIGHT_ENHANCEMENT.md # Feature documentation
    ├── LOGISTICS_SYSTEM_DOCS.md    # Shipping system docs
    └── ReLocal_User_Flow_Diagram.drawio # User flow diagram
```

---

## 🧪 Test Accounts

For testing purposes, use these pre-configured accounts:

### Tourist
- **Email**: `test.tourist1@relocal.com`
- **Password**: `password123`

### Shopkeeper
- **Email**: `test.seller2@relocal.com`
- **Password**: `password123`

### Admin
- **Email**: `test.admin@relocal.com`
- **Password**: `admin123`

> See [TEST_USERS_GUIDE.md](./TEST_USERS_GUIDE.md) for complete test data

---

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/google` | Initiate Google OAuth |
| POST | `/api/auth/logout` | Logout current session |
| GET | `/api/auth/me` | Get current user |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/{id}` | Get product details (public) |
| GET | `/api/shops/{id}/products` | List shop products |
| POST | `/api/shops/{id}/products` | Add new product |

### QR Codes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/qr/scan/{qr_id}` | Scan QR → redirect to product |
| GET | `/api/qr/generate/{product_id}` | Generate QR code image |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create new order |
| GET | `/api/orders` | Get user's orders |
| GET | `/api/orders/seller` | Get shop's orders |
| PUT | `/api/orders/{id}/tracking` | Update tracking info |

### Shipping
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shipping/estimate` | Get shipping cost estimate |

---

## 🎨 User Flows

### Tourist Purchase Flow
```
Phone Camera → Scan QR → Product Page → Add to Cart → 
→ Checkout → Select Delivery → Payment → Order Confirmation
```

### Shopkeeper Product Flow
```
Login → Dashboard → Manage Products → Add Product → 
→ Generate QR → Print/Display in Shop
```

### New User Onboarding
```
Scan QR → View Product → Click Checkout → 
→ Auth Modal → Sign Up (email + password) → Complete Purchase
```

---

## ⚠️ Known Limitations

- **Shipping Estimation**: Currently uses a rule-based mock system. Real carrier API integration (Shippo/Easyship) is planned.
- **Payment**: Uses Stripe test mode. Production keys required for real transactions.

---

## 📊 Database Schema

### Users
```javascript
{
  user_id: String,
  email: String,
  name: String,
  role: "tourist" | "shopkeeper" | "admin",
  travel_mode: Boolean,
  addresses: Array,
  created_at: DateTime
}
```

### Products
```javascript
{
  product_id: String,
  shop_id: String,
  name: String,
  price: Number,
  description: String,
  images: Array,
  qr_code_id: String,
  estimated_weight_kg: Number,
  is_fragile: Boolean,
  verified: Boolean
}
```

### Orders
```javascript
{
  order_id: String,
  buyer_id: String,
  shop_id: String,
  items: Array,
  delivery_preference: "delivery" | "pickup",
  delivery_address: Object,
  status: String,
  tracking_number: String
}
```

---

## 🚧 Roadmap

### Coming Soon
- [ ] Real shipping carrier API integration
- [ ] Admin dispute/refund management
- [ ] Commission rate configuration

### Future
- [ ] Gifting feature with custom messages
- [ ] Logistics partner role
- [ ] Apple Sign-In
- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native)

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🤝 Support

For questions or issues, please contact the development team.

---

**Built with ❤️ for travelers who love authentic local products**
