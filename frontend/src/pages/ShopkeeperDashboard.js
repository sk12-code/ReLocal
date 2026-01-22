import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package, ShoppingBag, TrendingUp, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ShopkeeperDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingShop, setCreatingShop] = useState(false);
  const [shopForm, setShopForm] = useState({
    name: '',
    description: '',
    street: '',
    city: '',
    country: '',
    categories: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userRes = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(userRes.data);

      try {
        const shopRes = await axios.get(`${API}/shops/my-shop`, { withCredentials: true });
        setShop(shopRes.data);
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('Error fetching shop:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShop = async (e) => {
    e.preventDefault();
    setCreatingShop(true);

    try {
      const shopData = {
        name: shopForm.name,
        description: shopForm.description,
        location: {
          street: shopForm.street,
          city: shopForm.city,
          country: shopForm.country
        },
        categories: shopForm.categories.split(',').map(c => c.trim())
      };

      const response = await axios.post(`${API}/shops`, shopData, {
        withCredentials: true
      });

      setShop(response.data);
      toast.success('Shop created successfully!');
    } catch (error) {
      console.error('Error creating shop:', error);
      toast.error('Failed to create shop');
    } finally {
      setCreatingShop(false);
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

  if (!shop) {
    return (
      <div className="min-h-screen bg-background" data-testid="shop-onboarding">
        <nav className="bg-white border-b border-border sticky top-0 z-50">
          <div className="px-6 md:px-12 py-4 flex justify-between items-center">
            <div className="font-heading text-2xl font-bold text-primary">ReLocal</div>
            <Button 
              data-testid="logout-btn"
              onClick={handleLogout} 
              variant="ghost" 
              size="icon"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </nav>

        <div className="px-6 md:px-12 lg:px-24 py-12">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
                Welcome, <span className="text-primary italic">{user?.name?.split(' ')[0]}</span>
              </h1>
              <p className="text-lg text-muted mb-8">Let's set up your shop and start reaching travelers worldwide</p>

              <Card className="p-8">
                <h2 className="font-heading text-2xl font-semibold mb-6">Create Your Shop</h2>
                <form onSubmit={handleCreateShop} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Shop Name *</Label>
                    <Input
                      id="name"
                      data-testid="shop-name-input"
                      required
                      value={shopForm.name}
                      onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                      placeholder="Artisan Pottery Studio"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      data-testid="shop-description-input"
                      value={shopForm.description}
                      onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                      placeholder="Tell travelers about your shop and products"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="street">Street Address *</Label>
                    <Input
                      id="street"
                      data-testid="shop-street-input"
                      required
                      value={shopForm.street}
                      onChange={(e) => setShopForm({ ...shopForm, street: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        data-testid="shop-city-input"
                        required
                        value={shopForm.city}
                        onChange={(e) => setShopForm({ ...shopForm, city: e.target.value })}
                        placeholder="Barcelona"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        data-testid="shop-country-input"
                        required
                        value={shopForm.country}
                        onChange={(e) => setShopForm({ ...shopForm, country: e.target.value })}
                        placeholder="Spain"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="categories">Categories (comma-separated)</Label>
                    <Input
                      id="categories"
                      data-testid="shop-categories-input"
                      value={shopForm.categories}
                      onChange={(e) => setShopForm({ ...shopForm, categories: e.target.value })}
                      placeholder="Pottery, Ceramics, Handicrafts"
                    />
                  </div>

                  <Button
                    data-testid="create-shop-btn"
                    type="submit"
                    disabled={creatingShop}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 text-lg font-medium"
                  >
                    {creatingShop ? 'Creating...' : 'Create Shop'}
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="shopkeeper-dashboard">
      <nav className="bg-white border-b border-border sticky top-0 z-50">
        <div className="px-6 md:px-12 py-4 flex justify-between items-center">
          <div className="font-heading text-2xl font-bold text-primary">ReLocal Seller</div>
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
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-2">{shop.name}</h1>
            <p className="text-lg text-muted">{shop.location?.city}, {shop.location?.country}</p>
            {!shop.verified && (
              <span className="inline-block mt-2 px-3 py-1 bg-accent/20 text-accent-foreground rounded-full text-sm font-medium">
                Pending Verification
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card 
              className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary"
              onClick={() => navigate('/shop/products')}
              data-testid="manage-products-card"
            >
              <Package className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-heading text-2xl font-semibold mb-2">Products</h3>
              <p className="text-muted">Manage your products and QR codes</p>
            </Card>

            <Card 
              className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary"
              onClick={() => navigate('/shop/orders')}
              data-testid="manage-orders-card"
            >
              <ShoppingBag className="w-12 h-12 text-secondary mb-4" />
              <h3 className="font-heading text-2xl font-semibold mb-2">Orders</h3>
              <p className="text-muted">View and manage customer orders</p>
            </Card>

            <Card 
              className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-accent-foreground"
              onClick={() => navigate('/shop/insights')}
              data-testid="view-insights-card"
            >
              <TrendingUp className="w-12 h-12 text-accent-foreground mb-4" />
              <h3 className="font-heading text-2xl font-semibold mb-2">Insights</h3>
              <p className="text-muted">Track sales and repeat buyers</p>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}