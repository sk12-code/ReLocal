import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postal_code: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      toast.error('Cart is empty');
      navigate('/dashboard');
    }
  }, [navigate]);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (deliveryType === 'delivery' && (!address.street || !address.city)) {
      toast.error('Please provide delivery address');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        shop_id: cart[0].shop_id,
        items: cart,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? address : null
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
        <div className="max-w-4xl mx-auto">
          <h1 className="font-heading text-4xl font-bold mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <Card className="p-6 mb-6">
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

              <Card className="p-6">
                <h2 className="font-semibold text-xl mb-4">Delivery Method</h2>
                <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
                  <div className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value="pickup" id="pickup" data-testid="pickup-radio" />
                    <Label htmlFor="pickup" className="cursor-pointer">Pickup from shop</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivery" id="delivery" data-testid="delivery-radio" />
                    <Label htmlFor="delivery" className="cursor-pointer">Door delivery</Label>
                  </div>
                </RadioGroup>
              </Card>
            </div>

            <div>
              {deliveryType === 'delivery' && (
                <Card className="p-6 mb-6">
                  <h2 className="font-semibold text-xl mb-4">Delivery Address</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        data-testid="street-input"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          data-testid="city-input"
                          value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
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
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          data-testid="country-input"
                          value={address.country}
                          onChange={(e) => setAddress({ ...address, country: e.target.value })}
                          placeholder="Country"
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

              <Button
                data-testid="proceed-payment-btn"
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 text-lg font-medium shadow-lg shadow-primary/20"
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}