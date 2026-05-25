import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../lib/currency';
import { PageLoader } from '../components/ui/LoadingSpinner';

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: '🟢', packageAndroid: 'com.google.android.apps.nbu.paisa.user', packageIOS: 'gpay' },
  { id: 'phonepe', name: 'PhonePe', icon: '🟣', packageAndroid: 'com.phonepe.app', packageIOS: 'phonepe' },
  { id: 'paytm', name: 'Paytm', icon: '🔵', packageAndroid: 'net.one97.paytm', packageIOS: 'paytmmp' },
  { id: 'bhim', name: 'BHIM', icon: '🇮🇳', packageAndroid: 'in.org.npci.upiapp', packageIOS: 'bhimupi' },
  { id: 'upi', name: 'Other UPI', icon: '💳', packageAndroid: null, packageIOS: null },
];

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { clearCart, currency } = useCartStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState(null);
  const [paying, setPaying] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef(null);
  const mobile = isMobile();

  useEffect(() => {
    fetchOrder();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      if (data.paymentStatus === 'PAID') {
        navigate(`/payment/success/${orderId}`, { replace: true });
        return;
      }
      setOrder(data);
    } catch {
      toast.error('Order not found');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const createRazorpayOrder = async () => {
    if (razorpayOrderId) return razorpayOrderId;
    const { data } = await api.post('/payments/create-order', { orderId });
    setRazorpayOrderId(data.razorpayOrderId);
    return data.razorpayOrderId;
  };

  // Build UPI deep link string
  const buildUPIString = (app, amount, rzpOrderId) => {
    const merchantVPA = 'nexushardware@razorpay'; // Replace with your actual VPA
    const amountINR = (amount / 100).toFixed(2); // Razorpay sends paise
    const note = `Order ${orderId.slice(0, 8)}`;
    const name = 'Nexus Hardware';

    let base = `upi://pay?pa=${merchantVPA}&pn=${encodeURIComponent(name)}&am=${amountINR}&cu=INR&tn=${encodeURIComponent(note)}`;

    if (app.id === 'gpay') base = `tez://upi/pay?pa=${merchantVPA}&pn=${encodeURIComponent(name)}&am=${amountINR}&cu=INR&tn=${encodeURIComponent(note)}`;
    if (app.id === 'phonepe') base = `phonepe://pay?pa=${merchantVPA}&pn=${encodeURIComponent(name)}&am=${amountINR}&cu=INR&tn=${encodeURIComponent(note)}`;
    if (app.id === 'paytm') base = `paytmmp://pay?pa=${merchantVPA}&pn=${encodeURIComponent(name)}&am=${amountINR}&cu=INR&tn=${encodeURIComponent(note)}`;

    return base;
  };

  const handleSelectApp = async (app) => {
    setSelectedApp(app);
    setQrDataUrl(null);

    try {
      const rzpId = await createRazorpayOrder();
      const upiString = buildUPIString(app, order.totalAmount * 100, rzpId);

      if (!mobile) {
        // Desktop: generate QR code
        setGeneratingQR(true);
        const qr = await QRCode.toDataURL(upiString, {
          width: 240,
          margin: 2,
          color: { dark: '#FFFFFF', light: '#1A1A26' },
          errorCorrectionLevel: 'M'
        });
        setQrDataUrl(qr);
        setGeneratingQR(false);

        // Start polling for payment completion
        startPolling(rzpId);
      }
    } catch (err) {
      toast.error('Failed to initialize payment');
      setGeneratingQR(false);
    }
  };

  const handleMobilePay = async () => {
    if (!selectedApp || !order) return;
    setPaying(true);
    try {
      const rzpId = razorpayOrderId || await createRazorpayOrder();
      const upiString = buildUPIString(selectedApp, order.totalAmount * 100, rzpId);
      window.location.href = upiString;

      // After redirect, poll for status when user returns
      setTimeout(() => {
        startPolling(rzpId);
        setPaying(false);
      }, 3000);
    } catch {
      toast.error('Failed to open payment app');
      setPaying(false);
    }
  };

  const startPolling = (rzpOrderId) => {
    setPolling(true);
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes

    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(pollRef.current);
        setPolling(false);
        return;
      }
      try {
        const { data } = await api.post('/payments/poll-status', { razorpayOrderId: rzpOrderId });
        if (data.status === 'PAID') {
          clearInterval(pollRef.current);
          setPolling(false);
          clearCart();
          toast.success('Payment successful! 🎉');
          navigate(`/payment/success/${orderId}`, { replace: true });
        } else if (data.status === 'FAILED') {
          clearInterval(pollRef.current);
          setPolling(false);
          toast.error('Payment failed. Please try again.');
        }
      } catch {}
    }, 5000);
  };

  // Razorpay checkout flow (fallback for non-UPI or full checkout)
  const handleRazorpayCheckout = async () => {
    try {
      const rzpId = razorpayOrderId || await createRazorpayOrder();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: rzpId,
        name: 'Nexus Hardware',
        description: `Order #${orderId.slice(0, 8)}`,
        amount: order.totalAmount * 100,
        currency: 'INR',
        prefill: { name: order.user?.name, email: order.user?.email },
        theme: { color: '#7C4DFF' },
        method: { upi: true, card: false, netbanking: false, wallet: false, emi: false },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            clearCart();
            toast.success('Payment verified! 🎉');
            navigate(`/payment/success/${orderId}`, { replace: true });
          } catch {
            toast.error('Payment verification failed');
          }
        },
        modal: { ondismiss: () => toast('Payment cancelled') }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error('Failed to open payment');
    }
  };

  if (loading) return <PageLoader text="Loading payment..." />;
  if (!order) return null;

  return (
    <div className="pt-20 min-h-screen page-enter">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-white mb-2">Complete Payment</h1>
        <p className="text-on-surface-variant font-body mb-8">
          Order <span className="font-mono text-primary">#{orderId.slice(0, 8)}</span>
        </p>

        {/* Amount */}
        <div className="m3-card p-5 mb-6 flex justify-between items-center">
          <div>
            <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider">Amount Due</p>
            <p className="font-display text-2xl font-black text-primary mt-1">
              {formatPrice(order.totalAmount, order.currency || 'INR')}
            </p>
          </div>
          <div className="text-right text-xs text-on-surface-variant font-body">
            <p>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
            <p className="mt-1">{order.address?.city}, {order.address?.country}</p>
          </div>
        </div>

        {/* UPI app selector */}
        <div className="m3-card p-5 mb-6">
          <h2 className="font-display text-sm font-bold text-white mb-4 uppercase tracking-wider">
            Select UPI App
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {UPI_APPS.map((app) => (
              <button
                key={app.id}
                onClick={() => handleSelectApp(app)}
                className={`upi-btn ${selectedApp?.id === app.id ? 'selected' : ''}`}
              >
                <span className="text-2xl">{app.icon}</span>
                <span className="text-xs font-body text-on-surface-variant text-center leading-tight">{app.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* QR / Mobile Pay */}
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="m3-card p-5 mb-6"
          >
            {mobile ? (
              /* Mobile: direct redirect */
              <div className="text-center">
                <div className="text-4xl mb-3">{selectedApp.icon}</div>
                <h3 className="font-display text-base font-bold text-white mb-2">
                  Pay with {selectedApp.name}
                </h3>
                <p className="text-xs text-on-surface-variant font-body mb-5">
                  Tap below to open {selectedApp.name} with payment pre-filled
                </p>
                <button
                  onClick={handleMobilePay}
                  disabled={paying || polling}
                  className="m3-btn-primary w-full py-3.5"
                >
                  {paying ? 'Opening...' : polling ? '⏳ Verifying payment...' : `Open ${selectedApp.name}`}
                </button>
                {polling && (
                  <p className="text-xs text-on-surface-variant font-body mt-3 animate-pulse">
                    Waiting for payment confirmation...
                  </p>
                )}
              </div>
            ) : (
              /* Desktop: QR code */
              <div className="text-center">
                <h3 className="font-display text-base font-bold text-white mb-1">
                  Scan with {selectedApp.name}
                </h3>
                <p className="text-xs text-on-surface-variant font-body mb-5">
                  Open {selectedApp.name} on your phone → Scan QR → Pay
                </p>

                <div className="flex justify-center mb-5">
                  {generatingQR ? (
                    <div className="w-60 h-60 bg-surface-2 rounded-m3-lg flex items-center justify-center">
                      <div className="text-on-surface-variant font-body text-sm animate-pulse">Generating QR...</div>
                    </div>
                  ) : qrDataUrl ? (
                    <div className="p-3 bg-surface-1 rounded-m3-lg border border-primary/30 inline-block">
                      <img src={qrDataUrl} alt="UPI QR Code" className="w-56 h-56 rounded-m3-md" />
                    </div>
                  ) : null}
                </div>

                {polling && (
                  <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant font-body animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                    Waiting for payment confirmation...
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Alternative: Razorpay UPI checkout */}
        <div className="text-center">
          <p className="text-xs text-on-surface-variant font-body mb-3">Or use Razorpay secure checkout</p>
          <button
            onClick={handleRazorpayCheckout}
            className="m3-btn-outline w-full py-3"
          >
            Pay via Razorpay UPI
          </button>
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-on-surface-variant font-body mt-6">
          🔒 256-bit encrypted · Your UPI PIN is never stored · Powered by Razorpay
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;
