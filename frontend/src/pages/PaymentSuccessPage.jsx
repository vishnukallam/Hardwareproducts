import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { formatPrice } from '../lib/currency';
import { PageLoader } from '../components/ui/LoadingSpinner';

const ORDER_STEPS = [
  { key: 'PENDING', label: 'Order Placed', icon: '📋', done: true },
  { key: 'CONFIRMED', label: 'Payment Confirmed', icon: '✅', done: true },
  { key: 'PROCESSING', label: 'Processing', icon: '⚙️' },
  { key: 'SHIPPED', label: 'Shipped', icon: '🚚' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🏠' },
];

const getStepState = (stepKey, orderStatus) => {
  const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const stepIdx = statusOrder.indexOf(stepKey);
  const currentIdx = statusOrder.indexOf(orderStatus);
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
};

const PaymentSuccessPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        setOrder(data);
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, [orderId]);

  const handlePrint = () => window.print();

  if (loading) return <PageLoader text="Loading order..." />;

  return (
    <div className="pt-20 min-h-screen page-enter">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 rounded-full bg-secondary/10 border-2 border-secondary flex items-center justify-center mx-auto mb-4"
            style={{ boxShadow: '0 0 40px rgba(3,218,198,0.4)' }}>
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="font-display text-2xl font-black text-white mb-2">Payment Successful!</h1>
          <p className="text-on-surface-variant font-body">
            Your order is confirmed and being processed
          </p>
        </motion.div>

        {/* Order details card */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="m3-card p-5 mb-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-mono text-on-surface-variant uppercase">Order ID</p>
                <p className="font-mono text-sm text-primary mt-0.5">#{order.id.slice(0, 12)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-on-surface-variant uppercase">Tracking ID</p>
                <p className="font-mono text-sm text-secondary mt-0.5">{order.trackingId || '—'}</p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 mb-4">
              <div className="flex flex-col gap-2">
                {order.items?.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-on-surface-variant font-body truncate max-w-[60%]">
                      {item.product?.name} ×{item.quantity}
                    </span>
                    <span className="font-mono text-on-surface">
                      {formatPrice(item.price * item.quantity, order.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 flex justify-between items-center">
              <span className="font-body text-on-surface-variant">Total Paid</span>
              <span className="font-display text-lg font-bold text-primary">
                {formatPrice(order.totalAmount, order.currency)}
              </span>
            </div>

            {order.paymentId && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-xs font-mono text-on-surface-variant">
                  Transaction ID: <span className="text-on-surface">{order.paymentId}</span>
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Delivery address */}
        {order?.address && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="m3-card p-5 mb-6"
          >
            <h2 className="font-display text-sm font-bold text-white mb-3 uppercase tracking-wider">
              Delivery To
            </h2>
            <p className="font-body font-semibold text-on-surface text-sm">{order.address.fullName}</p>
            <p className="text-xs text-on-surface-variant font-body mt-1">
              {order.address.houseNumber}, {order.address.addressLine}
              {order.address.landmark && `, Near ${order.address.landmark}`}<br />
              {order.address.city}, {order.address.state} — {order.address.postalCode}<br />
              {order.address.country} · {order.address.phone}
            </p>
          </motion.div>
        )}

        {/* Order tracking */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="m3-card p-5 mb-6"
          >
            <h2 className="font-display text-sm font-bold text-white mb-5 uppercase tracking-wider">
              Order Tracking
            </h2>
            <div className="flex flex-col gap-0">
              {ORDER_STEPS.map((step, i) => {
                const state = getStepState(step.key, order.status);
                return (
                  <div key={step.key} className="track-step pb-5">
                    <div className={`track-dot ${state}`}>
                      <span className="text-sm">{step.icon}</span>
                    </div>
                    <div className="pt-1.5 ml-1">
                      <p className={`font-body font-semibold text-sm ${state === 'pending' ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                        {step.label}
                      </p>
                      {state === 'active' && (
                        <p className="text-xs text-primary font-body mt-0.5">Current status</p>
                      )}
                      {state === 'done' && (
                        <p className="text-xs text-secondary font-body mt-0.5">Completed</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link to="/orders" className="m3-btn-primary flex-1 py-3 text-center">
            View All Orders
          </Link>
          <button onClick={handlePrint} className="m3-btn-outline flex-1 py-3">
            Print Invoice
          </button>
          <Link to="/products" className="m3-btn-text flex-1 py-3 text-center">
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
