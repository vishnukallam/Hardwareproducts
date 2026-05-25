import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import ProductCard from '../components/products/ProductCard';
import { PageLoader } from '../components/ui/LoadingSpinner';

const CATEGORIES = [
  { id: '', label: 'All Products' },
  { id: 'GPU', label: 'Graphics Cards 🎮' },
  { id: 'CPU', label: 'Processors 🔬' },
  { id: 'RAM', label: 'Memory 💾' },
  { id: 'COOLING_FAN', label: 'Cooling ❄️' },
];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      params.set('page', page);
      params.set('limit', '12');

      const { data } = await api.get(`/products?${params}`);
      setProducts(data.products || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, page]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) {
        setSearchParams(prev => { prev.set('page', '1'); return prev; });
      } else {
        fetchProducts();
      }
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const setCategory = (cat) => {
    const params = new URLSearchParams(searchParams);
    if (cat) params.set('category', cat);
    else params.delete('category');
    params.set('page', '1');
    setSearchParams(params);
  };

  const setPage = (p) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', p);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pt-20 min-h-screen page-enter">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            {category ? CATEGORIES.find(c => c.id === category)?.label : 'All Products'}
          </h1>
          <p className="text-on-surface-variant font-body">
            {pagination.total || 0} products available
          </p>
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <svg viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search products, brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="m3-input pl-9"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-m3-full text-sm font-body font-semibold transition-all duration-200
                ${category === cat.id
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'bg-surface-2 text-on-surface-variant border border-outline/30 hover:border-primary/50 hover:text-primary'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {loading ? (
          <PageLoader text="Loading products..." />
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-display text-xl text-on-surface mb-2">No products found</h3>
            <p className="text-on-surface-variant font-body">Try a different search or category</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="m3-btn-outline px-4 py-2 disabled:opacity-30"
                >
                  ← Prev
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-m3-full text-sm font-mono transition-all ${
                      p === page ? 'bg-primary text-white' : 'bg-surface-2 text-on-surface-variant hover:bg-surface-3'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                  className="m3-btn-outline px-4 py-2 disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
