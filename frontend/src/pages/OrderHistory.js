import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`, { withCredentials: true });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (orderId) => {
    try {
      const response = await axios.post(`${API}/orders/${orderId}/reorder`, {}, {
        withCredentials: true
      });
      toast.success('Order created! Proceed to checkout.');
      
      const newOrder = response.data;
      const cartItem = {
        product_id: newOrder.items[0].product_id,
        product_name: newOrder.items[0].product_name,
        quantity: newOrder.items[0].quantity,
        price: newOrder.items[0].price,
        shop_id: newOrder.shop_id,
        shop_name: newOrder.shop_name
      };
      localStorage.setItem('cart', JSON.stringify(newOrder.items));
      navigate('/checkout');
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Failed to reorder');
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
    <div className="min-h-screen bg-background" data-testid="order-history">
      <nav className="bg-white border-b border-border sticky top-0 z-50">
        <div className="px-6 md:px-12 py-4">
          <Button 
            data-testid="back-btn"
            onClick={() => navigate('/dashboard')} 
            variant="ghost" 
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="px-6 md:px-12 lg:px-24 py-12">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-8">Order History</h1>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted text-lg mb-6">No orders yet</p>
            <Button 
              data-testid="start-shopping-btn"
              onClick={() => navigate('/dashboard')} 
              className="bg-primary hover:bg-primary/90 rounded-full"
            >
              Start Shopping
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.order_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              >
                <Card className="p-6" data-testid={`order-${index}`}>
                  <div className="flex flex-col md:flex-row justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-xl mb-1">{order.shop_name}</h3>
                      <p className="text-sm text-muted">
                        Order #{order.order_id} • {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                        order.status === 'confirmed' ? 'bg-secondary/20 text-secondary' :
                        order.status === 'shipped' ? 'bg-accent/20 text-accent-foreground' :
                        order.status === 'pending' ? 'bg-muted/20 text-muted' :
                        'bg-primary/20 text-primary'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-muted">Quantity: {item.quantity}</div>
                        </div>
                        <div className="font-semibold">${(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="text-sm text-muted mb-1">Delivery: {order.delivery_type}</div>
                      {order.tracking_id && (
                        <div className="text-sm text-muted">Tracking: {order.tracking_id}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold">${order.total.toFixed(2)}</div>
                      <Button
                        data-testid={`reorder-btn-${index}`}
                        onClick={() => handleReorder(order.order_id)}
                        variant="outline"
                        className="gap-2 rounded-full"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Buy Again
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}