import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCartStore } from '../../store/cartStore';
import { formatPrice } from '../../lib/currency';

const CATEGORY_LABELS = {
  GPU: { label: 'Graphics Card', class: 'chip-gpu', icon: '🎮' },
  CPU: { label: 'Processor', class: 'chip-cpu', icon: '🔬' },
  RAM: { label: 'Memory', class: 'chip-ram', icon: '💾' },
  COOLING_FAN: { label: 'Cooling', class: 'chip-fan', icon: '❄️' },
};

const ProductCard = ({ product, index = 0 }) => {
  const { addItem, currency } = useCartStore();
  const cat = CATEGORY_LABELS[product.category] || { label: product.category, class: 'm3-chip bg-surface-3', icon: '📦' };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (product.stock <= 0) {
      toast.error('Out of stock');
      return;
    }
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/products/${product.id}`} className="block group">
        <div className="m3-card overflow-hidden h-full flex flex-col">
          {/* Image */}
          <div className="product-img-wrap">
            <img
              src={product.imageUrl}
              alt={product.name}
              onError={(e) => {
                e.target.src = `https://placehold.co/400x250/1A1A26/7C4DFF?text=${encodeURIComponent(product.name)}`;
              }}
            />
            {/* Category badge */}
            <div className="absolute top-3 left-3">
              <span className={cat.class}>
                {cat.icon} {cat.label}
              </span>
            </div>
            {/* Stock badge */}
            {product.stock <= 5 && product.stock > 0 && (
              <div className="absolute top-3 right-3">
                <span className="m3-chip bg-tertiary/20 text-tertiary-light border border-tertiary/30 text-xs">
                  Only {product.stock} left
                </span>
              </div>
            )}
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="font-display text-sm tracking-widest text-on-surface-variant">OUT OF STOCK</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-1 gap-3">
            <div className="flex-1">
              <p className="text-xs text-on-surface-variant font-mono uppercase tracking-wider">{product.brand}</p>
              <h3 className="font-display text-sm font-semibold text-on-surface mt-0.5 line-clamp-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <p className="text-xs text-on-surface-variant font-body mt-1.5 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Specs preview */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(product.specs).slice(0, 4).map(([key, val]) => (
                  <div key={key} className="bg-surface-3 rounded-m3-sm px-2 py-1">
                    <p className="text-xs text-on-surface-variant leading-none">{key}</p>
                    <p className="text-xs text-on-surface font-semibold truncate">{val}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Price + CTA */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <div>
                <p className="text-lg font-display font-bold text-primary">
                  {formatPrice(product.price, currency)}
                </p>
                {currency !== 'INR' && (
                  <p className="text-xs text-on-surface-variant">
                    ₹{product.price.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="m3-btn-tonal text-xs px-3 py-2"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
