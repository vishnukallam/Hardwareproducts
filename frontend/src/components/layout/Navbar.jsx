import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { CURRENCIES } from '../../lib/currency';
import api from '../../lib/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Navbar = () => {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const { getItemCount, currency, setCurrency } = useCartStore();
  const [menuOpen, setMenuOpen]           = useState(false);
  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [scrolled, setScrolled]           = useState(false);
  const [sdkReady, setSdkReady]           = useState(false);
  const googleBtnRef   = useRef(null);
  const sdkInitialized = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Initialize Google SDK exactly once
  useEffect(() => {
    if (sdkInitialized.current || !GOOGLE_CLIENT_ID) return;
    const init = () => {
      if (!window.google?.accounts?.id) return false;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      sdkInitialized.current = true;
      setSdkReady(true);
      return true;
    };
    if (!init()) {
      const iv = setInterval(() => { if (init()) clearInterval(iv); }, 200);
      return () => clearInterval(iv);
    }
  }, []);

  // Render / clear button whenever auth state or sdk readiness changes
  useEffect(() => {
    if (!sdkReady || !googleBtnRef.current) return;
    if (isAuthenticated) {
      googleBtnRef.current.innerHTML = '';
      return;
    }
    googleBtnRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      type: 'standard',
      theme: 'filled_black',
      size: 'medium',
      shape: 'pill',
      text: 'signin_with',
      logo_alignment: 'left',
    });
  }, [sdkReady, isAuthenticated]);

  const handleGoogleCredential = async (response) => {
    try {
      const { data } = await api.post('/auth/google', { credential: response.credential });
      setAuth(data.user, data.accessToken);
      if (googleBtnRef.current) googleBtnRef.current.innerHTML = '';
      toast.success(`Welcome, ${data.user.name}! 🚀`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Sign-in failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    window.google?.accounts?.id?.disableAutoSelect();
    setUserMenuOpen(false);
    navigate('/');
    toast.success('Logged out successfully');
  };

  const cartCount = getItemCount();
  const navLinks = [
    { to: '/products',                      label: 'Browse'  },
    { to: '/products?category=GPU',         label: 'GPUs'    },
    { to: '/products?category=CPU',         label: 'CPUs'    },
    { to: '/products?category=RAM',         label: 'RAM'     },
    { to: '/products?category=COOLING_FAN', label: 'Cooling' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'nav-glass shadow-m3-3' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-m3-sm bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 sm:w-5 sm:h-5 text-white">
                <path d="M3 12L5 6H19L21 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="2" y="12" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="7" cy="16" r="1.5" fill="currentColor"/>
                <circle cx="17" cy="16" r="1.5" fill="currentColor"/>
                <path d="M9 16H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-display text-base sm:text-lg font-bold tracking-widest text-white group-hover:text-glow-primary transition-all">
              NEXUS
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-3 py-2 rounded-m3-md text-sm font-body font-semibold tracking-wide transition-all duration-200
                  ${location.pathname + location.search === to
                    ? 'text-primary bg-primary/10'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}
              >{label}</Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Currency — desktop only */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="hidden sm:block bg-surface-2 border border-outline/30 rounded-m3-md px-2 py-1.5 text-xs font-mono text-on-surface-variant focus:outline-none focus:border-primary cursor-pointer"
            >
              {Object.entries(CURRENCIES).map(([code, { flag }]) => (
                <option key={code} value={code}>{flag} {code}</option>
              ))}
            </select>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 rounded-m3-md hover:bg-white/5 transition-all">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-on-surface-variant" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-xs flex items-center justify-center font-mono">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Google Sign-In button — always in DOM, hidden via CSS when logged in */}
            <div
              ref={googleBtnRef}
              style={{
                display: isAuthenticated ? 'none' : 'block',
                minWidth: isAuthenticated ? '0' : '120px',
                minHeight: '36px',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            />

            {/* User avatar — only when logged in */}
            {isAuthenticated && user && (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-1.5 p-1 rounded-m3-full hover:bg-white/5 transition-all"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name}
                      className="w-7 h-7 rounded-full border border-primary/30"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-display">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:block text-xs font-body text-on-surface-variant max-w-[70px] truncate">
                    {user.name?.split(' ')[0]}
                  </span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-11 w-52 bg-surface-2 border border-white/10 rounded-m3-lg shadow-m3-4 overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-sm font-body font-semibold text-on-surface truncate">{user.name}</p>
                          <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link to="/orders" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-body text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all"
                          >
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
                              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                              <rect x="9" y="3" width="6" height="4" rx="1"/>
                            </svg>
                            My Orders
                          </Link>
                          <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-body text-error hover:bg-error/10 transition-all"
                          >
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
                              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                              <polyline points="16 17 21 12 16 7"/>
                              <line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(v => !v)}
              className="md:hidden p-2 rounded-m3-md hover:bg-white/5 flex-shrink-0"
              aria-label="Toggle menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block h-0.5 bg-on-surface-variant transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`block h-0.5 bg-on-surface-variant transition-all ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 bg-on-surface-variant transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-white/5"
            >
              <div className="py-2">
                {navLinks.map(({ to, label }) => (
                  <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-body font-semibold text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all"
                  >{label}</Link>
                ))}
                {/* Currency in mobile menu */}
                <div className="px-4 py-3 border-t border-white/5 mt-1">
                  <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-2">Currency</p>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-surface-3 border border-outline/30 rounded-m3-md px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
                  >
                    {Object.entries(CURRENCIES).map(([code, { flag, name }]) => (
                      <option key={code} value={code}>{flag} {code} — {name}</option>
                    ))}
                  </select>
                </div>
                {/* Sign out in mobile menu if logged in */}
                {isAuthenticated && user && (
                  <div className="px-4 py-3 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      {user.avatar && (
                        <img src={user.avatar} alt={user.name}
                          className="w-8 h-8 rounded-full border border-primary/30"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div>
                        <p className="text-sm font-body font-semibold text-on-surface">{user.name}</p>
                        <p className="text-xs text-on-surface-variant">{user.email}</p>
                      </div>
                    </div>
                    <Link to="/orders" onClick={() => setMenuOpen(false)}
                      className="block w-full text-center py-2 rounded-m3-md bg-surface-3 text-sm font-body text-on-surface-variant hover:text-on-surface mb-2 transition-all"
                    >My Orders</Link>
                    <button onClick={() => { setMenuOpen(false); handleLogout(); }}
                      className="w-full py-2 rounded-m3-md bg-error/10 text-sm font-body text-error transition-all"
                    >Sign Out</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
