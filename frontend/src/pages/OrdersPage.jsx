import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { formatPrice } from '../lib/currency';
import { PageLoader } from '../components/ui/LoadingSpinner';

const STATUS_CHIP = {
  PENDING: 'chip-pending',
  CONFIRMED: 'chip-confirmed',
  PROCESSING: 'chip-confirmed',
  SHIPPED: 'chip-shipped',
  DELIVERED: 'chip-delivered',
  CANCELLED: 'chip-failed',
};

const PAYMENT_CHIP = {
  PENDING: 'chip-pending',
  PAID: 'chip-paid',
  FAILED: 'chip-failed',
  REFUNDED: 'chip-pending',
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/orders?page=${page}&limit=10`);
      setOrders(data.orders || []);
      setPagination(data.pagination || {});
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [page]);

  if (loading) return <PageLoader text="Loading orders..." />;

  return (
    <div className="pt-20 min-h-screen page-enter">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-white mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="font-display text-xl text-white mb-2">No orders yet</h3>
            <p className="text-on-surface-variant font-body mb-8">Start shopping to see your orders here</p>
            <Link to="/products" className="m3-btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/orders/${order.id}`} className="block">
                  <div className="m3-card p-5 hover:border-primary/30 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <p className="text-xs font-mono text-on-surface-variant">Order ID</p>
                        <p className="font-mono text-sm text-primary mt-0.5">#{order.id.slice(0, 12)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={STATUS_CHIP[order.status] || 'm3-chip bg-surface-3 text-on-surface-variant'}>
                          {order.status}
                        </span>
                        <span className={PAYMENT_CHIP[order.paymentStatus] || 'm3-chip bg-surface-3 text-on-surface-variant'}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="flex flex-col gap-1.5 mb-4">
                      {order.items?.slice(0, 2).map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-on-surface-variant font-body truncate max-w-[60%]">
                            {item.product?.name} ×{item.quantity}
                          </span>
                          <span className="font-mono text-on-surface text-xs">
                            {formatPrice(item.price * item.quantity, order.currency)}
                          </span>
                        </div>
                      ))}
                      {order.items?.length > 2 && (
                        <p className="text-xs text-on-surface-variant font-body">
                          +{order.items.length - 2} more item(s)
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <div>
                        <p className="font-display font-bold text-primary">
                          {formatPrice(order.totalAmount, order.currency)}
                        </p>
                        {order.trackingId && (
                          <p className="text-xs font-mono text-on-surface-variant mt-0.5">
                            {order.trackingId}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-on-surface-variant font-body">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-primary font-body mt-0.5">View details →</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-3 mt-6">
                <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="m3-btn-outline px-4 py-2 disabled:opacity-30">← Prev</button>
                <span className="flex items-center font-mono text-sm text-on-surface-variant px-3">
                  {page} / {pagination.pages}
                </span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.pages} className="m3-btn-outline px-4 py-2 disabled:opacity-30">Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
