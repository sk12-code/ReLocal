import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingCart, MapPin, CheckCircle, ArrowLeft, Plane, Package, AlertTriangle, Droplets } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${productId}`);
      setProduct(response.data);
      setShop(response.data.shop);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    const cartItem = {
      product_id: product.product_id,
      product_name: product.name,
      quantity: quantity,
      price: product.price,
      shop_id: product.shop_id,
      shop_name: shop?.name
    };
    
    localStorage.setItem('cart', JSON.stringify([cartItem]));
    toast.success('Added to cart');
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Product not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="product-detail">
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
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-[500px] object-cover rounded-2xl shadow-xl"
                />
              ) : (
                <div className="w-full h-[500px] bg-muted/20 rounded-2xl flex items-center justify-center">
                  <span className="text-muted">No image available</span>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-4">
                {product.authenticity_badge && (
                  <span className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <CheckCircle className="w-4 h-4" />
                    Authentic
                  </span>
                )}
              </div>

              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">{product.name}</h1>
              
              <div className="flex items-center gap-2 text-muted mb-6">
                <MapPin className="w-5 h-5" />
                <span>{shop?.name}</span>
                {shop?.location && (
                  <span>• {shop.location.city}, {shop.location.country}</span>
                )}
              </div>

              <div className="text-4xl font-bold text-primary mb-8">
                ${product.price.toFixed(2)}
              </div>

              {/* Travel Light Benefits */}
              <Card className="p-4 mb-6 bg-gradient-to-r from-secondary/10 to-accent/10 border-2 border-secondary/30">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Plane className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">Travel Light - We'll Deliver to Your Home</h3>
                    <p className="text-sm text-muted mb-3">
                      No need to carry this in your luggage. We'll ship it directly to your door.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-background rounded-full flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Weight: {product.estimated_weight_kg || 0.5} kg
                      </span>
                      {product.is_fragile && (
                        <span className="px-2 py-1 bg-background rounded-full flex items-center gap-1 text-orange-600">
                          <AlertTriangle className="w-3 h-3" />
                          Fragile
                        </span>
                      )}
                      {product.is_liquid && (
                        <span className="px-2 py-1 bg-background rounded-full flex items-center gap-1 text-blue-600">
                          <Droplets className="w-3 h-3" />
                          Liquid
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 mb-8">
                <h3 className="font-semibold text-lg mb-3">Description</h3>
                <p className="text-muted leading-relaxed">{product.description}</p>
              </Card>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <Button 
                    data-testid="decrease-quantity-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    variant="outline" 
                    size="icon"
                  >
                    -
                  </Button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <Button 
                    data-testid="increase-quantity-btn"
                    onClick={() => setQuantity(quantity + 1)} 
                    variant="outline" 
                    size="icon"
                  >
                    +
                  </Button>
                </div>
              </div>

              <Button 
                data-testid="add-to-cart-btn"
                onClick={handleAddToCart}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 text-lg font-medium shadow-lg shadow-primary/20"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}