import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Package, Plane } from 'lucide-react';
import { toast } from 'sonner';

export default function SellerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingId, setTrackingId] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders/seller`, { withCredentials: true });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTracking = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `${API}/orders/${selectedOrder.order_id}/tracking`,
        { tracking_id: trackingId },
        { withCredentials: true }
      );

      toast.success('Tracking updated successfully!');
      setSelectedOrder(null);
      setTrackingId('');
      fetchOrders();
    } catch (error) {
      console.error('Error updating tracking:', error);
      toast.error('Failed to update tracking');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="seller-orders">
      <nav className="bg-white border-b border-border sticky top-0 z-50">
        <div className="px-6 md:px-12 py-4">
          <Button 
            data-testid="back-btn"
            onClick={() => navigate('/shop-dashboard')} 
            variant="ghost" 
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="px-6 md:px-12 lg:px-24 py-12">
        <h1 className="font-heading text-4xl font-bold mb-8">Orders</h1>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-muted mx-auto mb-4" />
            <p className="text-muted text-lg">No orders yet</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <Card key={order.order_id} className="p-6" data-testid={`order-${index}`}>
                <div className="flex flex-col md:flex-row justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-xl">Order #{order.order_id}</h3>
                      {order.is_tourist_delivery && (
                        <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium flex items-center gap-1">
                          <Plane className="w-3 h-3" />
                          Tourist Delivery
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted">
                      {new Date(order.created_at).toLocaleDateString()} • {order.delivery_type}
                    </p>
                    {order.ship_after_trip && order.trip_end_date && (
                      <p className="text-xs text-accent-foreground mt-1">
                        📅 Ship after: {new Date(order.trip_end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 md:mt-0">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      order.status === 'confirmed' ? 'bg-secondary/20 text-secondary' :
                      order.status === 'shipped' ? 'bg-accent/20 text-accent-foreground' :
                      'bg-muted/20 text-muted'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.product_name} x{item.quantity}</span>
                      <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {order.delivery_address && (
                  <div className="mb-4 p-4 bg-background rounded-lg">
                    <h4 className="font-semibold mb-2 text-sm">Delivery Address:</h4>
                    <p className="text-sm text-muted">
                      {order.delivery_address.street}, {order.delivery_address.city}, {order.delivery_address.country}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <div className="text-2xl font-bold">${order.total.toFixed(2)}</div>
                  {order.delivery_type === 'delivery' && order.status !== 'shipped' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          data-testid={`add-tracking-${index}`}
                          onClick={() => setSelectedOrder(order)}
                          className="bg-secondary hover:bg-secondary/90 rounded-full"
                        >
                          Add Tracking
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Tracking ID</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateTracking} className="space-y-4">
                          <div>
                            <Label htmlFor="tracking">Tracking Number</Label>
                            <Input
                              id="tracking"
                              data-testid="tracking-input"
                              required
                              value={trackingId}
                              onChange={(e) => setTrackingId(e.target.value)}
                              placeholder="Enter tracking number"
                            />
                          </div>
                          <Button 
                            data-testid="submit-tracking-btn"
                            type="submit" 
                            className="w-full bg-primary hover:bg-primary/90 rounded-full"
                          >
                            Update Tracking
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                  {order.tracking_id && (
                    <span className="text-sm text-muted">Tracking: {order.tracking_id}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}