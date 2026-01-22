import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('checking');
  const hasPolled = useRef(false);

  useEffect(() => {
    if (hasPolled.current) return;
    hasPolled.current = true;

    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      toast.error('Invalid session');
      navigate('/dashboard');
      return;
    }

    pollPaymentStatus(sessionId);
  }, [location, navigate]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(`${API}/checkout/status/${sessionId}`, {
        withCredentials: true
      });

      if (response.data.payment_status === 'paid') {
        setStatus('success');
        localStorage.removeItem('cart');
        return;
      } else if (response.data.status === 'expired') {
        setStatus('failed');
        return;
      }

      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6" data-testid="checkout-success">
      <Card className="max-w-md w-full p-12 text-center">
        {status === 'checking' && (
          <>
            <Loader className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
            <h1 className="font-heading text-2xl font-bold mb-2">Processing Payment</h1>
            <p className="text-muted">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-secondary mx-auto mb-6" />
            <h1 className="font-heading text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted mb-8">Your order has been confirmed. Thank you for your purchase!</p>
            <div className="space-y-3">
              <Button
                data-testid="view-orders-btn"
                onClick={() => navigate('/orders')}
                className="w-full bg-primary hover:bg-primary/90 rounded-full"
              >
                View Orders
              </Button>
              <Button
                data-testid="continue-shopping-btn"
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="w-full rounded-full"
              >
                Continue Shopping
              </Button>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="text-destructive text-6xl mb-6">✗</div>
            <h1 className="font-heading text-3xl font-bold mb-2">Payment Failed</h1>
            <p className="text-muted mb-8">Something went wrong. Please try again.</p>
            <Button
              data-testid="try-again-btn"
              onClick={() => navigate('/dashboard')}
              className="w-full bg-primary hover:bg-primary/90 rounded-full"
            >
              Back to Dashboard
            </Button>
          </>
        )}

        {status === 'timeout' && (
          <>
            <div className="text-muted text-6xl mb-6">⏱</div>
            <h1 className="font-heading text-3xl font-bold mb-2">Payment Pending</h1>
            <p className="text-muted mb-8">We're still processing your payment. Check your orders for updates.</p>
            <Button
              data-testid="check-orders-btn"
              onClick={() => navigate('/orders')}
              className="w-full bg-primary hover:bg-primary/90 rounded-full"
            >
              Check Orders
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}