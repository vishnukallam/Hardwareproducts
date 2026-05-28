import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../lib/currency';
import { PageLoader } from '../components/ui/LoadingSpinner';

const UPI_APPS = [
  { id: 'gpay',    name: 'Google Pay', icon: '🟢', color: 'from-green-600/20  border-green-500/30'  },
  { id: 'phonepe', name: 'PhonePe',   icon: '🟣', color: 'from-purple-600/20 border-purple-500/30' },
  { id: 'paytm',   name: 'Paytm',     icon: '🔵', color: 'from-blue-600/20   border-blue-500/30'   },
  { id: 'bhim',    name: 'BHIM',      icon: '🇮🇳', color: 'from-orange-600/20 border-orange-500/30' },
  { id: 'upi',     name: 'Other UPI', icon: '💳', color: 'from-slate-600/20  border-slate-500/30'  },
];

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/* ─── build a standard UPI deep-link per app ─── */
const buildUPILink = (appId, vpa, name, amountINR, note) => {
  const pa  = encodeURIComponent(vpa);
  const pn  = encodeURIComponent(name);
  const tn  = encodeURIComponent(note);
  const amt = Number(amountINR).toFixed(2);
  const base = `upi://pay?pa=${pa}&pn=${pn}&am=${amt}&cu=INR&tn=${tn}`;
  switch (appId) {
    case 'gpay':    return `tez://upi/pay?pa=${pa}&pn=${pn}&am=${amt}&cu=INR&tn=${tn}`;
    case 'phonepe': return `phonepe://pay?pa=${pa}&pn=${pn}&am=${amt}&cu=INR&tn=${tn}`;
    case 'paytm':   return `paytmmp://pay?pa=${pa}&pn=${pn}&am=${amt}&cu=INR&tn=${tn}`;
    default:        return base;
  }
};

