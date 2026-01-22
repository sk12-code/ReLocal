import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, CheckCircle, Store, Package } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pendingShops, setPendingShops] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, shopsRes, productsRes] = await Promise.all([
        axios.get(`${API}/auth/me`, { withCredentials: true }),
        axios.get(`${API}/admin/shops/pending`, { withCredentials: true }),
        axios.get(`${API}/admin/products/pending`, { withCredentials: true })
      ]);

      setUser(userRes.data);
      setPendingShops(shopsRes.data);
      setPendingProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard');
      if (error.response?.status === 403) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyShop = async (shopId) => {
    try {
      await axios.put(`${API}/admin/shops/${shopId}/verify`, {}, {
        withCredentials: true
      });
      toast.success('Shop verified successfully!');
      fetchData();
    } catch (error) {
      console.error('Error verifying shop:', error);
      toast.error('Failed to verify shop');
    }
  };

  const handleVerifyProduct = async (productId) => {
    try {
      await axios.put(`${API}/admin/products/${productId}/verify`, {}, {
        withCredentials: true
      });
      toast.success('Product verified successfully!');
      fetchData();
    } catch (error) {
      console.error('Error verifying product:', error);
      toast.error('Failed to verify product');
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
    <div className="min-h-screen bg-background" data-testid="admin-dashboard">
      <nav className="bg-white border-b border-border sticky top-0 z-50">
        <div className="px-6 md:px-12 py-4 flex justify-between items-center">
          <div className="font-heading text-2xl font-bold text-primary">ReLocal Admin</div>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-12">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-2">
              Admin Dashboard
            </h1>
            <p className="text-lg text-muted">Manage sellers, products, and platform quality</p>
          </div>

          <Tabs defaultValue="shops" className="space-y-6">
            <TabsList>
              <TabsTrigger value="shops" data-testid="shops-tab">Pending Shops ({pendingShops.length})</TabsTrigger>
              <TabsTrigger value="products" data-testid="products-tab">Pending Products ({pendingProducts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="shops" data-testid="shops-content">
              {pendingShops.length === 0 ? (
                <Card className="p-12 text-center">
                  <Store className="w-16 h-16 text-muted mx-auto mb-4" />
                  <p className="text-muted text-lg">No pending shops</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingShops.map((shop, index) => (
                    <Card key={shop.shop_id} className="p-6" data-testid={`shop-${index}`}>
                      <h3 className="font-semibold text-xl mb-2">{shop.name}</h3>
                      <p className="text-sm text-muted mb-4">
                        {shop.location?.city}, {shop.location?.country}
                      </p>
                      {shop.description && (
                        <p className="text-sm mb-4 line-clamp-2">{shop.description}</p>
                      )}
                      {shop.categories && shop.categories.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {shop.categories.map((cat, idx) => (
                              <span key={idx} className="text-xs px-2 py-1 bg-muted/20 rounded-full">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button
                        data-testid={`verify-shop-${index}`}
                        onClick={() => handleVerifyShop(shop.shop_id)}
                        className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Verify Shop
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="products" data-testid="products-content">
              {pendingProducts.length === 0 ? (
                <Card className="p-12 text-center">
                  <Package className="w-16 h-16 text-muted mx-auto mb-4" />
                  <p className="text-muted text-lg">No pending products</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingProducts.map((product, index) => (
                    <Card key={product.product_id} className="overflow-hidden" data-testid={`product-${index}`}>
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted/20 flex items-center justify-center">
                          <span className="text-muted">No image</span>
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="font-semibold text-xl mb-2">{product.name}</h3>
                        <p className="text-sm text-muted mb-4 line-clamp-2">{product.description}</p>
                        <div className="text-2xl font-bold text-primary mb-4">
                          ${product.price.toFixed(2)}
                        </div>
                        <Button
                          data-testid={`verify-product-${index}`}
                          onClick={() => handleVerifyProduct(product.product_id)}
                          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Verify Product
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}