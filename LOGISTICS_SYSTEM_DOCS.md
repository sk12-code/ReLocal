# ReLocal Logistics & Shipping System Documentation

## 🚚 Overview

A production-grade, scalable logistics system for ReLocal marketplace supporting:
- **Domestic shipping:** India and Japan
- **International shipping:** Cross-border to 8+ countries
- **Remote area handling:** Automatic detection and pricing
- **Cost estimation:** Real-time at checkout
- **Multi-carrier support:** Ready for Shippo/Easyship integration
- **Provider-agnostic architecture:** Easy to swap carriers

---

## 🏗️ Architecture

### System Components

1. **ShippingEstimator** - Cost estimation engine
2. **ShipmentService** - Label generation and shipment creation
3. **TrackingService** - Webhook handling and status updates
4. **Rate Rules Database** - Configurable pricing rules
5. **Courier Config** - Region-specific carrier preferences

### Estimation Strategy (Layered Approach)

```
┌─────────────────────────────────────┐
│  1. Real-time API (Shippo)          │ ← Preferred
│     - Most accurate rates           │
│     - Actual carrier quotes         │
├─────────────────────────────────────┤
│  2. Rule-based Estimation           │ ← Fallback
│     - Database rate rules           │
│     - Country + weight based        │
├─────────────────────────────────────┤
│  3. Hardcoded Defaults              │ ← Ultimate fallback
│     - Never block checkout          │
│     - Conservative estimates        │
└─────────────────────────────────────┘
```

---

## 📊 Data Models

### Shipment
```javascript
{
  shipment_id: "ship_20250122_abc123",
  order_id: "order_xyz",
  courier_provider: "India Post",
  tracking_number: "TRACK123456",
  label_url: "https://...",
  from_address: { ... },
  to_address: { ... },
  weight_kg: 1.5,
  estimated_cost: 175.00,
  final_cost: 180.00,
  currency: "INR",
  service_level: "standard",
  status: "in_transit",
  customs_info: { ... },
  estimated_delivery: "2025-01-30",
  created_at: "2025-01-22T10:00:00Z"
}
```

### ShipmentEstimate
```javascript
{
  estimate_id: "est_abc123",
  order_id: "order_xyz",
  from_address: { ... },
  to_address: { ... },
  weight_kg: 1.5,
  estimated_cost: 175.00,
  currency: "INR",
  service_level: "standard",
  delivery_days_min: 2,
  delivery_days_max: 5,
  is_international: false,
  is_remote_area: false,
  estimation_method: "rule_based",
  created_at: "2025-01-22T10:00:00Z"
}
```

### ShippingRateRule
```javascript
{
  rule_id: "rule_in_in_light",
  from_country: "IN",
  to_country: "IN",
  weight_min_kg: 0,
  weight_max_kg: 2,
  base_rate: 100,
  per_kg_rate: 50,
  remote_area_multiplier: 1.3,
  currency: "INR",
  is_active: true,
  created_at: "2025-01-22T00:00:00Z"
}
```

### TrackingEvent
```javascript
{
  event_id: "evt_20250122_123",
  shipment_id: "ship_20250122_abc123",
  status: "in_transit",
  status_details: "Package departed facility",
  location: "Mumbai, IN",
  occurred_at: "2025-01-22T12:00:00Z",
  carrier_status_code: "IT",
  created_at: "2025-01-22T12:05:00Z"
}
```

---

## 🔌 API Endpoints

### 1. Estimate Shipping Cost
```http
POST /api/shipping/estimate
Authorization: Bearer {token}
Content-Type: application/json

{
  "order_id": "order_123",
  "weight_kg": 1.5,
  "from_address": {
    "street": "123 Shop St",
    "city": "Mumbai",
    "postal_code": "400001",
    "country": "IN"
  },
  "to_address": {
    "street": "456 Customer St",
    "city": "Delhi",
    "postal_code": "110001",
    "country": "IN"
  }
}
```

**Response:**
```json
{
  "estimate_id": "est_abc123",
  "estimated_cost": 175.00,
  "currency": "INR",
  "service_level": "standard",
  "delivery_days_min": 2,
  "delivery_days_max": 5,
  "is_international": false,
  "is_remote_area": false,
  "estimation_method": "rule_based"
}
```

