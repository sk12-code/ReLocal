import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load profile');
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
    <div className="min-h-screen bg-background" data-testid="profile-page">
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
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading text-4xl font-bold mb-8">Profile</h1>

          <Card className="p-8">
            <div className="flex items-center gap-6 mb-8">
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="w-12 h-12 text-primary" />
                </div>
              )}
              <div>
                <h2 className="font-heading text-2xl font-bold mb-1">{user?.name}</h2>
                <p className="text-muted">{user?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">User ID:</span>
                    <span className="font-mono">{user?.user_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Role:</span>
                    <span className="capitalize">{user?.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Member Since:</span>
                    <span>{new Date(user?.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {user?.role === 'tourist' && (
                <div className="pt-6 border-t border-border">
                  <Button
                    data-testid="become-seller-btn"
                    onClick={() => navigate('/shop-dashboard')}
                    className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full"
                  >
                    Become a Seller
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}