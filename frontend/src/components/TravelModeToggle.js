import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plane, Package } from 'lucide-react';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';

export default function TravelModeToggle({ user, onUpdate }) {
  const [travelMode, setTravelMode] = useState(user?.travel_mode ?? true);
  const [updating, setUpdating] = useState(false);

  const handleToggle = async (checked) => {
    setUpdating(true);
    try {
      await axios.put(`${API}/users/travel-mode`, {
        travel_mode: checked
      }, { withCredentials: true });

      setTravelMode(checked);
      toast.success(checked ? 'Travel Mode ON - Delivery prioritized' : 'Travel Mode OFF');
      if (onUpdate) onUpdate(checked);
    } catch (error) {
      console.error('Failed to update travel mode:', error);
      toast.error('Failed to update travel mode');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className="p-4 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            travelMode ? 'bg-primary/10' : 'bg-muted/20'
          }`}>
            {travelMode ? (
              <Plane className="w-5 h-5 text-primary" />
            ) : (
              <Package className="w-5 h-5 text-muted" />
            )}
          </div>
          <div>
            <Label htmlFor="travel-mode" className="text-base font-semibold cursor-pointer">
              Travel Mode
            </Label>
            <p className="text-sm text-muted">
              {travelMode 
                ? 'Delivery prioritized - Travel light ✈️' 
                : 'Pickup available - Carry with you'}
            </p>
          </div>
        </div>
        <Switch
          id="travel-mode"
          checked={travelMode}
          onCheckedChange={handleToggle}
          disabled={updating}
          className="data-[state=checked]:bg-primary"
        />
      </div>
    </Card>
  );
}