### 2. Create Shipment
```http
POST /api/shipping/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "order_id": "order_123",
  "customs_declaration": {
    "contents_type": "merchandise",
    "contents_explanation": "Handcrafted ceramic bowl",
    "value": 45.00,
    "currency": "USD"
  }
}
```

**Response:**
```json
{
  "shipment_id": "ship_20250122_abc123",
  "tracking_number": "TRACK123456",
  "label_url": "https://shipping-provider.com/label.pdf",
  "estimated_cost": 175.00,
  "status": "label_created",
  ...
}
```

### 3. Get Shipment Details
```http
GET /api/shipping/shipment/{shipment_id}
Authorization: Bearer {token}
```

### 4. Get Order Shipment
```http
GET /api/shipping/order/{order_id}
Authorization: Bearer {token}
```

### 5. Tracking Webhook
```http
POST /api/shipping/webhook/tracking
Content-Type: application/json

{
  "tracking_number": "TRACK123456",
  "status": "in_transit",
  "status_details": "Package departed facility",
  "location": "Mumbai, IN",
  "occurred_at": "2025-01-22T12:00:00Z"
}
```

---

## 💰 Pricing Examples

### Domestic India
| Weight | Base | Per kg | Remote 1.3x | Total (Metro) | Total (Remote) |
|--------|------|--------|-------------|---------------|----------------|
| 0.5 kg | ₹100 | ₹50    | ✗           | ₹125          | ₹163           |
| 1.5 kg | ₹100 | ₹50    | ✗           | ₹175          | ₹228           |
| 3.0 kg | ₹150 | ₹40    | ✗           | ₹270          | ₹351           |

### Domestic Japan
| Weight | Base | Per kg | Remote 1.3x | Total (Metro) | Total (Remote) |
|--------|------|--------|-------------|---------------|----------------|
| 0.5 kg | ¥500 | ¥200   | ✗           | ¥600          | ¥780           |
| 1.5 kg | ¥500 | ¥200   | ✗           | ¥800          | ¥1,040         |
| 3.0 kg | ¥700 | ¥180   | ✗           | ¥1,240        | ¥1,612         |

### International (India → USA)
| Weight | Base | Per kg | Total (USD) |
|--------|------|--------|-------------|
| 1.0 kg | $20  | $10    | $30         |
| 2.0 kg | $20  | $10    | $40         |
| 5.0 kg | $20  | $10    | $70         |

---

## 🌍 Country Support

### Currently Configured
- **IN** - India (domestic + international sender)
- **JP** - Japan (domestic + international sender)
- **US** - United States (international receiver)
- **GB** - United Kingdom (international receiver)
- **AU** - Australia (international receiver)
- **CA** - Canada (international receiver)
- **DE** - Germany (international receiver)
- **FR** - France (international receiver)

### Remote Area Detection
**India:**
- Leh, Ladakh
- Andaman & Nicobar Islands
- Srinagar

**Japan:**
- Okinawa
- Hokkaido remote areas

---

## 🔧 Configuration

### Environment Variables
```bash
# Shippo API Integration (optional)
SHIPPO_API_KEY=shippo_live_xxxxx

# When empty, system falls back to rule-based estimation
```

### Admin Configuration (Future)
```javascript
// Enable/disable real-time API
{
  "use_api_estimation": true,
  "fallback_to_rules": true,
  "default_service_level": "standard"
}

// Courier preferences by region
{
  "country": "IN",
  "region": "metro",
  "preferred_carriers": ["India Post", "Delhivery"],
  "backup_carriers": ["Blue Dart", "DTDC"]
}
```

---

## 🚀 Integration Roadmap

### Phase 1: Rule-Based (✅ COMPLETE)
- Database-driven rate rules
- Automatic remote area detection
- Weight-based calculations
- Multi-currency support

### Phase 2: Shippo Integration (Ready)
- Real-time rate fetching
- Label generation
- Tracking webhook handling
- Multi-carrier support

