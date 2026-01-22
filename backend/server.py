from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Header
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import io
import qrcode
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import bcrypt
from shipping_service import ShippingEstimator, ShipmentService, TrackingService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

stripe_api_key = os.environ.get('STRIPE_API_KEY')

# Initialize shipping services
shipping_estimator = ShippingEstimator(db)
shipment_service = ShipmentService(db)
tracking_service = TrackingService(db)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "tourist"
    addresses: List[Dict[str, str]] = []
    travel_mode: bool = True  # Default ON for tourists
    default_delivery_address: Optional[Dict[str, str]] = None
    created_at: datetime
    # password_hash is stored in DB but not returned in API responses

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class Shop(BaseModel):
    model_config = ConfigDict(extra="ignore")
    shop_id: str
    owner_id: str
    name: str
    description: Optional[str] = None
    location: Dict[str, Any]
    categories: List[str] = []
    verified: bool = False
    payout_setup: bool = False
    created_at: datetime

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str
    shop_id: str
    name: str
    description: str
    price: float
    currency: str = "usd"
    images: List[str] = []
    qr_code_id: str
    verified: bool = False
    authenticity_badge: bool = False
    estimated_weight_kg: float = 0.5  # Default weight in kg
    is_fragile: bool = False
    is_liquid: bool = False
    created_at: datetime

class QRCode(BaseModel):
    model_config = ConfigDict(extra="ignore")
    qr_code_id: str
    product_id: str
    scans_count: int = 0
    last_scanned: Optional[datetime] = None
    analytics: Dict[str, Any] = {}
    created_at: datetime

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    weight_kg: float = 0.5  # Weight per item

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str
    buyer_id: str
    shop_id: str
    shop_name: str
    items: List[OrderItem]
    total: float
    currency: str = "usd"
    delivery_type: str
    status: str = "pending"
    delivery_address: Optional[Dict[str, str]] = None
    tracking_id: Optional[str] = None
    gift_message: Optional[str] = None
    scheduled_delivery: Optional[datetime] = None
    ship_after_trip: bool = False  # NEW: Ship after trip ends
    trip_end_date: Optional[datetime] = None  # NEW: When trip ends
    total_weight_kg: float = 0.0  # NEW: Total weight saved
    delivery_preference_reason: Optional[str] = None  # NEW: Why delivery chosen
    is_tourist_delivery: bool = False  # NEW: Mark as tourist delivery
    created_at: datetime

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    transaction_id: str
    session_id: str
    order_id: Optional[str] = None
    user_id: str
    amount: float
    currency: str
    payment_status: str
    metadata: Dict[str, Any] = {}
    created_at: datetime

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    category_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime

# ============= SHIPPING & LOGISTICS MODELS =============

class ShippingAddress(BaseModel):
    name: str
    street1: str
    street2: Optional[str] = None
    city: str
    state: Optional[str] = None
    zip_code: str
    country: str  # ISO 2-letter code
    phone: Optional[str] = None
    email: Optional[str] = None

class ShipmentEstimate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    estimate_id: str
    order_id: str
    from_address: ShippingAddress
    to_address: ShippingAddress
    weight_kg: float
    estimated_cost: float
    currency: str
    service_level: str  # standard, express, economy
    delivery_days_min: int
    delivery_days_max: int
    is_international: bool
    is_remote_area: bool
    estimation_method: str  # api, rule_based
    created_at: datetime

class Shipment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    shipment_id: str
    order_id: str
    courier_provider: str  # shippo_carrier_name
    tracking_number: Optional[str] = None
    label_url: Optional[str] = None
    from_address: ShippingAddress
    to_address: ShippingAddress
    weight_kg: float
    estimated_cost: float
    final_cost: Optional[float] = None
    currency: str
    service_level: str
    status: str  # pending, label_created, picked_up, in_transit, delivered, failed
    carrier_tracking_status: Optional[str] = None
    customs_info: Optional[Dict[str, Any]] = None
    ship_date: Optional[datetime] = None
    estimated_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime

class TrackingEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    event_id: str
    shipment_id: str
    status: str
    status_details: Optional[str] = None
    location: Optional[str] = None
    occurred_at: datetime
    carrier_status_code: Optional[str] = None
    created_at: datetime

class CourierConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    config_id: str
    country: str
    region: Optional[str] = None  # metro, remote, rural
    preferred_carriers: List[str]
    backup_carriers: List[str]
    is_active: bool
    created_at: datetime

