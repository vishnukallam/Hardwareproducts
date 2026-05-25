import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../lib/currency';
import { PageLoader } from '../components/ui/LoadingSpinner';

const CATEGORY_LABELS = {
  GPU: { label: 'Graphics Card', icon: '🎮' },
  CPU: { label: 'Processor', icon: '🔬' },
  RAM: { label: 'Memory', icon: '💾' },
  COOLING_FAN: { label: 'Cooling', icon: '❄️' },
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, currency } = useCartStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch {
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    addItem(product, quantity);
    toast.success(`${product.name} added to cart!`);
  };

  const handleBuyNow = () => {
    if (!product || product.stock <= 0) return;
    addItem(product, quantity);
    navigate('/cart');
  };

  if (loading) return <PageLoader text="Loading product..." />;
  if (!product) return null;

  const cat = CATEGORY_LABELS[product.category] || { label: product.category, icon: '📦' };

  return (
    <div className="pt-20 min-h-screen page-enter">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-mono text-on-surface-variant mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
          <span>/</span>
          <span className="text-on-surface">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="rounded-m3-xl overflow-hidden bg-surface-1 border border-white/5 aspect-video relative">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = `https://placehold.co/800x500/1A1A26/7C4DFF?text=${encodeURIComponent(product.name)}`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-5"
          >
            {/* Category + Brand */}
            <div className="flex items-center gap-3">
              <span className="m3-chip bg-surface-3 text-on-surface-variant border border-white/10">
                {cat.icon} {cat.label}
              </span>
              <span className="text-xs font-mono text-on-surface-variant uppercase tracking-widest">{product.brand}</span>
            </div>

            {/* Name */}
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
              {product.name}
            </h1>

            {/* Description */}
            <p className="text-on-surface-variant font-body leading-relaxed">
              {product.description}
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-black text-primary text-glow-primary">
                {formatPrice(product.price, currency)}
              </span>
              {currency !== 'INR' && (
                <span className="text-sm text-on-surface-variant font-mono">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-secondary' : 'bg-error'} animate-pulse`} />
              <span className="text-sm font-body text-on-surface-variant">
                {product.stock > 0 ? `${product.stock} units in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Quantity */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-body text-on-surface-variant">Quantity:</span>
                <div className="flex items-center gap-2 bg-surface-2 rounded-m3-full border border-outline/30 px-1 py-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 rounded-full hover:bg-surface-3 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-mono text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-7 h-7 rounded-full hover:bg-surface-3 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="m3-btn-primary flex-1 py-3.5"
              >
                Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="m3-btn-tonal flex-1 py-3.5"
              >
                Add to Cart
              </button>
            </div>

            {/* UPI badge */}
            <div className="flex items-center gap-2 p-3 rounded-m3-md bg-secondary/5 border border-secondary/20">
              <span className="text-secondary text-sm">🔒</span>
              <span className="text-xs font-body text-on-surface-variant">
                Secure UPI payment — Google Pay, PhonePe, Paytm & more
              </span>
            </div>
          </motion.div>
        </div>

        {/* Specs */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <h2 className="font-display text-xl font-bold text-white mb-6">SPECIFICATIONS</h2>
            <div className="m3-card p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1 p-3 bg-surface-2 rounded-m3-md">
                    <span className="text-xs font-mono text-on-surface-variant uppercase tracking-wider">{key}</span>
                    <span className="text-sm font-body font-semibold text-on-surface">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
