import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../lib/currency';
import { PageLoader } from '../components/ui/LoadingSpinner';

const UPI_APPS = [
  { id: 'gpay',    name: 'Google Pay', icon: '🟢', color: 'border-green-500/40  bg-green-900/10'  },
  { id: 'phonepe', name: 'PhonePe',   icon: '🟣', color: 'border-purple-500/40 bg-purple-900/10' },
  { id: 'paytm',   name: 'Paytm',     icon: '🔵', color: 'border-blue-500/40   bg-blue-900/10'   },
  { id: 'bhim',    name: 'BHIM',      icon: '🇮🇳', color: 'border-orange-500/40 bg-orange-900/10' },
  { id: 'upi',     name: 'Other UPI', icon: '💳', color: 'border-slate-500/40  bg-slate-900/10'  },
];

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/* Build UPI deep-link with amount pre-filled */
const buildUPILink = (appId, vpa, merchantName, amountINR, note) => {
  const pa  = vpa;
  const pn  = encodeURIComponent(merchantName);
  const tn  = encodeURIComponent(note);
  const amt = Number(amountINR).toFixed(2);
  switch (appId) {
    case 'gpay':    return `tez://upi/pay?pa=${pa}&pn=${pn}&am=${amt}&cu=INR&tn=${tn}`;
    case 'phonepe': return `phonepe://pay?pa=${pa}&pn=${pn}&am=${amt}&cu=INR&tn=${tn}`;
    case 'paytm':   return `paytmmp://pay?pa=${pa}&pn=${pn}&am=${amt}&cu=INR&tn=${tn}`;
    default:        return `upi://pay?pa=${pa}&pn=${pn}&am=${amt}&cu=INR&tn=${tn}`;
  }
};

