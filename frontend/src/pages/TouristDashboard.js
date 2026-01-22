import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { QrCode, Package, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function TouristDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, ordersRes] = await Promise.all([
        axios.get(`${API}/auth/me`, { withCredentials: true }),
        axios.get(`${API}/orders`, { withCredentials: true })
      ]);
      setUser(userRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
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
    <div className="min-h-screen bg-background" data-testid="tourist-dashboard">
      <nav className="bg-white border-b border-border sticky top-0 z-50">
        <div className="px-6 md:px-12 py-4 flex justify-between items-center">
          <div className="font-heading text-2xl font-bold text-primary">ReLocal</div>
          <div className="flex items-center gap-4">
            <Button 
              data-testid="profile-btn"
              onClick={() => navigate('/profile')} 
              variant="ghost" 
              size="icon"
            >
              <User className="w-5 h-5" />
            </Button>
            <Button 
              data-testid="logout-btn"
              onClick={handleLogout} 
              variant="ghost" 
              size="icon"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="px-6 md:px-12 lg:px-24 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-12">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-2">
              Welcome back, <span className="text-primary italic">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-lg text-muted">Your travel memories await</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card 
              className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary"
              onClick={() => navigate('/scan')}
              data-testid="scan-qr-card"
            >
              <QrCode className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-heading text-2xl font-semibold mb-2">Scan QR Code</h3>
              <p className="text-muted">Discover products in local shops</p>
            </Card>

            <Card 
              className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary"
              onClick={() => navigate('/orders')}
              data-testid="view-orders-card"
            >
              <Package className="w-12 h-12 text-secondary mb-4" />
              <h3 className="font-heading text-2xl font-semibold mb-2">Order History</h3>
              <p className="text-muted">View and reorder past purchases</p>
            </Card>
          </div>

          <div>
            <h2 className="font-heading text-3xl font-semibold mb-6">Recent Orders</h2>
            {orders.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted text-lg">No orders yet. Start exploring local shops!</p>
                <Button 
                  data-testid="start-exploring-btn"
                  onClick={() => navigate('/scan')} 
                  className="mt-6 bg-primary hover:bg-primary/90 rounded-full"
                >
                  Start Exploring
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.slice(0, 6).map((order, index) => (
                  <motion.div
                    key={order.order_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card 
                      className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate('/orders')}
                      data-testid={`order-card-${index}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">{order.shop_name}</h4>
                          <p className="text-sm text-muted">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'confirmed' ? 'bg-secondary/20 text-secondary' :
                          order.status === 'shipped' ? 'bg-accent/20 text-accent-foreground' :
                          'bg-muted/20 text-muted'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-sm">
                            <span>{item.product_name}</span>
                            <span className="text-muted ml-2">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                        <span className="font-semibold">${order.total.toFixed(2)}</span>
                        <span className="text-sm text-muted capitalize">{order.delivery_type}</span>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}