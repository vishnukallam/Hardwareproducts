import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatPrice, CURRENCIES } from '../lib/currency';
import toast from 'react-hot-toast';

const CartPage = () => {
  const { items, removeItem, updateQuantity, clearCart, currency, setCurrency, getTotalINR } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const totalINR = getTotalINR();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to checkout');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="pt-24 min-h-screen flex flex-col items-center justify-center px-4 page-enter">
        <div className="text-6xl mb-6">🛒</div>
        <h2 className="font-display text-2xl text-white mb-3">Your cart is empty</h2>
        <p className="text-on-surface-variant font-body mb-8">Add some amazing hardware to get started</p>
        <Link to="/products" className="m3-btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen page-enter">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl font-bold text-white">Shopping Cart</h1>
          <button onClick={clearCart} className="text-xs text-error hover:text-error/80 font-body transition-colors">
            Clear All
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="m3-card p-4 flex gap-4"
                >
                  {/* Image */}
                  <div className="w-20 h-20 rounded-m3-md overflow-hidden flex-shrink-0 bg-surface-2">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = `https://placehold.co/80x80/1A1A26/7C4DFF?text=IMG`; }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider">{item.product.brand}</p>
                    <h3 className="font-display text-sm font-semibold text-on-surface truncate">{item.product.name}</h3>
                    <p className="text-primary font-display font-bold mt-1">
                      {formatPrice(item.product.price * item.quantity, currency)}
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                      {/* Quantity */}
                      <div className="flex items-center gap-1 bg-surface-3 rounded-m3-full px-2 py-1 border border-outline/20">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center text-on-surface-variant hover:text-on-surface text-sm"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-xs font-mono">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center text-on-surface-variant hover:text-on-surface text-sm"
                          disabled={item.quantity >= item.product.stock}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-xs text-error hover:text-error/70 font-body transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="m3-card p-6 sticky top-24">
              <h2 className="font-display text-lg font-bold text-white mb-6">Order Summary</h2>

              {/* Currency selector */}
              <div className="mb-4">
                <label className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-2 block">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="m3-select w-full text-sm"
                >
                  {Object.entries(CURRENCIES).map(([code, { symbol, name, flag }]) => (
                    <option key={code} value={code}>{flag} {code} — {name}</option>
                  ))}
                </select>
              </div>

              {/* Line items */}
              <div className="flex flex-col gap-2 mb-4">
                {items.map(item => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-on-surface-variant font-body truncate max-w-[60%]">
                      {item.product.name} ×{item.quantity}
                    </span>
                    <span className="font-mono text-on-surface">
                      {formatPrice(item.product.price * item.quantity, currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 mb-6">
                <div className="flex justify-between items-baseline">
                  <span className="font-body text-on-surface-variant">Total</span>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold text-primary">
                      {formatPrice(totalINR, currency)}
                    </p>
                    {currency !== 'INR' && (
                      <p className="text-xs text-on-surface-variant font-mono">
                        ₹{totalINR.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button onClick={handleCheckout} className="m3-btn-primary w-full py-3.5">
                Proceed to Checkout
              </button>

              <Link to="/products" className="block text-center mt-3 text-sm text-on-surface-variant hover:text-primary transition-colors font-body">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
