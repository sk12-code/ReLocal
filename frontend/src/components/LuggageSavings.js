import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Luggage, Scale, DollarSign, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { API } from '@/App';

export default function LuggageSavings() {
  const [savings, setSavings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    try {
      const response = await axios.get(`${API}/users/luggage-savings`, {
        withCredentials: true
      });
      setSavings(response.data);
    } catch (error) {
      console.error('Failed to fetch luggage savings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !savings || savings.total_orders_delivered === 0) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-secondary/10 to-accent/10 border-2 border-secondary/20">
      <div className="flex items-center gap-2 mb-4">
        <Luggage className="w-6 h-6 text-secondary" />
        <h3 className="font-heading text-xl font-semibold">Your Travel Light Stats</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Scale className="w-4 h-4 text-secondary" />
            <span className="text-2xl font-bold text-secondary">{savings.total_weight_kg}</span>
            <span className="text-sm text-muted">kg</span>
          </div>
          <p className="text-xs text-muted">Weight Saved</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle className="w-4 h-4 text-accent-foreground" />
            <span className="text-2xl font-bold text-accent-foreground">{savings.total_orders_delivered}</span>
          </div>
          <p className="text-xs text-muted">Items Delivered</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-2xl font-bold text-primary">{savings.estimated_baggage_fee_saved}</span>
          </div>
          <p className="text-xs text-muted">Baggage Fees Avoided</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-3xl">⚠️</span>
            <span className="text-2xl font-bold">{savings.fragile_items_saved + savings.liquid_items_saved}</span>
          </div>
          <p className="text-xs text-muted">Hassle Items Shipped</p>
        </div>
      </div>

      {(savings.fragile_items_saved > 0 || savings.liquid_items_saved > 0) && (
        <div className="mt-4 pt-4 border-t border-secondary/20 text-center">
          <p className="text-sm text-muted">
            Including <strong>{savings.fragile_items_saved} fragile</strong> and{' '}
            <strong>{savings.liquid_items_saved} liquid</strong> items you didn't have to carry
          </p>
        </div>
      )}
    </Card>
  );
}
