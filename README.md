# Darshan Cloth Shop - E-Commerce App

A modern, beautiful e-commerce application for ethnic wear built with Next.js, React, and Tailwind CSS.

## ✨ Features

### Customer Features
- 🛍️ **Product Catalog** - Browse products by category with filters and sorting
- 🛒 **Shopping Cart** - Add/remove items, update quantities with persistent storage
- 💳 **Checkout** - Complete checkout flow with multiple payment options
- ❤️ **Wishlist** - Save favorite products for later
- 👤 **User Account** - Profile management, order history, saved addresses
- 🔍 **Search** - Find products quickly
- 📱 **Responsive Design** - Works beautifully on all devices

### Technical Features
- ⚡ **Next.js 14** - React framework with App Router
- 🎨 **Tailwind CSS** - Utility-first styling
- 📦 **Zustand** - Lightweight state management
- 🖼️ **Next/Image** - Optimized image loading
- 🔤 **Google Fonts** - Custom typography (Playfair Display + Outfit)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Navigate to project directory**
   ```bash
   cd /Users/kumar.mukesh/Documents/Personal/Darshan
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
Darshan/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── products/          # Products pages
│   │   ├── checkout/          # Checkout page
│   │   ├── account/           # Account page
│   │   ├── wishlist/          # Wishlist page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── ProductCard.tsx
│   │   └── CartSidebar.tsx
│   ├── data/                  # Sample data
│   │   └── products.ts
│   └── store/                 # State management
│       └── cartStore.ts
├── public/                    # Static assets
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🎨 Color Scheme

The app uses a warm, elegant color palette:
- **Primary**: Rich terracotta red (#e06456)
- **Accent**: Earthy beige/brown tones
- **Background**: Soft cream (#f6f5f0)

## 📱 Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with featured products |
| Products | `/products` | Product listing with filters |
| Product Detail | `/products/[id]` | Single product view |
| Checkout | `/checkout` | Cart review and payment |
| Account | `/account` | User profile and orders |
| Wishlist | `/wishlist` | Saved products |

## 🛠️ Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🔜 Future Enhancements

- [ ] User authentication with NextAuth.js
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Order management system
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Product reviews and ratings
- [ ] Size recommendation AI

## 📄 License

This project is for demonstration purposes.

---

Made with ❤️ for Darshan Cloth Shop

# Trigger redeploy
