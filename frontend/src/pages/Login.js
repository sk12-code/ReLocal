import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';
import { API } from '@/App';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [returnUrl, setReturnUrl] = useState(null);

  useEffect(() => {
    // Check if there's a return URL stored (from product page checkout)
    const storedReturnUrl = localStorage.getItem('returnUrl');
    if (storedReturnUrl) {
      setReturnUrl(storedReturnUrl);
    }
  }, []);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    // If there's a return URL, store it before redirect
    if (returnUrl) {
      localStorage.setItem('returnUrl', returnUrl);
    }
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email, password }
        : { email, password, full_name: fullName || undefined };

      const response = await axios.post(`${API}${endpoint}`, payload, { withCredentials: true });

      const user = response.data;
      toast.success(isLogin ? 'Login successful!' : 'Registration successful!');

      // Clear return URL after successful auth
      localStorage.removeItem('returnUrl');

      // If there's a return URL, go back there (for checkout flow)
      if (returnUrl) {
        navigate(returnUrl, { replace: true });
        return;
      }

      if (user.role === 'admin') {
        navigate('/admin-dashboard', { state: { user }, replace: true });
      } else if (user.role === 'shopkeeper') {
        navigate('/shop-dashboard', { state: { user }, replace: true });
      } else {
        navigate('/dashboard', { state: { user }, replace: true });
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl border border-border p-12 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="font-heading text-4xl font-bold text-primary mb-2">ReLocal</h1>
            <p className="text-muted">{isLogin ? 'Sign in to continue' : 'Create your account'}</p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                data-testid="email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                data-testid="password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                minLength={6}
              />
            </div>
            {!isLogin && (
              <div>
                <Label htmlFor="fullName">Full Name <span className="text-muted text-xs">(optional - can be added later)</span></Label>
                <Input
                  id="fullName"
                  type="text"
                  data-testid="fullname-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
            )}
            <Button
              data-testid="email-auth-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 text-lg font-medium"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>

          <div className="flex items-center gap-4 mb-6">
            <Separator className="flex-1" />
            <span className="text-sm text-muted">OR</span>
            <Separator className="flex-1" />
          </div>

          <Button
            data-testid="google-login-btn"
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full border-2 rounded-full py-6 text-lg font-medium"
          >
            Continue with Google
          </Button>

          <div className="mt-6 text-center">
            <button
              data-testid="toggle-auth-mode-btn"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:text-primary/80 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              data-testid="back-home-btn"
              onClick={() => navigate('/')}
              className="text-muted hover:text-foreground transition-colors"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}