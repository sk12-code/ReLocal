import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { toast } from 'sonner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        const hash = location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          toast.error('Invalid session');
          navigate('/login');
          return;
        }

        const response = await axios.post(
          `${API}/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        const user = response.data;
        toast.success(`Welcome, ${user.name}!`);

        if (user.role === 'admin') {
          navigate('/admin-dashboard', { state: { user }, replace: true });
        } else if (user.role === 'shopkeeper') {
          navigate('/shop-dashboard', { state: { user }, replace: true });
        } else {
          navigate('/dashboard', { state: { user }, replace: true });
        }
      } catch (error) {
        console.error('Auth error:', error);
        toast.error('Authentication failed');
        navigate('/login');
      }
    };

    processSession();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-xl font-medium mb-4">Authenticating...</div>
        <div className="text-muted">Please wait while we sign you in</div>
      </div>
    </div>
  );
}