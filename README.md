# ⚡ NEXUS HARDWARE — Full-Stack Ecommerce

A production-ready UPI-only ecommerce platform for premium PC hardware components.

**Stack:** React + Vite · Node/Express · PostgreSQL (Neon) · Prisma ORM · Razorpay UPI  
**Deploy:** Vercel (frontend) · Render (backend) · Neon (database)  
**Auth:** Google OAuth 2.0 · JWT + Refresh Tokens (no Firebase)

---

## 📁 Project Structure

```
nexus-hardware/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # GamingBackground, LoadingSpinner
│   │   │   ├── layout/      # Navbar, ProtectedRoute
│   │   │   └── products/    # ProductCard
│   │   ├── pages/           # All page components
│   │   ├── store/           # Zustand (auth, cart)
│   │   ├── lib/             # api.js, currency.js
│   │   └── styles/          # globals.css (M3 + gaming theme)
│   └── vercel.json
│
└── backend/           # Node.js + Express
    ├── src/
    │   ├── routes/          # auth, products, orders, payments, addresses
    │   ├── middleware/       # auth.js (JWT verify)
    │   ├── lib/             # prisma.js, jwt.js
    │   └── seed.js          # 16 seeded products
    ├── prisma/
    │   └── schema.prisma
    └── render.yaml
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- [Google Cloud Console](https://console.cloud.google.com) OAuth 2.0 credentials
- [Razorpay](https://razorpay.com) account (test mode)

---

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure Backend Environment

```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env`:

```env
# Neon DB
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/nexus?sslmode=require"

# JWT (generate strong random strings)
JWT_SECRET="your-32-char-secret-here"
JWT_REFRESH_SECRET="your-32-char-refresh-secret"

# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

# Razorpay (test keys from dashboard)
RAZORPAY_KEY_ID="rzp_test_xxx"
RAZORPAY_KEY_SECRET="your-razorpay-secret"

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
```

---

### 3. Configure Frontend Environment

```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

---

### 4. Setup Database

```bash
cd backend
npx prisma db push        # Push schema to Neon
npx prisma generate       # Generate Prisma client
node src/seed.js          # Seed 16 hardware products
```

---

### 5. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

---

## 🌐 Deployment

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add Environment Variables:
   - `VITE_API_URL` = your Render backend URL
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_RAZORPAY_KEY_ID`
4. Deploy

### Backend → Render

1. Push `backend/` to GitHub
2. Create new **Web Service** on [Render](https://render.com)
3. Set Build Command: `npm install && npx prisma generate && npx prisma db push`
4. Set Start Command: `npm start`
5. Add all env vars from `.env.example`
6. Deploy

### Database → Neon

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project → copy the connection string
3. Set as `DATABASE_URL` in both Render and local `.env`

---

## 🔐 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select project → **APIs & Services** → **Credentials**
3. Create **OAuth 2.0 Client ID** (Web Application)
4. Add **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `https://your-app.vercel.app`
5. Copy Client ID → set as `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`

---

## 💳 Razorpay UPI Setup

1. Create account at [razorpay.com](https://razorpay.com)
2. Go to **Settings** → **API Keys** → Generate test keys
3. For live UPI, complete KYC and get live keys
4. UPI VPA: Set your merchant UPI VPA in `PaymentPage.jsx`:
   ```js
   const merchantVPA = 'yourbusiness@razorpay'; // ← update this
   ```

---

## 📦 Products Seeded

| Category | Products |
|----------|----------|
| 🎮 GPU | RTX 4090, RTX 4080 Super, RX 7900 XTX, RTX 4070 Ti Super |
| 🔬 CPU | i9-14900K, Ryzen 9 7950X, Ryzen 7 7800X3D, i5-14600K |
| 💾 RAM | G.Skill Trident Z5 32GB, Corsair 64GB, Kingston 16GB, Team 128GB |
| ❄️ Cooling | Noctua NH-D15, Corsair H150i 360mm, be quiet! DRP4, ARCTIC 240mm |

---

## 🛡️ Security

- JWT access tokens (15m) + HTTP-only refresh tokens (7d)
- Rate limiting (100 req/15min global, 20 for auth)
- Helmet.js security headers
- CORS restricted to allowed origins
- HTTPS enforced in production
- Payment: only transaction ID + status stored — no bank details, UPI PIN, or sensitive info
- Input validation via express-validator

---

## 💱 Supported Currencies

| Currency | Region |
|----------|--------|
| INR ₹ | India |
| USD $ | US / Singapore / Canada |
| GBP £ | United Kingdom |
| EUR € | Europe |
| AED د.إ | UAE |
| AUD A$ | Australia |

---

## 📄 License

MIT — Built for educational and production use.
=======
# HardwareProducts
>>>>>>> 76a4b63f435942e9542117e1cc57f13d4465aefc
