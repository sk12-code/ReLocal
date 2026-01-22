import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function QRScanner() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let scanner;

    const initScanner = () => {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          const url = new URL(decodedText);
          const qrCodeId = url.pathname.split('/').pop();
          
          scanner.clear();
          toast.success('QR Code scanned!');
          
          fetch(`${process.env.REACT_APP_BACKEND_URL}/api/qr/scan/${qrCodeId}`)
            .then(res => res.json())
            .then(data => {
              navigate(`/products/${data.product_id}`);
            })
            .catch(err => {
              console.error('Scan error:', err);
              toast.error('Failed to load product');
            });
        },
        (error) => {
          // Ignore scanning errors (they happen continuously)
        }
      );

      setScanning(true);
    };

    initScanner();

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background" data-testid="qr-scanner">
      <nav className="bg-white border-b border-border sticky top-0 z-50">
        <div className="px-6 md:px-12 py-4">
          <Button 
            data-testid="back-btn"
            onClick={() => navigate('/dashboard')} 
            variant="ghost" 
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading text-4xl font-bold mb-4">Scan QR Code</h1>
          <p className="text-lg text-muted mb-8">
            Point your camera at a product QR code to discover and buy authentic local items
          </p>

          <Card className="p-6">
            <div id="qr-reader" className="w-full"></div>
          </Card>

          <div className="mt-8 text-center text-sm text-muted">
            <p>Make sure the QR code is clearly visible and well-lit</p>
          </div>
        </div>
      </div>
    </div>
  );
}