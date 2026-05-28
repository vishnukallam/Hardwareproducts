import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../lib/currency';
import { PageLoader } from '../components/ui/LoadingSpinner';

const UPI_APPS = [
  { id: 'gpay',    name: 'Google Pay', icon: '🟢' },
  { id: 'phonepe', name: 'PhonePe',   icon: '🟣' },
  { id: 'paytm',   name: 'Paytm',     icon: '🔵' },
  { id: 'bhim',    name: 'BHIM',      icon: '🇮🇳' },
  { id: 'upi',     name: 'Other UPI', icon: '💳' },
];

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { clearCart } = useCartStore();
  const [order, setOrder]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [paying, setPaying]         = useState(false);
  const [polling, setPolling]       = useState(false);
  const [rzpOrderId, setRzpOrderId] = useState(null);
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

  // Create Razorpay order once, cache result
  const getOrCreateRzpOrder = async () => {
    if (rzpOrderId) return rzpOrderId;
    const { data } = await api.post('/payments/create-order', { orderId });
    setRzpOrderId(data.razorpayOrderId);
    return data.razorpayOrderId;
  };

  // Build correct UPI deep-link per app
  const buildUPILink = (appId, amountINR) => {
    // Use your actual Razorpay UPI VPA here
    const vpa  = 'nexushardware@razorpay';
    const name = encodeURIComponent('Nexus Hardware');
    const note = encodeURIComponent(`Order ${orderId.slice(0, 8)}`);
    const amt  = Number(amountINR).toFixed(2);

    const base = `upi://pay?pa=${vpa}&pn=${name}&am=${amt}&cu=INR&tn=${note}`;

    switch (appId) {
      case 'gpay':    return `tez://upi/pay?pa=${vpa}&pn=${name}&am=${amt}&cu=INR&tn=${note}`;
      case 'phonepe': return `phonepe://pay?pa=${vpa}&pn=${name}&am=${amt}&cu=INR&tn=${note}`;
      case 'paytm':   return `paytmmp://pay?pa=${vpa}&pn=${name}&am=${amt}&cu=INR&tn=${note}`;
      default:        return base;
    }
  };

  const handleSelectApp = async (app) => {
    setSelectedApp(app);
    if (mobile) return; // mobile shows "Open" button, no QR needed

    // Desktop — open Razorpay checkout with UPI only
    try {
      const id = await getOrCreateRzpOrder();
      openRazorpay(id);
    } catch (err) {
      console.error(err);
      toast.error('Failed to initialize payment. Check Razorpay key.');
    }
  };

  // Razorpay modal — UPI only, works both mobile & desktop
  const openRazorpay = (id) => {
    if (!window.Razorpay) {
      toast.error('Razorpay SDK not loaded. Check internet connection.');
      return;
    }
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      order_id: id,
      name: 'Nexus Hardware',
      description: `Order #${orderId.slice(0, 8)}`,
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      prefill: {
        name: order.user?.name || '',
        email: order.user?.email || '',
      },
      theme: { color: '#7C4DFF' },
      config: {
        display: {
          blocks: {
            upi: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] }
          },
          sequence: ['block.upi'],
          preferences: { show_default_blocks: false }
        }
      },
      handler: async (response) => {
        try {
          await api.post('/payments/verify', {
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
          });
          clearCart();
          toast.success('Payment successful! 🎉');
          navigate(`/payment/success/${orderId}`, { replace: true });
        } catch {
          toast.error('Payment verification failed. Contact support.');
        }
      },
      modal: { ondismiss: () => { setPaying(false); toast('Payment cancelled'); } }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', () => {
      toast.error('Payment failed. Please try again.');
      setPaying(false);
    });
    rzp.open();
  };

  // Mobile: try UPI deep-link first, fallback to Razorpay modal
  const handleMobilePay = async () => {
    if (!selectedApp || !order) return;
    setPaying(true);

    try {
      const id = await getOrCreateRzpOrder();
      const link = buildUPILink(selectedApp.id, order.totalAmount);

      // Try opening UPI app via deep link
      const opened = window.open(link, '_blank');

      // If browser blocked window.open or app not installed → fallback to Razorpay
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        openRazorpay(id);
        setPaying(false);
        return;
      }

      // Poll for payment after app redirect
      setTimeout(() => {
        startPolling(id);
        setPaying(false);
      }, 4000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to open payment app');
      setPaying(false);
    }
  };

  const startPolling = (rzpId) => {
    setPolling(true);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 60) { // 5 min
        clearInterval(pollRef.current);
        setPolling(false);
        return;
      }
      try {
        const { data } = await api.post('/payments/poll-status', { razorpayOrderId: rzpId });
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

  if (loading) return <PageLoader text="Loading payment..." />;
  if (!order)  return null;

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

        {/* UPI App selector */}
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

        {/* Action area */}
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="m3-card p-6 mb-6 text-center"
          >
            <div className="text-4xl mb-3">{selectedApp.icon}</div>
            <h3 className="font-display text-base font-bold text-white mb-2">
              Pay with {selectedApp.name}
            </h3>

            {mobile ? (
              <>
                <p className="text-xs text-on-surface-variant font-body mb-5">
                  Tap below to open {selectedApp.name} with payment pre-filled
                </p>
                <button
                  onClick={handleMobilePay}
                  disabled={paying || polling}
                  className="m3-btn-primary w-full py-3.5"
                >
                  {paying  ? 'Opening app...'          :
                   polling ? '⏳ Verifying payment...' :
                             `Open ${selectedApp.name}`}
                </button>
                {polling && (
                  <p className="text-xs text-on-surface-variant font-body mt-3 animate-pulse">
                    Waiting for payment confirmation...
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs text-on-surface-variant font-body mb-5">
                  A secure Razorpay UPI window will open — scan QR or enter UPI ID
                </p>
                <button
                  onClick={async () => {
                    try {
                      const id = await getOrCreateRzpOrder();
                      openRazorpay(id);
                    } catch {
                      toast.error('Failed to open payment');
                    }
                  }}
                  className="m3-btn-primary w-full py-3.5"
                >
                  Pay ₹{order.totalAmount.toLocaleString('en-IN')} via {selectedApp.name}
                </button>
              </>
            )}
          </motion.div>
        )}

        {/* Security note */}
        <p className="text-center text-xs text-on-surface-variant font-body mt-6">
          🔒 256-bit encrypted · Your UPI PIN is never stored · Powered by Razorpay
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;