### Phase 3: Advanced Features
- Ship-after-trip batch processing
- Automatic carrier selection (cheapest/fastest)
- Customs document generation
- Return label creation
- Insurance options

### Phase 4: Optimization
- ML-based carrier selection
- Dynamic pricing based on demand
- Delivery time predictions
- Carbon offset calculation

---

## 📦 Supported Carriers (via Shippo)

### India
- India Post
- Delhivery
- Blue Dart
- DTDC
- FedEx India
- DHL India

### Japan
- Japan Post (Yubin)
- Yamato Transport
- Sagawa Express
- FedEx Japan
- DHL Japan

### International
- DHL Express
- FedEx International
- UPS Worldwide
- Aramex

---

## 🧪 Testing

### Test Scenarios Covered
1. ✅ India → India (metro to metro)
2. ✅ India → India (metro to remote: Leh)
3. ✅ Japan → Japan (domestic)
4. ✅ India → USA (international)
5. ✅ Japan → USA (international)
6. ✅ Fallback when API unavailable

### Test Commands
```bash
# See /tmp/test_shipping.sh for complete test suite

# Quick test
curl -X POST http://localhost:8001/api/shipping/estimate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test_001",
    "weight_kg": 1.5,
    "from_address": {"city": "Mumbai", "country": "IN", ...},
    "to_address": {"city": "Delhi", "country": "IN", ...}
  }'
```

---

## 🔐 Security

### API Key Management
- Shippo API key stored in .env (never in code)
- Webhook signature verification (recommended)
- Rate limiting on estimation endpoint
- User authentication required for all endpoints

### Data Privacy
- Addresses encrypted at rest
- PII handling compliant
- Tracking data anonymized after delivery

---

## 📈 Monitoring & Analytics

### Key Metrics to Track
1. **Estimation accuracy** (estimated vs actual cost)
2. **API uptime** (Shippo availability)
3. **Fallback frequency** (rule-based usage %)
4. **Average delivery time** by route
5. **Remote area delivery success rate**
6. **International customs clearance time**

### Logging
```python
logger.info(f"Shipment created: {shipment_id}")
logger.warning(f"API estimation failed, using rules for order: {order_id}")
logger.error(f"Tracking webhook error: {error}")
```

---

## 🎯 Business Logic

### Never Block Checkout
```python
# If estimation fails at ANY level:
return {
    "estimated_cost": 10.0,
    "currency": "USD",
    "note": "Estimated cost - final may vary",
    "estimation_method": "fallback"
}
```

### Show Estimated Costs Clearly
```
Estimated Delivery Cost: $30.00
Delivery: 7-14 days

Note: Final delivery cost may vary slightly 
based on courier and customs requirements.
```

### Remote Area Handling
- Automatically detected (city name matching)
- 1.3x multiplier applied
- Longer delivery time estimate (5-10 days vs 2-5)
- User informed: "Remote area delivery"

---

## 🛠️ Maintenance

### Adding New Countries
1. Add to `SUPPORTED_COUNTRIES` in shipping_service.py
2. Create rate rules in database
3. Test with sample addresses
4. Update documentation

### Updating Rates
```javascript
// Via MongoDB
db.shipping_rate_rules.updateOne(
  { rule_id: "rule_in_in_light" },
  { $set: { base_rate: 120, per_kg_rate: 55 } }
)
```

### Troubleshooting
```bash
# Check shipping estimates in DB
mongosh> db.shipment_estimates.find().sort({created_at: -1}).limit(10)

# Check shipment status
mongosh> db.shipments.find({status: {$ne: "delivered"}})

# Check tracking events
mongosh> db.tracking_events.find({shipment_id: "ship_xxx"}).sort({occurred_at: -1})
```

---

## 📚 References

- **Shippo API:** https://goshippo.com/docs/
- **Easyship:** https://www.easyship.com/docs
- **India Post:** https://www.indiapost.gov.in/
- **Japan Post:** https://www.post.japanpost.jp/

---

**Built with:** FastAPI • MongoDB • Shippo-ready • Production-grade
**Status:** ✅ Phase 1 Complete (Rule-based estimation)
**Next:** Integrate Shippo API with real API key for live rates
