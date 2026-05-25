export const CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', rate: 1 },
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 0.012 },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 0.0095 },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺', rate: 0.011 },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', rate: 0.044 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', rate: 0.018 },
};

export const COUNTRIES = [
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  { code: 'AE', name: 'UAE', currency: 'AED', flag: '🇦🇪' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
  { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷' },
  { code: 'SG', name: 'Singapore', currency: 'USD', flag: '🇸🇬' },
  { code: 'CA', name: 'Canada', currency: 'USD', flag: '🇨🇦' },
  { code: 'JP', name: 'Japan', currency: 'USD', flag: '🇯🇵' },
];

export const convertPrice = (priceINR, currency) => {
  const rate = CURRENCIES[currency]?.rate || 1;
  return priceINR * rate;
};

export const formatPrice = (priceINR, currency = 'INR') => {
  const converted = convertPrice(priceINR, currency);
  const { symbol } = CURRENCIES[currency] || CURRENCIES.INR;

  return `${symbol}${converted.toLocaleString('en', {
    minimumFractionDigits: currency === 'INR' ? 0 : 2,
    maximumFractionDigits: currency === 'INR' ? 0 : 2
  })}`;
};

export const getExchangeRate = (currency) => {
  return CURRENCIES[currency]?.rate || 1;
};
