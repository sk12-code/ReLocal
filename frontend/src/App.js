import '@/App.css';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';
import TouristDashboard from '@/pages/TouristDashboard';
import ShopkeeperDashboard from '@/pages/ShopkeeperDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import ProductDetail from '@/pages/ProductDetail';
import Checkout from '@/pages/Checkout';
import CheckoutSuccess from '@/pages/CheckoutSuccess';
import OrderHistory from '@/pages/OrderHistory';
import Profile from '@/pages/Profile';
import QRScanner from '@/pages/QRScanner';
import ShopProducts from '@/pages/ShopProducts';
import SellerOrders from '@/pages/SellerOrders';
import ShopInsights from '@/pages/ShopInsights';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export { API };

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.user) {
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, {
          withCredentials: true
        });
        if (response.data) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [location]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRouter() {
  const location = useLocation();
  
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><TouristDashboard /></ProtectedRoute>} />
      <Route path="/shop-dashboard" element={<ProtectedRoute><ShopkeeperDashboard /></ProtectedRoute>} />
      <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/products/:productId" element={<ProductDetail />} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/scan" element={<ProtectedRoute><QRScanner /></ProtectedRoute>} />
      <Route path="/shop/products" element={<ProtectedRoute><ShopProducts /></ProtectedRoute>} />
      <Route path="/shop/orders" element={<ProtectedRoute><SellerOrders /></ProtectedRoute>} />
      <Route path="/shop/insights" element={<ProtectedRoute><ShopInsights /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-center" />
      </BrowserRouter>
    </div>
  );
}

export default App;