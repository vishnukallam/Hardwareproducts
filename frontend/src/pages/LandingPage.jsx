import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import ProductCard from '../components/products/ProductCard';
import { useCartStore } from '../store/cartStore';

const CATEGORIES = [
  { id: 'GPU',         label: 'Graphics Cards', icon: '🎮', desc: 'RTX 40 Series & RX 7000',  color: 'from-purple-600/20 to-purple-900/10 border-purple-500/20' },
  { id: 'CPU',         label: 'Processors',     icon: '🔬', desc: 'Intel 14th Gen & Ryzen 7000', color: 'from-blue-600/20 to-blue-900/10 border-blue-500/20'   },
  { id: 'RAM',         label: 'Memory',         icon: '💾', desc: 'DDR4 & DDR5 Kits',          color: 'from-green-600/20 to-green-900/10 border-green-500/20'  },
  { id: 'COOLING_FAN', label: 'Cooling',        icon: '❄️', desc: 'Air & Liquid Cooling',      color: 'from-orange-600/20 to-orange-900/10 border-orange-500/20'},
];

const STATS = [
  { value: '50+', label: 'Products'  },
  { value: 'UPI', label: 'Payments'  },
  { value: '24h', label: 'Processing'},
  { value: '6',   label: 'Currencies'},
];

const LandingPage = () => {
  const { isAuthenticated } = useAuthStore();
  const { currency } = useCartStore();
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get('/products?limit=4')
      .then(({ data }) => setFeatured(data.products || []))
      .catch(() => {});
  }, []);

  return (
    <div className="pt-14 sm:pt-16 page-enter">

      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-20 sm:py-28 relative">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-[600px] h-72 sm:h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-4xl mx-auto relative z-10 w-full"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-m3-full bg-primary/10 border border-primary/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs font-mono text-primary tracking-widest uppercase">Premium PC Hardware Store</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-5 leading-none">
            POWER YOUR
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">
              BUILD
            </span>
          </h1>

          {/* Sub-text */}
          <p className="font-body text-base sm:text-lg text-on-surface-variant max-w-xl mx-auto mb-8 leading-relaxed px-2">
            Discover premium graphics cards, processors, RAM, and cooling solutions.
            Pay securely with UPI — Google Pay, PhonePe, Paytm and more.
          </p>

          {/* CTA buttons — stacked on mobile, side-by-side on sm+ */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center px-4 sm:px-0">
            <Link to="/products" className="m3-btn-primary w-full sm:w-auto px-8 py-3.5 text-base">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Browse Products
            </Link>
            {!isAuthenticated && (
              <Link to="/products" className="m3-btn-outline w-full sm:w-auto px-8 py-3.5 text-base">
                View Catalogue
              </Link>
            )}
          </div>
        </motion.div>

        {/* Stats — inline below buttons, not absolute */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-14 sm:mt-20 w-full max-w-lg mx-auto"
        >
          <div className="grid grid-cols-4 gap-2 sm:gap-6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-display text-lg sm:text-2xl font-bold text-primary">{value}</p>
                <p className="text-[10px] sm:text-xs font-body text-on-surface-variant uppercase tracking-wider leading-tight mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Categories ── */}
      <section className="py-12 sm:py-20 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">SHOP BY CATEGORY</h2>
          <p className="text-on-surface-variant font-body text-sm sm:text-base">
            Explore our curated selection of premium PC components
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={`/products?category=${cat.id}`}
                className={`block p-4 sm:p-6 rounded-m3-xl border bg-gradient-to-br ${cat.color} transition-all duration-300 hover:-translate-y-1 hover:shadow-m3-3 group`}
              >
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{cat.icon}</div>
                <h3 className="font-display text-xs sm:text-sm font-bold text-white mb-1 group-hover:text-primary transition-colors">{cat.label}</h3>
                <p className="text-xs text-on-surface-variant font-body hidden sm:block">{cat.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Featured Products ── */}
      {featured.length > 0 && (
        <section className="py-12 sm:py-20 px-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">FEATURED</h2>
              <p className="text-on-surface-variant font-body text-sm">Top-rated hardware for your next build</p>
            </div>
            <Link to="/products" className="m3-btn-text text-sm">View All →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── UPI highlight ── */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="m3-card p-8 sm:p-10 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
            <div className="relative z-10">
              <div className="flex justify-center gap-4 sm:gap-6 mb-6 text-2xl sm:text-3xl">
                <span>🟢</span><span>🟣</span><span>🔵</span><span>🇮🇳</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-3">SECURE UPI PAYMENTS</h2>
              <p className="text-on-surface-variant font-body text-sm sm:text-base max-w-lg mx-auto mb-6">
                Pay instantly with Google Pay, PhonePe, Paytm, or any UPI app.
                Desktop gets a scannable QR code. Mobile opens your chosen app directly.
              </p>
              <Link to="/products" className="m3-btn-primary">Start Shopping</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-6 px-4 text-center">
        <p className="font-display text-xs tracking-widest text-on-surface-variant">
          NEXUS HARDWARE © {new Date().getFullYear()} — PREMIUM PC COMPONENTS
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
