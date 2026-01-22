import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
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
            <p className="text-muted">Sign in to continue</p>
          </div>

          <Button
            data-testid="google-login-btn"
            onClick={handleGoogleLogin}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 text-lg font-medium"
          >
            Continue with Google
          </Button>

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