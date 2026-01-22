import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, QrCode, Globe, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border">
        <div className="px-6 md:px-12 lg:px-24 py-4 flex justify-between items-center">
          <div className="font-heading text-2xl font-bold text-primary">ReLocal</div>
          <Button 
            data-testid="login-btn"
            onClick={() => navigate('/login')} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 font-medium"
          >
            Get Started
          </Button>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 md:pb-32 px-6 md:px-12 lg:px-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-background to-background"></div>
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-6">
              Discover <span className="italic text-primary">Authentic</span> Local Treasures
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-muted mb-8">
              Scan, buy, and reorder unique products from local shops around the world. Your travel memories, delivered home.
            </p>
            <div className="flex gap-4">
              <Button 
                data-testid="get-started-hero-btn"
                onClick={() => navigate('/login')} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg font-medium shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95"
              >
                Start Exploring
              </Button>
              <Button 
                data-testid="become-seller-btn"
                onClick={() => navigate('/login')} 
                variant="outline" 
                className="border-2 border-primary/20 text-primary hover:bg-primary/5 rounded-full px-8 py-6 text-lg font-medium"
              >
                Become a Seller
              </Button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <img 
              src="https://images.unsplash.com/photo-1542166498816-dcf3df2db47e" 
              alt="Artisan pottery" 
              className="rounded-2xl shadow-2xl w-full h-[500px] object-cover"
            />
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-32 px-6 md:px-12 lg:px-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl md:text-5xl font-medium mb-4">How It Works</h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">Three simple steps to bring home authentic local products</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <QrCode className="w-12 h-12 text-primary" />,
                title: 'Scan & Discover',
                description: 'See a product you love in a local shop? Just scan the QR code to view details and buy instantly.'
              },
              {
                icon: <ShoppingBag className="w-12 h-12 text-secondary" />,
                title: 'Buy Once',
                description: 'Purchase products for pickup or delivery. Every item is saved to your travel memories.'
              },
              {
                icon: <Globe className="w-12 h-12 text-accent-foreground" />,
                title: 'Reorder Anytime',
                description: 'Love that artisan soap? Click "Buy Again" and get it shipped anywhere in the world.'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-background rounded-2xl p-8 border border-border shadow-sm hover:shadow-xl transition-all duration-500"
                data-testid={`feature-card-${index}`}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="font-heading text-2xl font-medium mb-3">{feature.title}</h3>
                <p className="text-muted leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1744893497775-b95d39c83d45" 
                alt="Shop owner" 
                className="rounded-2xl shadow-xl w-full h-[400px] object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-heading text-3xl md:text-5xl font-medium mb-6">For Local Businesses</h2>
              <p className="text-lg leading-relaxed text-muted mb-6">
                Reach travelers from around the world. Generate QR codes for your products, manage orders, and turn one-time customers into repeat buyers.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                  <span>Simple onboarding with instant QR code generation</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                  <span>Track orders and shipments in one dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                  <span>Analytics on repeat buyers and product popularity</span>
                </li>
              </ul>
              <Button 
                data-testid="join-seller-btn"
                onClick={() => navigate('/login')} 
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-full px-8 py-6 text-lg font-medium"
              >
                Join as Seller
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 md:px-12 lg:px-24 bg-foreground text-background">
        <div className="max-w-7xl mx-auto text-center">
          <div className="font-heading text-3xl font-bold mb-4">ReLocal</div>
          <p className="text-background/70">Connecting travelers with authentic local products</p>
          <p className="mt-4 text-sm text-background/50">© 2025 ReLocal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}