/* ─── generate QR as data-URL using canvas (no extra library needed) ─── */
const generateQRDataUrl = async (text) => {
  // Use the free QR API — no library needed, works in all browsers
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(text)}&bgcolor=1A1A26&color=FFFFFF&margin=10`;
  return url; // return the URL directly, render as <img src>
};

const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const { clearCart } = useCartStore();

  const [order, setOrder]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [selectedApp, setSelectedApp]   = useState(null);
  const [rzpOrderId, setRzpOrderId]     = useState(null);
  const [qrUrl, setQrUrl]               = useState(null);
  const [qrLoading, setQrLoading]       = useState(false);
  const [paying, setPaying]             = useState(false);
  const [polling, setPolling]           = useState(false);
  const pollRef = useRef(null);
  const mobile  = isMobile();

  // ── Merchant VPA — replace with your real Razorpay VPA ──
  const MERCHANT_VPA  = 'nexushardware@razorpay';
  const MERCHANT_NAME = 'Nexus Hardware';

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

  const getOrCreateRzpOrder = async () => {
    if (rzpOrderId) return rzpOrderId;
    const { data } = await api.post('/payments/create-order', { orderId });
    setRzpOrderId(data.razorpayOrderId);
    return data.razorpayOrderId;
  };

  /* ─────────────────────────────────────────────────────────────
     DESKTOP: When user selects a UPI app →
     1. Create Razorpay order (to lock in the amount server-side)
     2. Build the UPI deep-link string (with amount pre-filled)
     3. Generate QR code from that string
     4. Show QR — user scans with their chosen UPI app
     5. Poll every 5s for payment confirmation
  ───────────────────────────────────────────────────────────── */
  const handleSelectApp = async (app) => {
    setSelectedApp(app);
    setQrUrl(null);
    if (mobile) return; // mobile has its own flow below

    setQrLoading(true);
    try {
      await getOrCreateRzpOrder(); // ensure order exists server-side

      const note    = `Order ${orderId.slice(0, 8)}`;
      const upiLink = buildUPILink(app.id, MERCHANT_VPA, MERCHANT_NAME, order.totalAmount, note);

      // Generate QR that encodes the UPI deep-link with pre-filled amount
      const qr = await generateQRDataUrl(upiLink);
      setQrUrl(qr);

      // Start polling — backend checks Razorpay for payment confirmation
      const id = rzpOrderId || (await getOrCreateRzpOrder());
      startPolling(id);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate QR. Check Razorpay credentials.');
    } finally {
      setQrLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     MOBILE: User taps "Open [App]" →
     1. Create Razorpay order server-side
     2. Build deep-link for the selected app with pre-filled amount
     3. Redirect to UPI app (e.g. Google Pay, PhonePe, Paytm)
     4. On return, poll for payment status
     Fallback: if app not installed → open Razorpay modal
  ───────────────────────────────────────────────────────────── */
  const handleMobilePay = async () => {
    if (!selectedApp || !order) return;
    setPaying(true);
    try {
      const id   = await getOrCreateRzpOrder();
      const note = `Order ${orderId.slice(0, 8)}`;
      const link = buildUPILink(selectedApp.id, MERCHANT_VPA, MERCHANT_NAME, order.totalAmount, note);

      // Redirect to UPI app
      window.location.href = link;

      // After user returns to browser (~4s), start polling
      setTimeout(() => {
        startPolling(id);
        setPaying(false);
      }, 4000);
    } catch (err) {
      console.error(err);
      // Fallback to Razorpay modal if deep-link fails
      try {
        const id = await getOrCreateRzpOrder();
        openRazorpayModal(id);
      } catch {
        toast.error('Failed to open payment app');
      }
      setPaying(false);
    }
  };

  /* Razorpay modal fallback — UPI only */
  const openRazorpayModal = (id) => {
    if (!window.Razorpay) { toast.error('Razorpay SDK not loaded'); return; }
    const rzp = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      order_id: id,
      name: MERCHANT_NAME,
      description: `Order #${orderId.slice(0, 8)}`,
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      prefill: { name: order.user?.name || '', email: order.user?.email || '' },
      theme: { color: '#7C4DFF' },
      config: {
        display: {
          blocks: { upi: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] } },
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
          toast.error('Verification failed. Contact support.');
        }
      },
      modal: { ondismiss: () => setPaying(false) }
    });
    rzp.on('payment.failed', () => { toast.error('Payment failed.'); setPaying(false); });
    rzp.open();
  };

  const startPolling = (rzpId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPolling(true);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      if (++attempts > 72) { // 6 min
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
          toast.success('Payment confirmed! 🎉');
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
    <div className="pt-16 sm:pt-20 min-h-screen page-enter">
      <div className="max-w-lg mx-auto px-4 py-6 sm:py-8">

        {/* Header */}
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-1">Complete Payment</h1>
        <p className="text-on-surface-variant font-body text-sm mb-6">
          Order <span className="font-mono text-primary">#{orderId.slice(0, 8)}</span>
        </p>

        {/* Amount card */}
        <div className="m3-card p-4 sm:p-5 mb-5 flex justify-between items-center">
          <div>
            <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider">Amount Due</p>
            <p className="font-display text-2xl sm:text-3xl font-black text-primary mt-1">
              {formatPrice(order.totalAmount, order.currency || 'INR')}
            </p>
          </div>
          <div className="text-right text-xs text-on-surface-variant font-body">
            <p>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
            <p className="mt-1">{order.address?.city}, {order.address?.country}</p>
          </div>
        </div>

        {/* UPI app selector */}
        <div className="m3-card p-4 sm:p-5 mb-5">
          <h2 className="font-display text-xs font-bold text-white mb-4 uppercase tracking-widest">
            {mobile ? 'Select App to Pay' : 'Select App — QR will appear below'}
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {UPI_APPS.map((app) => (
              <button
                key={app.id}
                onClick={() => handleSelectApp(app)}
                className={`flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-m3-lg border-2 transition-all duration-200 cursor-pointer
                  bg-gradient-to-b ${app.color} to-transparent
                  ${selectedApp?.id === app.id
                    ? 'border-primary shadow-glow-primary scale-105'
                    : 'border-transparent hover:border-primary/40'}`}
              >
                <span className="text-xl sm:text-2xl">{app.icon}</span>
                <span className="text-[10px] sm:text-xs font-body text-on-surface-variant text-center leading-tight">{app.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── DESKTOP: QR Code ── */}
        {!mobile && selectedApp && (
          <motion.div
            key={selectedApp.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="m3-card p-6 mb-5 text-center"
          >
            <h3 className="font-display text-sm font-bold text-white mb-1 uppercase tracking-wider">
              Scan with {selectedApp.name}
            </h3>
            <p className="text-xs text-on-surface-variant font-body mb-5">
              Open {selectedApp.name} → Scan QR → Amount pre-filled → Pay
            </p>

            {/* QR image */}
            <div className="flex justify-center mb-5">
              {qrLoading ? (
                <div className="w-64 h-64 rounded-m3-xl bg-surface-2 border border-primary/20 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-xs text-on-surface-variant font-body">Generating QR code...</p>
                </div>
              ) : qrUrl ? (
                <div className="p-3 bg-surface-1 rounded-m3-xl border-2 border-primary/40 inline-block"
                  style={{ boxShadow: '0 0 30px rgba(124,77,255,0.3)' }}>
                  <img
                    src={qrUrl}
                    alt={`Pay with ${selectedApp.name} — ₹${order.totalAmount}`}
                    className="w-56 h-56 rounded-m3-lg"
                    onError={() => toast.error('QR failed to load — check internet')}
                  />
                </div>
              ) : null}
            </div>

            {/* Amount reminder */}
            {qrUrl && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-m3-full bg-primary/10 border border-primary/20 mb-4">
                <span className="text-xs font-mono text-on-surface-variant">Amount:</span>
                <span className="text-sm font-display font-bold text-primary">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Polling indicator */}
            {polling && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                <p className="text-xs text-on-surface-variant font-body animate-pulse">
                  Waiting for payment confirmation...
                </p>
              </div>
            )}

            {/* Instruction steps */}
            {qrUrl && !polling && (
              <div className="mt-4 text-left space-y-2">
                {[
                  `Open ${selectedApp.name} on your phone`,
                  'Tap the Scan / QR icon',
                  `Point at QR — ₹${order.totalAmount.toLocaleString('en-IN')} is pre-filled`,
                  'Confirm with your UPI PIN',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-display font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-on-surface-variant font-body">{step}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── MOBILE: Open App button ── */}
        {mobile && selectedApp && (
          <motion.div
            key={selectedApp.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="m3-card p-5 mb-5 text-center"
          >
            <div className="text-4xl mb-3">{selectedApp.icon}</div>
            <h3 className="font-display text-base font-bold text-white mb-1">
              Pay with {selectedApp.name}
            </h3>
            <p className="text-xs text-on-surface-variant font-body mb-1">
              Amount: <span className="text-primary font-bold">₹{order.totalAmount.toLocaleString('en-IN')}</span>
            </p>
            <p className="text-xs text-on-surface-variant font-body mb-5">
              Tap below — {selectedApp.name} opens with amount pre-filled
            </p>

            <button
              onClick={handleMobilePay}
              disabled={paying || polling}
              className="m3-btn-primary w-full py-4 text-base"
            >
              {paying  ? '⏳ Opening app...'           :
               polling ? '⏳ Verifying payment...'     :
                         `Open ${selectedApp.name}  →`}
            </button>

            {polling && (
              <p className="text-xs text-on-surface-variant font-body mt-4 animate-pulse">
                Waiting for payment confirmation. Do not close this tab.
              </p>
            )}

            {/* Steps */}
            {!paying && !polling && (
              <div className="mt-5 text-left space-y-2">
                {[
                  `${selectedApp.name} opens automatically`,
                  `Amount ₹${order.totalAmount.toLocaleString('en-IN')} is pre-filled`,
                  'Enter your UPI PIN to pay',
                  'Return here — order confirms automatically',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-display font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-on-surface-variant font-body">{step}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Security note */}
        <p className="text-center text-xs text-on-surface-variant font-body mt-4">
          🔒 Encrypted · UPI PIN never stored · Powered by Razorpay
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;
