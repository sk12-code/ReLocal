import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plane, Package, Calendar, Luggage } from 'lucide-react';
import { toast } from 'sonner';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [deliveryType, setDeliveryType] = useState('delivery'); // Default to delivery
  const [shipAfterTrip, setShipAfterTrip] = useState(false);
  const [tripEndDate, setTripEndDate] = useState('');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postal_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [totalWeight, setTotalWeight] = useState(0);

  useEffect(() => {
    fetchUserAndCart();
  }, [navigate]);

  const fetchUserAndCart = async () => {
    try {
      const userRes = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(userRes.data);
      
      // Pre-fill default address if available
      if (userRes.data.default_delivery_address) {
        setAddress(userRes.data.default_delivery_address);
      }
      
      // Set delivery as default if travel mode is on
      if (userRes.data.travel_mode) {
        setDeliveryType('delivery');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }

    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const cartItems = JSON.parse(savedCart);
      setCart(cartItems);
      
      // Calculate total weight
      let weight = 0;
      for (const item of cartItems) {
        try {
          const productRes = await axios.get(`${API}/products/${item.product_id}`);
          weight += (productRes.data.estimated_weight_kg || 0.5) * item.quantity;
        } catch (error) {
          console.error('Error fetching product weight:', error);
        }
      }
      setTotalWeight(weight);
    } else {
      toast.error('Cart is empty');
      navigate('/dashboard');
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (deliveryType === 'delivery' && (!address.street || !address.city)) {
      toast.error('Please provide delivery address');
      return;
    }

    if (shipAfterTrip && !tripEndDate) {
      toast.error('Please select trip end date');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        shop_id: cart[0].shop_id,
        items: cart,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? address : null,
        ship_after_trip: shipAfterTrip,
        trip_end_date: shipAfterTrip ? tripEndDate : null,
        delivery_preference_reason: deliveryType === 'delivery' ? 'travel_light' : 'immediate_pickup'
      };

      const orderResponse = await axios.post(`${API}/orders`, orderData, {
        withCredentials: true
      });

      const orderId = orderResponse.data.order_id;
      const originUrl = window.location.origin;

      const checkoutResponse = await axios.post(
        `${API}/checkout/session`,
        { order_id: orderId, origin_url: originUrl },
        { withCredentials: true }
      );

      window.location.href = checkoutResponse.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="checkout-page">
      <nav className="bg-white border-b border-border sticky top-0 z-50">
        <div className="px-6 md:px-12 py-4">
          <Button 
            data-testid="back-btn"
            onClick={() => navigate(-1)} 
            variant="ghost" 
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </nav>

      <div className="px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-heading text-4xl font-bold mb-2">Confirm & Travel Light</h1>
          <p className="text-lg text-muted mb-8">Choose how you'd like to receive your items</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card className="p-6">
                <h2 className="font-semibold text-xl mb-4">Order Summary</h2>
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-start" data-testid={`cart-item-${index}`}>
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-muted">Qty: {item.quantity}</div>
                      </div>
                      <div className="font-semibold">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-border flex justify-between items-center">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-2xl text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>

              {/* Luggage Savings */}
              {totalWeight > 0 && (
                <Card className="p-6 bg-gradient-to-br from-secondary/10 to-accent/10 border-2 border-secondary/30">
                  <div className="flex items-center gap-3 mb-3">
                    <Luggage className="w-6 h-6 text-secondary" />
                    <h3 className="font-semibold text-lg">Travel Light Benefits</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Weight you won't carry:</span>
                      <span className="font-semibold">{totalWeight.toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Est. baggage fee saved:</span>
                      <span className="font-semibold text-primary">${(totalWeight * 10).toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted mt-3">
                    ✈️ Focus on your trip, we'll handle the shipping
                  </p>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Delivery Method */}
              <Card className="p-6">
                <h2 className="font-semibold text-xl mb-4">Delivery Method</h2>
                <RadioGroup value={deliveryType} onValueChange={setDeliveryType} className="space-y-3">
                  {/* Delivery Option - Emphasized */}
                  <Card className={`p-4 cursor-pointer transition-all ${
                    deliveryType === 'delivery' 
                      ? 'border-2 border-primary bg-primary/5' 
                      : 'border border-border hover:border-primary/50'
                  }`} onClick={() => setDeliveryType('delivery')}>
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="delivery" id="delivery" data-testid="delivery-radio" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="delivery" className="cursor-pointer flex items-center gap-2 text-base font-semibold mb-1">
                          <Plane className="w-5 h-5 text-primary" />
                          Travel Light Delivery (Recommended)
                        </Label>
                        <p className="text-sm text-muted">
                          We'll ship directly to your home. No need to carry anything.
                        </p>
                        {deliveryType === 'delivery' && user?.travel_mode && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center space-x-2 mb-3">
                              <Checkbox 
                                id="ship-after-trip" 
                                checked={shipAfterTrip}
                                onCheckedChange={setShipAfterTrip}
                              />
                              <Label htmlFor="ship-after-trip" className="text-sm cursor-pointer">
                                Ship all items together after my trip ends
                              </Label>
                            </div>
                            {shipAfterTrip && (
                              <div className="ml-6">
                                <Label htmlFor="trip-end" className="text-xs">Trip End Date</Label>
                                <Input
                                  id="trip-end"
                                  type="date"
                                  value={tripEndDate}
                                  onChange={(e) => setTripEndDate(e.target.value)}
                                  min={new Date().toISOString().split('T')[0]}
                                  className="mt-1"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Pickup Option - De-emphasized */}
                  <Card className={`p-4 cursor-pointer transition-all ${
                    deliveryType === 'pickup' 
                      ? 'border-2 border-muted bg-muted/5' 
                      : 'border border-border hover:border-muted'
                  }`} onClick={() => setDeliveryType('pickup')}>
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="pickup" id="pickup" data-testid="pickup-radio" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="pickup" className="cursor-pointer flex items-center gap-2 text-base font-semibold mb-1 text-muted">
                          <Package className="w-5 h-5" />
                          Carry in Luggage (Pickup)
                        </Label>
                        <p className="text-sm text-muted">
                          Pick up from shop and carry with you.
                        </p>
                      </div>
                    </div>
                  </Card>
                </RadioGroup>
              </Card>

              {/* Delivery Address */}
              {deliveryType === 'delivery' && (
                <Card className="p-6">
                  <h2 className="font-semibold text-xl mb-4">Delivery Address</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="street">Street Address *</Label>
                      <Input
                        id="street"
                        data-testid="street-input"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        placeholder="123 Main St"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          data-testid="city-input"
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          placeholder="City"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State/Province</Label>
                        <Input
                          id="state"
                          data-testid="state-input"
                          value={address.state}
                          onChange={(e) => setAddress({ ...address, state: e.target.value })}
                          placeholder="State"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          data-testid="country-input"
                          value={address.country}
                          onChange={(e) => setAddress({ ...address, country: e.target.value })}
                          placeholder="Country"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="postal">Postal Code</Label>
                        <Input
                          id="postal"
                          data-testid="postal-input"
                          value={address.postal_code}
                          onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                          placeholder="12345"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Checkout Button */}
              <Button
                data-testid="proceed-payment-btn"
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 text-lg font-medium shadow-lg shadow-primary/20"
              >
                {loading ? 'Processing...' : (
                  deliveryType === 'delivery' 
                    ? '✈️ Confirm & Travel Light' 
                    : 'Confirm & Pay'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
