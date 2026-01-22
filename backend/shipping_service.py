"""
ReLocal Shipping & Logistics Service
Handles delivery cost estimation, shipment creation, and tracking
"""

import os
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
import asyncio
import aiohttp

logger = logging.getLogger(__name__)

# ============= CONFIGURATION =============

SHIPPO_API_KEY = os.environ.get('SHIPPO_API_KEY', '')
SHIPPO_API_URL = "https://api.goshippo.com/v1"

# Country coverage
SUPPORTED_COUNTRIES = {
    'IN': 'India',
    'JP': 'Japan',
    'US': 'United States',
    'GB': 'United Kingdom',
    'AU': 'Australia',
    'CA': 'Canada',
    'DE': 'Germany',
    'FR': 'France'
}

# Remote area detection (simplified)
REMOTE_CITIES = {
    'IN': ['Leh', 'Ladakh', 'Andaman', 'Nicobar', 'Srinagar'],
    'JP': ['Okinawa', 'Hokkaido']
}

# ============= SHIPPING ESTIMATION ENGINE =============

class ShippingEstimator:
    """
    Modular shipping cost estimator with multiple strategies:
    1. Real-time API (Shippo)
    2. Rule-based fallback
    3. Remote area detection
    """
    
    def __init__(self, db):
        self.db = db
        self.use_api = bool(SHIPPO_API_KEY)
    
    async def estimate_shipping(
        self,
        from_address: Dict,
        to_address: Dict,
        weight_kg: float,
        order_id: str
    ) -> Dict:
        """
        Main estimation method
        Returns: {
            'estimated_cost': float,
            'currency': str,
            'service_level': str,
            'delivery_days_min': int,
            'delivery_days_max': int,
            'is_international': bool,
            'is_remote_area': bool,
            'estimation_method': str
        }
        """
        
        is_international = from_address['country'] != to_address['country']
        is_remote = self._is_remote_area(to_address)
        
        # Try real-time API first
        if self.use_api:
            try:
                result = await self._estimate_via_api(
                    from_address, to_address, weight_kg
                )
                if result:
                    result['is_remote_area'] = is_remote
                    return result
            except Exception as e:
                logger.warning(f"API estimation failed: {e}, falling back to rules")
        
        # Fallback to rule-based estimation
        result = await self._estimate_via_rules(
            from_address, to_address, weight_kg, is_international, is_remote
        )
        
        return result
    
    async def _estimate_via_api(
        self,
        from_address: Dict,
        to_address: Dict,
        weight_kg: float
    ) -> Optional[Dict]:
        """
        Use Shippo API for real-time rates
        """
        
        if not SHIPPO_API_KEY:
            return None
        
        # Convert addresses to Shippo format
        shippo_from = self._convert_to_shippo_address(from_address)
        shippo_to = self._convert_to_shippo_address(to_address)
        
        # Create shipment request
        payload = {
            "address_from": shippo_from,
            "address_to": shippo_to,
            "parcels": [{
                "length": "10",
                "width": "10",
                "height": "10",
                "distance_unit": "cm",
                "weight": str(weight_kg),
                "mass_unit": "kg"
            }],
            "async": False
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{SHIPPO_API_URL}/shipments",
                    headers={
                        "Authorization": f"ShippoToken {SHIPPO_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 201:
                        data = await response.json()
                        
                        # Get rates
                        rates = data.get('rates', [])
                        if rates:
                            # Pick cheapest standard rate
                            cheapest = min(rates, key=lambda r: float(r.get('amount', 999999)))
                            
                            return {
                                'estimated_cost': float(cheapest['amount']),
                                'currency': cheapest['currency'],
                                'service_level': cheapest.get('servicelevel', {}).get('name', 'standard'),
                                'delivery_days_min': cheapest.get('estimated_days', 5),
                                'delivery_days_max': cheapest.get('estimated_days', 7),
                                'is_international': from_address['country'] != to_address['country'],
                                'estimation_method': 'api',
                                'carrier': cheapest.get('provider', 'Unknown')
                            }
        except Exception as e:
            logger.error(f"Shippo API error: {e}")
            return None
        
        return None
    
    async def _estimate_via_rules(
        self,
        from_address: Dict,
        to_address: Dict,
        weight_kg: float,
        is_international: bool,
        is_remote: bool
    ) -> Dict:
        """
        Rule-based estimation fallback
        """
        
        from_country = from_address['country']
        to_country = to_address['country']
        
        # Try to get rule from database
        rule = await self.db.shipping_rate_rules.find_one({
            "from_country": from_country,
            "to_country": to_country,
            "weight_min_kg": {"$lte": weight_kg},
            "weight_max_kg": {"$gte": weight_kg},
            "is_active": True
        }, {"_id": 0})
        
        if rule:
            base_rate = rule['base_rate']
            per_kg_rate = rule['per_kg_rate']
            currency = rule['currency']
            remote_multiplier = rule['remote_area_multiplier'] if is_remote else 1.0
        else:
            # Default fallback rates
            base_rate, per_kg_rate, currency = self._get_default_rates(
                from_country, to_country
            )
            remote_multiplier = 1.3 if is_remote else 1.0
        
        # Calculate cost
        cost = (base_rate + (weight_kg * per_kg_rate)) * remote_multiplier
        
        # Delivery estimate
        if is_international:
            delivery_days_min = 7
            delivery_days_max = 14
        elif is_remote:
            delivery_days_min = 5
            delivery_days_max = 10
        else:
            delivery_days_min = 2
            delivery_days_max = 5
        
        return {
            'estimated_cost': round(cost, 2),
            'currency': currency,
            'service_level': 'standard',
            'delivery_days_min': delivery_days_min,
            'delivery_days_max': delivery_days_max,
            'is_international': is_international,
            'is_remote_area': is_remote,
            'estimation_method': 'rule_based'
        }
    
    def _get_default_rates(self, from_country: str, to_country: str) -> Tuple[float, float, str]:
        """
        Hardcoded default rates as ultimate fallback
        Returns: (base_rate, per_kg_rate, currency)
        """
        
        # Domestic rates
        if from_country == to_country:
            if from_country == 'IN':
                return (100.0, 50.0, 'INR')  # ₹100 base + ₹50/kg
            elif from_country == 'JP':
                return (500.0, 200.0, 'JPY')  # ¥500 base + ¥200/kg
            else:
                return (5.0, 2.0, 'USD')  # $5 base + $2/kg
        
        # International rates
        if from_country in ['IN', 'JP'] and to_country in ['US', 'GB', 'AU', 'CA']:
            return (20.0, 10.0, 'USD')  # $20 base + $10/kg
        elif from_country in ['IN', 'JP'] and to_country in ['DE', 'FR']:
            return (25.0, 12.0, 'USD')  # $25 base + $12/kg
        else:
            return (30.0, 15.0, 'USD')  # $30 base + $15/kg (rest of world)
    
    def _is_remote_area(self, address: Dict) -> bool:
        """
        Detect if address is in a remote area
        """
        country = address.get('country', '')
        city = address.get('city', '').lower()
        
        if country in REMOTE_CITIES:
            return any(remote.lower() in city for remote in REMOTE_CITIES[country])
        
        return False
    
    def _convert_to_shippo_address(self, address: Dict) -> Dict:
        """
        Convert internal address format to Shippo format
        """
        return {
            "name": address.get('name', 'Customer'),
            "street1": address.get('street', ''),
            "street2": address.get('street2', ''),
            "city": address.get('city', ''),
            "state": address.get('state', ''),
            "zip": address.get('postal_code', ''),
            "country": address.get('country', ''),
            "phone": address.get('phone', ''),
            "email": address.get('email', '')
        }

# ============= SHIPMENT CREATION =============

class ShipmentService:
    """
    Handles actual shipment creation, label generation, and tracking
    """
    
    def __init__(self, db):
        self.db = db
        self.estimator = ShippingEstimator(db)
    
    async def create_shipment(
        self,
        order_id: str,
        from_address: Dict,
        to_address: Dict,
        weight_kg: float,
        customs_info: Optional[Dict] = None
    ) -> Dict:
        """
        Create shipment and generate label
        """
        
        # Get estimate first
        estimate = await self.estimator.estimate_shipping(
            from_address, to_address, weight_kg, order_id
        )
        
        # Create shipment record
        shipment_id = f"ship_{datetime.now().strftime('%Y%m%d')}_{order_id[-8:]}"
        
        shipment_doc = {
            "shipment_id": shipment_id,
            "order_id": order_id,
            "courier_provider": estimate.get('carrier', 'India Post'),
            "tracking_number": None,
            "label_url": None,
            "from_address": from_address,
            "to_address": to_address,
            "weight_kg": weight_kg,
            "estimated_cost": estimate['estimated_cost'],
            "final_cost": None,
            "currency": estimate['currency'],
            "service_level": estimate['service_level'],
            "status": "pending",
            "carrier_tracking_status": None,
            "customs_info": customs_info,
            "ship_date": None,
            "estimated_delivery": None,
            "actual_delivery": None,
            "metadata": {
                "is_international": estimate['is_international'],
                "is_remote_area": estimate['is_remote_area'],
                "delivery_days_min": estimate['delivery_days_min'],
                "delivery_days_max": estimate['delivery_days_max']
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.shipments.insert_one(shipment_doc)
        
        # Try to create label via API
        if SHIPPO_API_KEY:
            try:
                label_result = await self._create_label_via_api(shipment_doc)
                if label_result:
                    await self.db.shipments.update_one(
                        {"shipment_id": shipment_id},
                        {"$set": {
                            "tracking_number": label_result['tracking_number'],
                            "label_url": label_result['label_url'],
                            "status": "label_created",
                            "carrier_tracking_status": "label_created"
                        }}
                    )
                    shipment_doc.update(label_result)
                    shipment_doc['status'] = 'label_created'
            except Exception as e:
                logger.error(f"Label creation failed: {e}")
        
        return shipment_doc
    
    async def _create_label_via_api(self, shipment: Dict) -> Optional[Dict]:
        """
        Create shipping label via Shippo API
        """
        
        if not SHIPPO_API_KEY:
            return None
        
        # This is a simplified version - would need full implementation
        # For now, return mock data
        logger.info("Would create label via Shippo API for shipment: " + shipment['shipment_id'])
        
        return None

# ============= TRACKING SERVICE =============

class TrackingService:
    """
    Handle tracking updates and webhook events
    """
    
    def __init__(self, db):
        self.db = db
    
    async def process_tracking_event(self, event_data: Dict) -> bool:
        """
        Process tracking webhook event
        """
        
        tracking_number = event_data.get('tracking_number')
        if not tracking_number:
            return False
        
        # Find shipment
        shipment = await self.db.shipments.find_one(
            {"tracking_number": tracking_number},
            {"_id": 0}
        )
        
        if not shipment:
            logger.warning(f"Shipment not found for tracking: {tracking_number}")
            return False
        
        # Create tracking event
        event_id = f"evt_{datetime.now().strftime('%Y%m%d%H%M%S')}_{tracking_number[-6:]}"
        
        tracking_event = {
            "event_id": event_id,
            "shipment_id": shipment['shipment_id'],
            "status": event_data.get('status', 'unknown'),
            "status_details": event_data.get('status_details'),
            "location": event_data.get('location'),
            "occurred_at": event_data.get('occurred_at', datetime.now(timezone.utc).isoformat()),
            "carrier_status_code": event_data.get('carrier_status_code'),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.tracking_events.insert_one(tracking_event)
        
        # Update shipment status
        status_map = {
            'in_transit': 'in_transit',
            'delivered': 'delivered',
            'failed': 'failed',
            'returned': 'failed'
        }
        
        new_status = status_map.get(event_data.get('status'), shipment['status'])
        
        await self.db.shipments.update_one(
            {"shipment_id": shipment['shipment_id']},
            {"$set": {
                "status": new_status,
                "carrier_tracking_status": event_data.get('status')
            }}
        )
        
        # Update order status
        if new_status == 'delivered':
            await self.db.orders.update_one(
                {"order_id": shipment['order_id']},
                {"$set": {"status": "delivered"}}
            )
        
        return True
