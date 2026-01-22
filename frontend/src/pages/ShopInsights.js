import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, DollarSign, Users, Package, QrCode as QrCodeIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function ShopInsights() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const shopRes = await axios.get(`${API}/shops/my-shop`, { withCredentials: true });
      setShop(shopRes.data);

      const insightsRes = await axios.get(`${API}/shops/${shopRes.data.shop_id}/insights`, {
        withCredentials: true
      });
      setInsights(insightsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-background" data-testid="shop-insights">
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
        <h1 className="font-heading text-4xl font-bold mb-8">Shop Insights</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6" data-testid="revenue-card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted">Total Revenue</p>
                <h3 className="text-3xl font-bold">${insights?.total_revenue?.toFixed(2) || '0.00'}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6" data-testid="orders-card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted">Total Orders</p>
                <h3 className="text-3xl font-bold">{insights?.total_orders || 0}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6" data-testid="repeat-buyers-card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted">Repeat Buyers</p>
                <h3 className="text-3xl font-bold">{insights?.repeat_buyers || 0}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6" data-testid="qr-scans-card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center">
                <QrCodeIcon className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted">QR Scans</p>
                <h3 className="text-3xl font-bold">{insights?.total_qr_scans || 0}</h3>
              </div>
            </div>
          </Card>
        </div>

        <Card className="mt-8 p-8">
          <h2 className="font-heading text-2xl font-semibold mb-4">Performance Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted">Products Listed:</span>
              <span className="font-semibold text-lg">{insights?.total_products || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted">Average Order Value:</span>
              <span className="font-semibold text-lg">
                ${insights?.total_orders > 0 
                  ? (insights.total_revenue / insights.total_orders).toFixed(2) 
                  : '0.00'
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted">QR Engagement Rate:</span>
              <span className="font-semibold text-lg">
                {insights?.total_products > 0 && insights?.total_qr_scans > 0
                  ? ((insights.total_qr_scans / insights.total_products)).toFixed(1)
                  : '0'
                } scans/product
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}