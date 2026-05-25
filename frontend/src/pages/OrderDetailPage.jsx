import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { formatPrice } from '../lib/currency';
import { PageLoader } from '../components/ui/LoadingSpinner';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const STATUS_INFO = {
  PENDING: { label: 'Order Placed', icon: '📋', desc: 'Your order has been received' },
  CONFIRMED: { label: 'Payment Confirmed', icon: '✅', desc: 'Payment has been verified' },
  PROCESSING: { label: 'Processing', icon: '⚙️', desc: 'Your order is being prepared' },
  SHIPPED: { label: 'Shipped', icon: '🚚', desc: 'Your order is on its way' },
  DELIVERED: { label: 'Delivered', icon: '🏠', desc: 'Package delivered successfully' },
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
      } catch {
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return <PageLoader text="Loading order..." />;
  if (!order) return null;

  const currentStatusIdx = ORDER_STATUSES.indexOf(order.status);

  return (
    <div className="pt-20 min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/orders" className="text-on-surface-variant hover:text-primary transition-colors">
            ← Orders
          </Link>
          <span className="text-on-surface-variant">/</span>
          <span className="font-mono text-sm text-primary">#{order.id.slice(0, 12)}</span>
        </div>

        {/* Invoice card - printable */}
        <div id="invoice">
          {/* Order meta */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="m3-card p-6 mb-5"
          >
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-m3-xs bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-white">
                      <path d="M3 12L5 6H19L21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <rect x="2" y="12" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <span className="font-display text-sm font-bold text-white">NEXUS HARDWARE</span>
                </div>
                <p className="text-xs text-on-surface-variant font-mono">INVOICE</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-on-surface-variant">Date</p>
                <p className="text-sm font-mono text-on-surface">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-mono text-on-surface-variant uppercase">Order ID</p>
                <p className="font-mono text-xs text-primary mt-0.5">#{order.id.slice(0, 16)}</p>
              </div>
              {order.trackingId && (
                <div>
                  <p className="text-xs font-mono text-on-surface-variant uppercase">Tracking</p>
                  <p className="font-mono text-xs text-secondary mt-0.5">{order.trackingId}</p>
                </div>
              )}
              {order.paymentId && (
                <div>
                  <p className="text-xs font-mono text-on-surface-variant uppercase">Transaction</p>
                  <p className="font-mono text-xs text-on-surface mt-0.5 truncate">{order.paymentId}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Items */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="m3-card p-6 mb-5"
          >
            <h2 className="font-display text-sm font-bold text-white mb-4 uppercase tracking-wider">Items Ordered</h2>
            <div className="flex flex-col gap-4">
              {order.items?.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-14 h-14 rounded-m3-md overflow-hidden flex-shrink-0 bg-surface-2">
                    <img
                      src={item.product?.imageUrl}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://placehold.co/56x56/1A1A26/7C4DFF?text=IMG'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-on-surface text-sm truncate">{item.product?.name}</p>
                    <p className="text-xs text-on-surface-variant font-body mt-0.5">{item.product?.brand}</p>
                    <div className="flex justify-between items-baseline mt-1.5">
                      <span className="text-xs font-mono text-on-surface-variant">
                        {formatPrice(item.price, item.currency)} × {item.quantity}
                      </span>
                      <span className="font-mono text-sm font-semibold text-on-surface">
                        {formatPrice(item.price * item.quantity, item.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-4 mt-4 flex justify-between items-center">
              <span className="font-body text-on-surface-variant">Total</span>
              <span className="font-display text-lg font-bold text-primary">
                {formatPrice(order.totalAmount, order.currency)}
              </span>
            </div>
          </motion.div>

          {/* Address */}
          {order.address && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="m3-card p-6 mb-5"
            >
              <h2 className="font-display text-sm font-bold text-white mb-3 uppercase tracking-wider">Delivery Address</h2>
              <p className="font-body font-semibold text-on-surface">{order.address.fullName}</p>
              <p className="text-sm text-on-surface-variant font-body mt-1 leading-relaxed">
                {order.address.houseNumber}, {order.address.addressLine}
                {order.address.landmark && `, Near ${order.address.landmark}`}<br />
                {order.address.city}, {order.address.state} — {order.address.postalCode}<br />
                {order.address.country}
              </p>
              <p className="text-sm font-mono text-on-surface-variant mt-2">{order.address.phone}</p>
            </motion.div>
          )}
        </div>

        {/* Tracking timeline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="m3-card p-6 mb-6"
        >
          <h2 className="font-display text-sm font-bold text-white mb-5 uppercase tracking-wider">Order Tracking</h2>
          <div className="flex flex-col gap-0">
            {ORDER_STATUSES.map((status, idx) => {
              const info = STATUS_INFO[status];
              const isDone = idx < currentStatusIdx;
              const isActive = idx === currentStatusIdx;
              return (
                <div key={status} className={`flex items-start gap-4 ${idx < ORDER_STATUSES.length - 1 ? 'pb-6' : ''} relative`}>
                  {/* Vertical line */}
                  {idx < ORDER_STATUSES.length - 1 && (
                    <div className={`absolute left-5 top-10 w-0.5 h-full ${isDone ? 'bg-secondary/50' : 'bg-surface-3'}`} />
                  )}
                  {/* Dot */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-base transition-all
                    ${isActive ? 'bg-primary shadow-glow-primary' : isDone ? 'bg-secondary/20 border border-secondary' : 'bg-surface-3 border border-outline/30'}`}>
                    {info.icon}
                  </div>
                  <div className="pt-2">
                    <p className={`font-body font-semibold text-sm ${isActive ? 'text-on-surface' : isDone ? 'text-secondary' : 'text-on-surface-variant'}`}>
                      {info.label}
                    </p>
                    <p className="text-xs text-on-surface-variant font-body mt-0.5">{info.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handlePrint} className="m3-btn-primary flex-1 py-3">
            🖨 Print Invoice
          </button>
          <Link to="/products" className="m3-btn-outline flex-1 py-3 text-center">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
