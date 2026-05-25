import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import { formatPrice, getExchangeRate, COUNTRIES } from '../lib/currency';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const FIELDS = [
  { name: 'fullName', label: 'Full Name', placeholder: 'John Doe', type: 'text', required: true },
  { name: 'phone', label: 'Phone Number', placeholder: '+91 98765 43210', type: 'tel', required: true },
  { name: 'houseNumber', label: 'House / Flat / Block No.', placeholder: 'A-204', type: 'text', required: true },
  { name: 'addressLine', label: 'Street Address', placeholder: '123 Main Street, MG Road', type: 'text', required: true },
  { name: 'landmark', label: 'Nearby Landmark', placeholder: 'Near City Mall', type: 'text', required: false },
  { name: 'city', label: 'City', placeholder: 'Bengaluru', type: 'text', required: true },
  { name: 'state', label: 'State / Province', placeholder: 'Karnataka', type: 'text', required: true },
  { name: 'postalCode', label: 'Postal / ZIP Code', placeholder: '560001', type: 'text', required: true },
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, currency, getTotalINR, clearCart } = useCartStore();
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: '', phone: '', houseNumber: '', addressLine: '',
    landmark: '', city: '', state: '', country: 'India', postalCode: ''
  });
  const [errors, setErrors] = useState({});

  const totalINR = getTotalINR();

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/addresses');
      setSavedAddresses(data);
      if (data.length > 0) {
        setSelectedAddressId(data[0].id);
        setShowNewForm(false);
      } else {
        setShowNewForm(true);
      }
    } catch {}
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.phone.trim() || !/^[+]?[\d\s\-()\x20]{8,15}$/.test(form.phone)) e.phone = 'Valid phone number required';
    if (!form.houseNumber.trim()) e.houseNumber = 'House number is required';
    if (!form.addressLine.trim()) e.addressLine = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state.trim()) e.state = 'State is required';
    if (!form.country.trim()) e.country = 'Country is required';
    if (!form.postalCode.trim()) e.postalCode = 'Postal code is required';
    return e;
  };

  const handleSubmit = async () => {
    let addressId = selectedAddressId;

    if (showNewForm || !selectedAddressId) {
      const e = validate();
      if (Object.keys(e).length) { setErrors(e); return; }

      try {
        const { data } = await api.post('/addresses', form);
        addressId = data.id;
      } catch (err) {
        toast.error('Failed to save address');
        return;
      }
    }

    setSubmitting(true);
    try {
      const rate = getExchangeRate(currency);
      const { data: order } = await api.post('/orders', {
        addressId,
        currency,
        exchangeRate: rate,
        items: items.map(i => ({
          productId: i.product.id,
          quantity: i.quantity
        }))
      });

      navigate(`/payment/${order.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-20 min-h-screen page-enter">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-white mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Address section */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Saved addresses */}
            {savedAddresses.length > 0 && (
              <div className="m3-card p-5">
                <h2 className="font-display text-base font-bold text-white mb-4">Saved Addresses</h2>
                <div className="flex flex-col gap-3">
                  {savedAddresses.map(addr => (
                    <button
                      key={addr.id}
                      onClick={() => { setSelectedAddressId(addr.id); setShowNewForm(false); }}
                      className={`w-full text-left p-4 rounded-m3-lg border-2 transition-all duration-200 ${
                        selectedAddressId === addr.id && !showNewForm
                          ? 'border-primary bg-primary/10'
                          : 'border-outline/20 bg-surface-2 hover:border-primary/40'
                      }`}
                    >
                      <p className="font-body font-semibold text-on-surface text-sm">{addr.fullName}</p>
                      <p className="text-xs text-on-surface-variant font-body mt-0.5">
                        {addr.houseNumber}, {addr.addressLine}
                        {addr.landmark && `, Near ${addr.landmark}`}
                      </p>
                      <p className="text-xs text-on-surface-variant font-body">
                        {addr.city}, {addr.state} — {addr.postalCode}, {addr.country}
                      </p>
                      <p className="text-xs text-on-surface-variant font-mono mt-1">{addr.phone}</p>
                    </button>
                  ))}

                  <button
                    onClick={() => { setShowNewForm(true); setSelectedAddressId(null); }}
                    className={`w-full text-left p-4 rounded-m3-lg border-2 transition-all duration-200 ${
                      showNewForm
                        ? 'border-primary bg-primary/10'
                        : 'border-dashed border-outline/30 hover:border-primary/40'
                    }`}
                  >
                    <span className="text-sm font-body text-on-surface-variant">+ Add new address</span>
                  </button>
                </div>
              </div>
            )}

            {/* New address form */}
            {(showNewForm || savedAddresses.length === 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="m3-card p-5"
              >
                <h2 className="font-display text-base font-bold text-white mb-5">
                  {savedAddresses.length > 0 ? 'New Address' : 'Delivery Address'}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FIELDS.map(({ name, label, placeholder, type, required }) => (
                    <div key={name} className={name === 'addressLine' ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">
                        {label}{required && <span className="text-error ml-1">*</span>}
                      </label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={form[name]}
                        onChange={(e) => {
                          setForm(f => ({ ...f, [name]: e.target.value }));
                          if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
                        }}
                        className={`m3-input ${errors[name] ? 'border-error' : ''}`}
                      />
                      {errors[name] && <p className="text-xs text-error mt-1 font-body">{errors[name]}</p>}
                    </div>
                  ))}

                  {/* Country */}
                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Country<span className="text-error ml-1">*</span>
                    </label>
                    <select
                      value={form.country}
                      onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))}
                      className="m3-select"
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                      ))}
                      <option value="Other">🌍 Other</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order summary */}
          <div>
            <div className="m3-card p-5 sticky top-24">
              <h2 className="font-display text-base font-bold text-white mb-5">Order Summary</h2>
              <div className="flex flex-col gap-2 mb-4">
                {items.map(item => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-on-surface-variant font-body truncate max-w-[55%]">
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
                  <span className="text-on-surface-variant font-body">Total</span>
                  <p className="font-display text-lg font-bold text-primary">
                    {formatPrice(totalINR, currency)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-m3-md bg-secondary/5 border border-secondary/20 mb-4">
                <span className="text-xs font-body text-on-surface-variant">
                  🔒 UPI payment on next step
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="m3-btn-primary w-full py-3.5"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" /> Processing...
                  </span>
                ) : 'Proceed to Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
