import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import ProductCard from '../components/products/ProductCard';
import { useCartStore } from '../store/cartStore';

const CATEGORIES = [
  { id: 'GPU', label: 'Graphics Cards', icon: '🎮', desc: 'RTX 40 Series & RX 7000', color: 'from-purple-600/20 to-purple-900/10 border-purple-500/20' },
  { id: 'CPU', label: 'Processors', icon: '🔬', desc: 'Intel 14th Gen & Ryzen 7000', color: 'from-blue-600/20 to-blue-900/10 border-blue-500/20' },
  { id: 'RAM', label: 'Memory', icon: '💾', desc: 'DDR4 & DDR5 Kits', color: 'from-green-600/20 to-green-900/10 border-green-500/20' },
  { id: 'COOLING_FAN', label: 'Cooling', icon: '❄️', desc: 'Air & Liquid Cooling', color: 'from-orange-600/20 to-orange-900/10 border-orange-500/20' },
];

const STATS = [
  { value: '50+', label: 'Premium Products' },
  { value: 'UPI', label: 'Secure Payments' },
  { value: '24h', label: 'Order Processing' },
  { value: '6', label: 'Currencies' },
];

const LandingPage = () => {
  const { isAuthenticated } = useAuthStore();
  const { currency } = useCartStore();
  const [featured, setFeatured] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get('/products?limit=4');
        setFeatured(data.products || []);
      } catch {}
    };
    fetchFeatured();
  }, []);

  return (
    <div className="pt-16 page-enter">
      {/* Hero */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        {/* Glowing orb behind hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-4xl mx-auto relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-m3-full bg-primary/10 border border-primary/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs font-mono text-primary tracking-widest uppercase">Premium PC Hardware Store</span>
          </div>

          <h1 className="font-display text-5xl sm:text-7xl font-black tracking-tight text-white mb-6 leading-none">
            POWER YOUR
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">
              BUILD
            </span>
          </h1>

          <p className="font-body text-lg text-on-surface-variant max-w-2xl mx-auto mb-8 leading-relaxed">
            Discover premium graphics cards, processors, RAM, and cooling solutions.
            Pay securely with UPI — Google Pay, PhonePe, Paytm, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="m3-btn-primary px-8 py-3.5 text-base">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Browse Products
            </Link>
            {!isAuthenticated && (
              <Link to="/products" className="m3-btn-outline px-8 py-3.5 text-base">
                View Catalogue
              </Link>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="absolute bottom-12 left-0 right-0 flex justify-center"
        >
          <div className="flex gap-8 sm:gap-16">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-display text-2xl font-bold text-primary">{value}</p>
                <p className="text-xs font-body text-on-surface-variant uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl font-bold text-white mb-3">SHOP BY CATEGORY</h2>
          <p className="text-on-surface-variant font-body">Explore our curated selection of premium PC components</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/products?category=${cat.id}`}
                className={`block p-6 rounded-m3-xl border bg-gradient-to-br ${cat.color} transition-all duration-300 hover:-translate-y-1 hover:shadow-m3-3 group`}
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <h3 className="font-display text-sm font-bold text-white mb-1 group-hover:text-primary transition-colors">{cat.label}</h3>
                <p className="text-xs text-on-surface-variant font-body">{cat.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-20 px-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl font-bold text-white mb-1">FEATURED</h2>
              <p className="text-on-surface-variant font-body">Top-rated hardware for your next build</p>
            </div>
            <Link to="/products" className="m3-btn-text">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* UPI Payment Highlight */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="m3-card p-10 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
            <div className="relative z-10">
              <div className="flex justify-center gap-6 mb-8 text-3xl">
                <span title="Google Pay">G</span>
                <span title="PhonePe">📱</span>
                <span title="Paytm">💳</span>
                <span title="BHIM">🇮🇳</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-3">SECURE UPI PAYMENTS</h2>
              <p className="text-on-surface-variant font-body max-w-lg mx-auto mb-6">
                Pay instantly using Google Pay, PhonePe, Paytm, or any UPI app.
                Desktop users get a QR code. Mobile users are redirected directly to their app.
              </p>
              <Link to="/products" className="m3-btn-primary">
                Start Shopping
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 text-center">
        <p className="font-display text-xs tracking-widest text-on-surface-variant">
          NEXUS HARDWARE © {new Date().getFullYear()} — PREMIUM PC COMPONENTS
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
