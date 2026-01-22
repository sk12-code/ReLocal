import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Plus, QrCode as QrCodeIcon, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ShopProducts() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedQRProduct, setSelectedQRProduct] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    images: '',
    estimated_weight_kg: '0.5',
    is_fragile: false,
    is_liquid: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const shopRes = await axios.get(`${API}/shops/my-shop`, { withCredentials: true });
      setShop(shopRes.data);

      const productsRes = await axios.get(`${API}/shops/${shopRes.data.shop_id}/products`);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        images: productForm.images ? productForm.images.split(',').map(url => url.trim()) : [],
        estimated_weight_kg: parseFloat(productForm.estimated_weight_kg),
        is_fragile: productForm.is_fragile,
        is_liquid: productForm.is_liquid
      };

      await axios.post(`${API}/shops/${shop.shop_id}/products`, productData, {
        withCredentials: true
      });

      toast.success('Product added successfully!');
      setShowAddDialog(false);
      setProductForm({ 
        name: '', 
        description: '', 
        price: '', 
        images: '',
        estimated_weight_kg: '0.5',
        is_fragile: false,
        is_liquid: false
      });
      fetchData();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

  const handleDownloadQR = async (productId) => {
    try {
      const response = await axios.get(`${API}/qr/generate/${productId}`, {
        withCredentials: true,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `qr-${productId}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('QR code downloaded!');
    } catch (error) {
      console.error('Error downloading QR:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handleViewQR = async (product) => {
    setSelectedQRProduct(product);
    setShowQRDialog(true);
    setQrLoading(true);
    setQrCodeUrl(null);
    
    try {
      const response = await axios.get(`${API}/qr/generate/${product.product_id}`, {
        withCredentials: true,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error fetching QR:', error);
      toast.error('Failed to load QR code');
    } finally {
      setQrLoading(false);
    }
  };

  const handleCloseQRDialog = () => {
    setShowQRDialog(false);
    setSelectedQRProduct(null);
    if (qrCodeUrl) {
      window.URL.revokeObjectURL(qrCodeUrl);
      setQrCodeUrl(null);
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
    <div className="min-h-screen bg-background" data-testid="shop-products">
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-heading text-4xl font-bold">Products</h1>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button 
                data-testid="add-product-btn"
                className="bg-primary hover:bg-primary/90 rounded-full gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <Label htmlFor="prod-name">Product Name *</Label>
                  <Input
                    id="prod-name"
                    data-testid="product-name-input"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Handmade Pottery Bowl"
                  />
                </div>
                <div>
                  <Label htmlFor="prod-desc">Description *</Label>
                  <Textarea
                    id="prod-desc"
                    data-testid="product-description-input"
                    required
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Describe your product"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="prod-price">Price (USD) *</Label>
                  <Input
                    id="prod-price"
                    data-testid="product-price-input"
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="29.99"
                  />
                </div>
                <div>
                  <Label htmlFor="prod-images">Image URLs (comma-separated)</Label>
                  <Input
                    id="prod-images"
                    data-testid="product-images-input"
                    value={productForm.images}
                    onChange={(e) => setProductForm({ ...productForm, images: e.target.value })}
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="prod-weight">Estimated Weight (kg) *</Label>
                  <Input
                    id="prod-weight"
                    data-testid="product-weight-input"
                    type="number"
                    step="0.1"
                    required
                    value={productForm.estimated_weight_kg}
                    onChange={(e) => setProductForm({ ...productForm, estimated_weight_kg: e.target.value })}
                    placeholder="0.5"
                  />
                  <p className="text-xs text-muted mt-1">Helps tourists know how much luggage space they save</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="prod-fragile"
                      checked={productForm.is_fragile}
                      onChange={(e) => setProductForm({ ...productForm, is_fragile: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="prod-fragile" className="cursor-pointer">Fragile item</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="prod-liquid"
                      checked={productForm.is_liquid}
                      onChange={(e) => setProductForm({ ...productForm, is_liquid: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="prod-liquid" className="cursor-pointer">Contains liquid</Label>
                  </div>
                </div>
                <Button 
                  data-testid="submit-product-btn"
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 rounded-full"
                >
                  Add Product
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {products.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted text-lg mb-6">No products yet</p>
            <Button 
              data-testid="add-first-product-btn"
              onClick={() => setShowAddDialog(true)} 
              className="bg-primary hover:bg-primary/90 rounded-full"
            >
              Add Your First Product
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
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
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</span>
                    {!product.verified && (
                      <span className="text-xs px-2 py-1 bg-accent/20 text-accent-foreground rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      data-testid={`view-qr-${index}`}
                      onClick={() => handleViewQR(product)}
                      variant="outline"
                      className="flex-1 gap-2 rounded-full"
                    >
                      <Eye className="w-4 h-4" />
                      View QR
                    </Button>
                    <Button
                      data-testid={`download-qr-${index}`}
                      onClick={() => handleDownloadQR(product.product_id)}
                      variant="outline"
                      className="flex-1 gap-2 rounded-full"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* QR Code View Modal */}
      <Dialog open={showQRDialog} onOpenChange={handleCloseQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">QR Code</DialogTitle>
            <DialogDescription>
              {selectedQRProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            {qrLoading ? (
              <div className="w-64 h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                <span className="text-muted">Loading QR code...</span>
              </div>
            ) : qrCodeUrl ? (
              <>
                <img 
                  src={qrCodeUrl} 
                  alt={`QR code for ${selectedQRProduct?.name}`}
                  className="w-64 h-64 rounded-lg shadow-md"
                  data-testid="qr-code-image"
                />
                <p className="text-sm text-muted mt-4 text-center">
                  Show this code to customers or print it for your shop display
                </p>
                <Button
                  data-testid="modal-download-qr-btn"
                  onClick={() => handleDownloadQR(selectedQRProduct?.product_id)}
                  className="mt-4 gap-2 rounded-full"
                >
                  <Download className="w-4 h-4" />
                  Download QR Code
                </Button>
              </>
            ) : (
              <div className="w-64 h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                <span className="text-muted">Failed to load QR code</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}