class ShippingRateRule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    rule_id: str
    from_country: str
    to_country: str
    weight_min_kg: float
    weight_max_kg: float
    base_rate: float
    per_kg_rate: float
    remote_area_multiplier: float
    currency: str
    is_active: bool
    created_at: datetime

# ============= INPUT MODELS =============

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SessionRequest(BaseModel):
    session_id: str

class AddressCreate(BaseModel):
    label: str
    street: str
    city: str
    state: str
    country: str
    postal_code: str

class ShopCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: Dict[str, Any]
    categories: List[str] = []

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    currency: str = "usd"
    images: List[str] = []
    authenticity_badge: bool = False
    estimated_weight_kg: float = 0.5
    is_fragile: bool = False
    is_liquid: bool = False

class OrderCreate(BaseModel):
    shop_id: str
    items: List[OrderItem]
    delivery_type: str
    delivery_address: Optional[Dict[str, str]] = None
    gift_message: Optional[str] = None
    scheduled_delivery: Optional[str] = None
    ship_after_trip: bool = False
    trip_end_date: Optional[str] = None
    delivery_preference_reason: Optional[str] = None

class TravelModeUpdate(BaseModel):
    travel_mode: bool

class CheckoutRequest(BaseModel):
    order_id: str
    origin_url: str

class TrackingUpdate(BaseModel):
    tracking_id: str

# ============= AUTH HELPERS =============

async def get_current_user(request: Request, authorization: Optional[str] = Header(None)) -> User:
    session_token = request.cookies.get("session_token")
    if not session_token and authorization:
        if authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc["created_at"], str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    
    return User(**user_doc)

# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/session")
async def process_session(session_req: SessionRequest, response: Response):
    import aiohttp
    async with aiohttp.ClientSession() as http_session:
        async with http_session.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_req.session_id}
        ) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=400, detail="Invalid session ID")
            data = await resp.json()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data["name"], "picture": data["picture"]}}
        )
    else:
        user_doc = {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data["picture"],
            "role": "tourist",
            "addresses": [],
            "travel_mode": True,  # Default ON for tourists
            "default_delivery_address": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if isinstance(user_doc["created_at"], str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    
    return User(**user_doc)

@api_router.get("/auth/me")
async def get_current_user_endpoint(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.post("/auth/register")
async def register(registration: LoginRequest, response: Response):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": registration.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    password_hash = bcrypt.hashpw(registration.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": registration.email,
        "name": registration.email.split('@')[0].title(),
        "picture": None,
        "role": "tourist",
        "addresses": [],
        "travel_mode": True,  # Default ON for tourists
        "default_delivery_address": None,
        "password_hash": password_hash,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    # Return user without password_hash
    user_doc_clean = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if isinstance(user_doc_clean["created_at"], str):
        user_doc_clean["created_at"] = datetime.fromisoformat(user_doc_clean["created_at"])
    
    return User(**user_doc_clean)

@api_router.post("/auth/login")
async def login(credentials: LoginRequest, response: Response):
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if user has password_hash (email/password user)
    if "password_hash" not in user_doc:
        raise HTTPException(status_code=401, detail="Please use Google login for this account")
    
    # Verify password
    if not bcrypt.checkpw(credentials.password.encode('utf-8'), user_doc["password_hash"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "user_id": user_doc["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    # Return user without password_hash
    user_doc_clean = {k: v for k, v in user_doc.items() if k != "password_hash"}
    if isinstance(user_doc_clean["created_at"], str):
        user_doc_clean["created_at"] = datetime.fromisoformat(user_doc_clean["created_at"])
    
    return User(**user_doc_clean)

# ============= TOURIST ENDPOINTS =============

@api_router.put("/users/travel-mode")
async def update_travel_mode(travel_update: TravelModeUpdate, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"travel_mode": travel_update.travel_mode}}
    )
    
    # Track analytics event
    event_doc = {
        "event_type": "travel_mode_toggled",
        "user_id": user.user_id,
        "travel_mode": travel_update.travel_mode,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.analytics_events.insert_one(event_doc)
    
    return {"message": "Travel mode updated", "travel_mode": travel_update.travel_mode}

@api_router.get("/users/luggage-savings")
async def get_luggage_savings(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    # Calculate total weight saved from delivered orders
    orders_cursor = db.orders.find({
        "buyer_id": user.user_id,
        "delivery_type": "delivery",
        "is_tourist_delivery": True
    }, {"_id": 0})
    orders = await orders_cursor.to_list(1000)
    
    total_weight_saved = sum(order.get("total_weight_kg", 0) for order in orders)
    total_orders = len(orders)
    fragile_items_saved = 0
    liquid_items_saved = 0
    
    # Count fragile and liquid items
    for order in orders:
        for item in order.get("items", []):
            product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
            if product:
                if product.get("is_fragile"):
                    fragile_items_saved += item["quantity"]
                if product.get("is_liquid"):
                    liquid_items_saved += item["quantity"]
    
    return {
        "total_weight_kg": round(total_weight_saved, 2),
        "total_orders_delivered": total_orders,
        "fragile_items_saved": fragile_items_saved,
        "liquid_items_saved": liquid_items_saved,
        "estimated_baggage_fee_saved": round(total_weight_saved * 10, 2)  # $10 per kg estimate
    }

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product_doc = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product_doc:
        raise HTTPException(status_code=404, detail="Product not found")
    
    shop_doc = await db.shops.find_one({"shop_id": product_doc["shop_id"]}, {"_id": 0})
    
    if isinstance(product_doc["created_at"], str):
        product_doc["created_at"] = datetime.fromisoformat(product_doc["created_at"])
    
    product = Product(**product_doc)
    return {**product.model_dump(), "shop": shop_doc}

@api_router.get("/qr/scan/{qr_code_id}")
async def scan_qr_code(qr_code_id: str, request: Request):
    qr_doc = await db.qr_codes.find_one({"qr_code_id": qr_code_id}, {"_id": 0})
    if not qr_doc:
        raise HTTPException(status_code=404, detail="QR code not found")
    
    await db.qr_codes.update_one(
        {"qr_code_id": qr_code_id},
        {
            "$inc": {"scans_count": 1},
            "$set": {"last_scanned": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    product_doc = await db.products.find_one({"product_id": qr_doc["product_id"]}, {"_id": 0})
    if not product_doc:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"product_id": qr_doc["product_id"], "redirect_url": f"/products/{qr_doc['product_id']}"}

@api_router.post("/orders")
async def create_order(order_data: OrderCreate, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    shop_doc = await db.shops.find_one({"shop_id": order_data.shop_id}, {"_id": 0})
    if not shop_doc:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Calculate total and weight
    total = sum(item.price * item.quantity for item in order_data.items)
    total_weight = 0.0
    
    # Get product weights
    for item in order_data.items:
        product_doc = await db.products.find_one({"product_id": item.product_id}, {"_id": 0})
        if product_doc:
            weight = product_doc.get("estimated_weight_kg", 0.5)
            total_weight += weight * item.quantity
    
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    scheduled_delivery = None
    if order_data.scheduled_delivery:
        scheduled_delivery = datetime.fromisoformat(order_data.scheduled_delivery)
    
    trip_end_date = None
    if order_data.trip_end_date:
        trip_end_date = datetime.fromisoformat(order_data.trip_end_date)
    
    # Determine if this is a tourist delivery
    is_tourist_delivery = order_data.delivery_type == "delivery" and user.role == "tourist"
    
    order_doc = {
        "order_id": order_id,
        "buyer_id": user.user_id,
        "shop_id": order_data.shop_id,
        "shop_name": shop_doc["name"],
        "items": [item.model_dump() for item in order_data.items],
        "total": total,
        "currency": "usd",
        "delivery_type": order_data.delivery_type,
        "status": "pending",
        "delivery_address": order_data.delivery_address,
        "tracking_id": None,
        "gift_message": order_data.gift_message,
        "scheduled_delivery": scheduled_delivery.isoformat() if scheduled_delivery else None,
        "ship_after_trip": order_data.ship_after_trip,
        "trip_end_date": trip_end_date.isoformat() if trip_end_date else None,
        "total_weight_kg": total_weight,
        "delivery_preference_reason": order_data.delivery_preference_reason,
        "is_tourist_delivery": is_tourist_delivery,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    
    # Track analytics event
    if order_data.delivery_type == "delivery":
        event_doc = {
            "event_type": "delivery_selected",
            "user_id": user.user_id,
            "order_id": order_id,
            "ship_after_trip": order_data.ship_after_trip,
            "weight_saved_kg": total_weight,
            "reason": order_data.delivery_preference_reason,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await db.analytics_events.insert_one(event_doc)
    
    if isinstance(order_doc["created_at"], str):
        order_doc["created_at"] = datetime.fromisoformat(order_doc["created_at"])
    if order_doc.get("scheduled_delivery") and isinstance(order_doc["scheduled_delivery"], str):
        order_doc["scheduled_delivery"] = datetime.fromisoformat(order_doc["scheduled_delivery"])
    if order_doc.get("trip_end_date") and isinstance(order_doc["trip_end_date"], str):
        order_doc["trip_end_date"] = datetime.fromisoformat(order_doc["trip_end_date"])
    
    return Order(**order_doc)

@api_router.get("/orders")
async def get_user_orders(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    orders_cursor = db.orders.find({"buyer_id": user.user_id}, {"_id": 0}).sort("created_at", -1)
    orders = await orders_cursor.to_list(1000)
    
    for order in orders:
        if isinstance(order["created_at"], str):
            order["created_at"] = datetime.fromisoformat(order["created_at"])
        if order.get("scheduled_delivery") and isinstance(order["scheduled_delivery"], str):
            order["scheduled_delivery"] = datetime.fromisoformat(order["scheduled_delivery"])
    
    return orders

@api_router.post("/orders/{order_id}/reorder")
async def reorder(order_id: str, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    original_order = await db.orders.find_one({"order_id": order_id, "buyer_id": user.user_id}, {"_id": 0})
    if not original_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    new_order_id = f"order_{uuid.uuid4().hex[:12]}"
    new_order = {
        "order_id": new_order_id,
        "buyer_id": user.user_id,
        "shop_id": original_order["shop_id"],
        "shop_name": original_order["shop_name"],
        "items": original_order["items"],
        "total": original_order["total"],
        "currency": original_order["currency"],
        "delivery_type": "delivery",
        "status": "pending",
        "delivery_address": original_order.get("delivery_address"),
        "tracking_id": None,
        "gift_message": None,
        "scheduled_delivery": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(new_order)
    
    if isinstance(new_order["created_at"], str):
        new_order["created_at"] = datetime.fromisoformat(new_order["created_at"])
    
    return Order(**new_order)

@api_router.post("/users/addresses")
async def add_address(address: AddressCreate, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$push": {"addresses": address.model_dump()}}
    )
    
    return {"message": "Address added successfully"}

# ============= SHOPKEEPER ENDPOINTS =============

@api_router.post("/shops")
async def create_shop(shop_data: ShopCreate, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    existing_shop = await db.shops.find_one({"owner_id": user.user_id}, {"_id": 0})
    if existing_shop:
        raise HTTPException(status_code=400, detail="User already has a shop")
    
    shop_id = f"shop_{uuid.uuid4().hex[:12]}"
    shop_doc = {
        "shop_id": shop_id,
        "owner_id": user.user_id,
        "name": shop_data.name,
        "description": shop_data.description,
        "location": shop_data.location,
        "categories": shop_data.categories,
        "verified": False,
        "payout_setup": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.shops.insert_one(shop_doc)
    
    await db.users.update_one({"user_id": user.user_id}, {"$set": {"role": "shopkeeper"}})
    
    if isinstance(shop_doc["created_at"], str):
        shop_doc["created_at"] = datetime.fromisoformat(shop_doc["created_at"])
    
    return Shop(**shop_doc)

@api_router.get("/shops/my-shop")
async def get_my_shop(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    shop_doc = await db.shops.find_one({"owner_id": user.user_id}, {"_id": 0})
    if not shop_doc:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    if isinstance(shop_doc["created_at"], str):
        shop_doc["created_at"] = datetime.fromisoformat(shop_doc["created_at"])
    
    return Shop(**shop_doc)

@api_router.post("/shops/{shop_id}/products")
async def create_product(shop_id: str, product_data: ProductCreate, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    shop_doc = await db.shops.find_one({"shop_id": shop_id, "owner_id": user.user_id}, {"_id": 0})
    if not shop_doc:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    product_id = f"product_{uuid.uuid4().hex[:12]}"
    qr_code_id = f"qr_{uuid.uuid4().hex[:12]}"
    
    product_doc = {
        "product_id": product_id,
        "shop_id": shop_id,
        "name": product_data.name,
        "description": product_data.description,
        "price": product_data.price,
        "currency": product_data.currency,
        "images": product_data.images,
        "qr_code_id": qr_code_id,
        "verified": False,
        "authenticity_badge": product_data.authenticity_badge,
        "estimated_weight_kg": product_data.estimated_weight_kg,
        "is_fragile": product_data.is_fragile,
        "is_liquid": product_data.is_liquid,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product_doc)
    
    qr_doc = {
        "qr_code_id": qr_code_id,
        "product_id": product_id,
        "scans_count": 0,
        "last_scanned": None,
        "analytics": {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.qr_codes.insert_one(qr_doc)
    
    if isinstance(product_doc["created_at"], str):
        product_doc["created_at"] = datetime.fromisoformat(product_doc["created_at"])
    
    return Product(**product_doc)

@api_router.get("/shops/{shop_id}/products")
async def get_shop_products(shop_id: str):
    products_cursor = db.products.find({"shop_id": shop_id}, {"_id": 0})
    products = await products_cursor.to_list(1000)
    
    for product in products:
        if isinstance(product["created_at"], str):
            product["created_at"] = datetime.fromisoformat(product["created_at"])
    
    return products

@api_router.get("/qr/generate/{product_id}")
async def generate_qr_code(product_id: str, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    product_doc = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product_doc:
        raise HTTPException(status_code=404, detail="Product not found")
    
    shop_doc = await db.shops.find_one({"shop_id": product_doc["shop_id"], "owner_id": user.user_id}, {"_id": 0})
    if not shop_doc:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    qr_code_id = product_doc["qr_code_id"]
    qr_url = f"{request.base_url}qr/{qr_code_id}"
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    
    return Response(content=buf.getvalue(), media_type="image/png")

@api_router.get("/orders/seller")
async def get_seller_orders(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    shop_doc = await db.shops.find_one({"owner_id": user.user_id}, {"_id": 0})
    if not shop_doc:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    orders_cursor = db.orders.find({"shop_id": shop_doc["shop_id"]}, {"_id": 0}).sort("created_at", -1)
    orders = await orders_cursor.to_list(1000)
    
    for order in orders:
        if isinstance(order["created_at"], str):
            order["created_at"] = datetime.fromisoformat(order["created_at"])
        if order.get("scheduled_delivery") and isinstance(order["scheduled_delivery"], str):
            order["scheduled_delivery"] = datetime.fromisoformat(order["scheduled_delivery"])
    
    return orders

@api_router.put("/orders/{order_id}/tracking")
async def update_tracking(order_id: str, tracking_data: TrackingUpdate, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    shop_doc = await db.shops.find_one({"owner_id": user.user_id}, {"_id": 0})
    if not shop_doc:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.orders.update_one(
        {"order_id": order_id, "shop_id": shop_doc["shop_id"]},
        {"$set": {"tracking_id": tracking_data.tracking_id, "status": "shipped"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Tracking updated successfully"}

@api_router.get("/shops/{shop_id}/insights")
async def get_shop_insights(shop_id: str, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    shop_doc = await db.shops.find_one({"shop_id": shop_id, "owner_id": user.user_id}, {"_id": 0})
    if not shop_doc:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    total_orders = await db.orders.count_documents({"shop_id": shop_id})
    
    orders_cursor = db.orders.find({"shop_id": shop_id}, {"_id": 0})
    orders = await orders_cursor.to_list(10000)
    total_revenue = sum(order["total"] for order in orders)
    
    repeat_buyers_cursor = db.orders.aggregate([
        {"$match": {"shop_id": shop_id}},
        {"$group": {"_id": "$buyer_id", "count": {"$sum": 1}}},
        {"$match": {"count": {"$gt": 1}}}
    ])
    repeat_buyers = len(await repeat_buyers_cursor.to_list(10000))
    
    products_cursor = db.products.find({"shop_id": shop_id}, {"_id": 0})
    products = await products_cursor.to_list(1000)
    
    qr_scans = 0
    for product in products:
        qr_doc = await db.qr_codes.find_one({"qr_code_id": product["qr_code_id"]}, {"_id": 0})
        if qr_doc:
            qr_scans += qr_doc.get("scans_count", 0)
    
    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "repeat_buyers": repeat_buyers,
        "total_products": len(products),
        "total_qr_scans": qr_scans
    }

# ============= ADMIN ENDPOINTS =============

@api_router.get("/admin/shops/pending")
async def get_pending_shops(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    shops_cursor = db.shops.find({"verified": False}, {"_id": 0})
    shops = await shops_cursor.to_list(1000)
    
    for shop in shops:
        if isinstance(shop["created_at"], str):
            shop["created_at"] = datetime.fromisoformat(shop["created_at"])
    
    return shops

@api_router.put("/admin/shops/{shop_id}/verify")
async def verify_shop(shop_id: str, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.shops.update_one({"shop_id": shop_id}, {"$set": {"verified": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    return {"message": "Shop verified successfully"}

@api_router.get("/admin/products/pending")
async def get_pending_products(request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    products_cursor = db.products.find({"verified": False}, {"_id": 0})
    products = await products_cursor.to_list(1000)
    
    for product in products:
        if isinstance(product["created_at"], str):
            product["created_at"] = datetime.fromisoformat(product["created_at"])
    
    return products

@api_router.put("/admin/products/{product_id}/verify")
async def verify_product(product_id: str, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.products.update_one({"product_id": product_id}, {"$set": {"verified": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product verified successfully"}

@api_router.get("/admin/categories")
async def get_categories():
    categories_cursor = db.categories.find({}, {"_id": 0})
    categories = await categories_cursor.to_list(1000)
    
    for category in categories:
        if isinstance(category["created_at"], str):
            category["created_at"] = datetime.fromisoformat(category["created_at"])
    
    return categories

@api_router.post("/admin/categories")
async def create_category(name: str, description: Optional[str] = None, request: Request = None, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    category_id = f"cat_{uuid.uuid4().hex[:12]}"
    category_doc = {
        "category_id": category_id,
        "name": name,
        "description": description,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(category_doc)
    
    if isinstance(category_doc["created_at"], str):
        category_doc["created_at"] = datetime.fromisoformat(category_doc["created_at"])
    
    return Category(**category_doc)

# ============= PAYMENT ENDPOINTS =============

@api_router.post("/checkout/session")
async def create_checkout_session(checkout_req: CheckoutRequest, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    order_doc = await db.orders.find_one({"order_id": checkout_req.order_id, "buyer_id": user.user_id}, {"_id": 0})
    if not order_doc:
        raise HTTPException(status_code=404, detail="Order not found")
    
    host_url = checkout_req.origin_url
    success_url = f"{host_url}/checkout/success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
    cancel_url = f"{host_url}/checkout"
    
    webhook_url = f"{str(request.base_url)}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    checkout_session_req = CheckoutSessionRequest(
        amount=order_doc["total"],
        currency=order_doc["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": checkout_req.order_id,
            "user_id": user.user_id,
            "shop_id": order_doc["shop_id"]
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_session_req)
    
    transaction_id = f"txn_{uuid.uuid4().hex[:12]}"
    transaction_doc = {
        "transaction_id": transaction_id,
        "session_id": session.session_id,
        "order_id": checkout_req.order_id,
        "user_id": user.user_id,
        "amount": order_doc["total"],
        "currency": order_doc["currency"],
        "payment_status": "pending",
        "metadata": {"order_id": checkout_req.order_id},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request, authorization: Optional[str] = Header(None)):
    user = await get_current_user(request, authorization)
    
    transaction_doc = await db.payment_transactions.find_one({"session_id": session_id, "user_id": user.user_id}, {"_id": 0})
    if not transaction_doc:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction_doc["payment_status"] == "paid":
        return {"status": "complete", "payment_status": "paid"}
    
    webhook_url = f"{str(request.base_url)}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    if checkout_status.payment_status == "paid" and transaction_doc["payment_status"] != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid"}}
        )
        
        await db.orders.update_one(
            {"order_id": transaction_doc["order_id"]},
            {"$set": {"status": "confirmed"}}
        )
    
    return {
        "status": checkout_status.status,
        "payment_status": checkout_status.payment_status,
        "amount_total": checkout_status.amount_total,
        "currency": checkout_status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    webhook_url = f"{str(request.base_url)}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            order_id = webhook_response.metadata.get("order_id")
            if order_id:
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"payment_status": "paid"}}
                )
                
                await db.orders.update_one(
                    {"order_id": order_id},
                    {"$set": {"status": "confirmed"}}
                )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ============= GENERAL ENDPOINTS =============

@api_router.get("/")
async def root():
    return {"message": "Welcome to ReLocal API"}

@api_router.get("/categories")
async def list_categories():
    categories_cursor = db.categories.find({}, {"_id": 0})
    categories = await categories_cursor.to_list(1000)
    return categories

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