/* QR image URL — uses free public API, no library needed */
const getQRImageUrl = (text) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(text)}&bgcolor=12121A&color=FFFFFF&margin=12&ecc=M`;

const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const { clearCart } = useCartStore();

  const [order, setOrder]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [rzpOrderId, setRzpOrderId]   = useState(null);
  const [qrSrc, setQrSrc]             = useState(null);
  const [qrLoading, setQrLoading]     = useState(false);
  const [qrError, setQrError]         = useState(false);
  const [paying, setPaying]           = useState(false);
  const [polling, setPolling]         = useState(false);
  const pollRef = useRef(null);
  const mobile  = isMobile();

  // Replace with your actual Razorpay merchant UPI VPA
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
      // If order already has a razorpayOrderId (e.g. user refreshed page), reuse it
      if (data.razorpayOrderId) {
        setRzpOrderId(data.razorpayOrderId);
      }
    } catch {
      toast.error('Order not found');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  /* Create Razorpay order only once — reuse cached ID on re-renders / refreshes */
  const getOrCreateRzpOrder = async () => {
    if (rzpOrderId) return rzpOrderId;
    const { data } = await api.post('/payments/create-order', { orderId });
    setRzpOrderId(data.razorpayOrderId);
    return data.razorpayOrderId;
  };

  /* ── DESKTOP: select app → show QR immediately, no Razorpay call needed for QR ── */
  const handleSelectApp = async (app) => {
    setSelectedApp(app);
    setQrError(false);

    if (mobile) return; // mobile uses button flow below

    // Build the UPI link immediately from order data — no API call needed for QR
    const note    = `Nexus ${orderId.slice(0, 8)}`;
    const upiLink = buildUPILink(app.id, MERCHANT_VPA, MERCHANT_NAME, order.totalAmount, note);
    const qrImage = getQRImageUrl(upiLink);

    setQrLoading(true);
    setQrSrc(null);

    // Pre-load the QR image to detect errors before showing
    const img = new Image();
    img.onload  = () => { setQrSrc(qrImage); setQrLoading(false); };
    img.onerror = () => { setQrError(true);  setQrLoading(false); };
    img.src = qrImage;

    // Also create Razorpay order in background (needed for polling later)
    // — don't await, don't block QR display
    getOrCreateRzpOrder()
      .then((id) => startPolling(id))
      .catch((err) => {
        console.warn('Razorpay order creation failed (polling disabled):', err.message);
        // QR is still shown — user can scan and pay even if polling fails
      });
  };

  /* ── MOBILE: button tap → redirect to UPI app ── */
  const handleMobilePay = async () => {
    if (!selectedApp || !order) return;
    setPaying(true);
    try {
      const note    = `Nexus ${orderId.slice(0, 8)}`;
      const upiLink = buildUPILink(selectedApp.id, MERCHANT_VPA, MERCHANT_NAME, order.totalAmount, note);

      // Create Razorpay order in background for polling
      getOrCreateRzpOrder()
        .then((id) => {
          setTimeout(() => startPolling(id), 4000);
        })
        .catch(console.warn);

      // Redirect to UPI app
      window.location.href = upiLink;
      // Note: setPaying(false) not called here — page will reload/redirect
    } catch (err) {
      console.error(err);
      toast.error('Failed to open payment app. Try the Razorpay option below.');
      setPaying(false);
    }
  };

  /* Razorpay modal — fallback / alternative */
  const openRazorpayModal = async () => {
    if (!window.Razorpay) {
      toast.error('Razorpay SDK not loaded. Check your internet connection.');
      return;
    }
    try {
      const id = await getOrCreateRzpOrder();
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
    } catch (err) {
      console.error(err);
      toast.error(`Could not open Razorpay: ${err.response?.data?.error || err.message}`);
    }
  };

  const startPolling = (rzpId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setPolling(true);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      if (++attempts > 72) { clearInterval(pollRef.current); setPolling(false); return; }
      try {
        const { data } = await api.post('/payments/poll-status', { razorpayOrderId: rzpId });
        if (data.status === 'PAID') {
          clearInterval(pollRef.current); setPolling(false);
          clearCart();
          toast.success('Payment confirmed! 🎉');
          navigate(`/payment/success/${orderId}`, { replace: true });
        } else if (data.status === 'FAILED') {
          clearInterval(pollRef.current); setPolling(false);
          toast.error('Payment failed. Please try again.');
        }
      } catch {}
    }, 5000);
  };

  if (loading) return <PageLoader text="Loading payment..." />;
  if (!order)  return null;

  const amountFormatted = `₹${order.totalAmount.toLocaleString('en-IN')}`;

  return (
    <div className="pt-16 sm:pt-20 min-h-screen page-enter">
      <div className="max-w-lg mx-auto px-4 py-6 sm:py-8">

        {/* Header */}
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-1">Complete Payment</h1>
        <p className="text-on-surface-variant font-body text-sm mb-5">
          Order <span className="font-mono text-primary">#{orderId.slice(0, 8)}</span>
        </p>

        {/* Amount card */}
        <div className="m3-card p-4 sm:p-5 mb-5 flex justify-between items-center">
          <div>
            <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-1">Amount Due</p>
            <p className="font-display text-2xl sm:text-3xl font-black text-primary">{amountFormatted}</p>
          </div>
          <div className="text-right text-xs text-on-surface-variant font-body space-y-0.5">
            <p>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
            <p>{order.address?.city}, {order.address?.country}</p>
          </div>
        </div>

        {/* App selector */}
        <div className="m3-card p-4 sm:p-5 mb-5">
          <h2 className="font-display text-xs font-bold text-white mb-4 uppercase tracking-widest">
            {mobile ? 'Select UPI App to Pay' : 'Select App — QR appears below instantly'}
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {UPI_APPS.map((app) => (
              <button
                key={app.id}
                onClick={() => handleSelectApp(app)}
                className={`flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-m3-lg border-2 transition-all duration-200
                  ${selectedApp?.id === app.id
                    ? `${app.color} border-opacity-100 scale-105 shadow-glow-primary`
                    : 'border-transparent bg-surface-2 hover:border-primary/30 hover:bg-surface-3'
                  }`}
              >
                <span className="text-xl sm:text-2xl leading-none">{app.icon}</span>
                <span className="text-[9px] sm:text-[10px] font-body text-on-surface-variant text-center leading-tight">{app.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── DESKTOP QR section ── */}
        <AnimatePresence mode="wait">
          {!mobile && selectedApp && (
            <motion.div
              key={selectedApp.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="m3-card p-6 mb-5"
            >
              <h3 className="font-display text-sm font-bold text-white mb-0.5 uppercase tracking-wider text-center">
                Scan with {selectedApp.name}
              </h3>
              <p className="text-xs text-on-surface-variant font-body text-center mb-5">
                Open {selectedApp.name} → Scan QR → {amountFormatted} auto-filled → Pay
              </p>

              {/* QR Box */}
              <div className="flex justify-center mb-5">
                {qrLoading && (
                  <div className="w-60 h-60 rounded-m3-xl bg-surface-2 border border-primary/20 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-xs text-on-surface-variant font-body">Generating QR...</p>
                  </div>
                )}

                {!qrLoading && qrError && (
                  <div className="w-60 h-60 rounded-m3-xl bg-surface-2 border border-error/30 flex flex-col items-center justify-center gap-3 px-6 text-center">
                    <span className="text-3xl">⚠️</span>
                    <p className="text-xs text-error font-body">QR failed to load</p>
                    <p className="text-xs text-on-surface-variant font-body">Check your internet connection</p>
                    <button
                      onClick={() => handleSelectApp(selectedApp)}
                      className="mt-1 px-3 py-1.5 rounded-m3-full bg-primary/20 text-primary text-xs font-body hover:bg-primary/30 transition-all"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!qrLoading && !qrError && qrSrc && (
                  <div
                    className="p-3 bg-[#12121A] rounded-m3-xl border-2 border-primary/50 inline-block"
                    style={{ boxShadow: '0 0 40px rgba(124,77,255,0.35)' }}
                  >
                    <img
                      src={qrSrc}
                      alt={`Pay ${amountFormatted} via ${selectedApp.name}`}
                      className="w-56 h-56 rounded-m3-lg block"
                    />
                  </div>
                )}
              </div>

              {/* Amount pill */}
              {!qrLoading && !qrError && qrSrc && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-m3-full bg-primary/10 border border-primary/30">
                      <span className="text-xs font-mono text-on-surface-variant">Amount pre-filled:</span>
                      <span className="font-display font-bold text-primary">{amountFormatted}</span>
                    </div>
                  </div>

                  {/* Step guide */}
                  <div className="space-y-2 bg-surface-2 rounded-m3-lg p-4">
                    {[
                      `Open ${selectedApp.name} on your phone`,
                      'Tap Scan / QR icon',
                      `Point camera at QR — ${amountFormatted} auto-fills`,
                      'Enter UPI PIN to confirm payment',
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-display font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-xs text-on-surface-variant font-body">{step}</p>
                      </div>
                    ))}
                  </div>

                  {/* Polling indicator */}
                  {polling && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                      <p className="text-xs text-on-surface-variant font-body animate-pulse">
                        Waiting for payment confirmation...
                      </p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MOBILE: Open App button ── */}
        <AnimatePresence mode="wait">
          {mobile && selectedApp && (
            <motion.div
              key={selectedApp.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="m3-card p-5 mb-5 text-center"
            >
              <div className="text-4xl mb-3">{selectedApp.icon}</div>
              <h3 className="font-display text-base font-bold text-white mb-1">Pay with {selectedApp.name}</h3>
              <p className="text-xs text-on-surface-variant font-body mb-1">
                Amount: <span className="text-primary font-bold font-display">{amountFormatted}</span>
              </p>
              <p className="text-xs text-on-surface-variant font-body mb-5">
                Tap below — {selectedApp.name} opens with amount pre-filled
              </p>

              <button
                onClick={handleMobilePay}
                disabled={paying || polling}
                className="m3-btn-primary w-full py-4 text-base"
              >
                {paying  ? '⏳ Opening app...'        :
                 polling ? '⏳ Verifying payment...' :
                           `Open ${selectedApp.name} →`}
              </button>

              {polling && (
                <p className="text-xs text-on-surface-variant font-body mt-3 animate-pulse">
                  Keep this tab open. Confirming payment...
                </p>
              )}

              {!paying && !polling && (
                <div className="space-y-2 bg-surface-2 rounded-m3-lg p-4 mt-5 text-left">
                  {[
                    `${selectedApp.name} opens with ${amountFormatted} pre-filled`,
                    'Enter your UPI PIN to pay',
                    'Return here — order confirms automatically',
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-display font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-xs text-on-surface-variant font-body">{step}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Razorpay fallback (always visible) ── */}
        <div className="m3-card p-4 mb-5">
          <p className="text-xs text-on-surface-variant font-body text-center mb-3">
            {mobile ? 'App not installed? Use Razorpay UPI instead:' : 'Prefer to type your UPI ID instead of scanning?'}
          </p>
          <button onClick={openRazorpayModal} className="m3-btn-outline w-full py-3 text-sm">
            Pay via Razorpay UPI Checkout
          </button>
        </div>

        {/* Security */}
        <p className="text-center text-xs text-on-surface-variant font-body">
          🔒 Encrypted · UPI PIN never stored · Powered by Razorpay
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;
