import { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import Footer from './components/Footer';
import { BagDrawer, CartProvider } from './components/Cart';
import { AuthProvider } from './lib/auth';
import { CurrencyProvider } from './lib/currency';
import PendingOrderBanner from './components/PendingOrderBanner';
import ConsentBanner from './components/ConsentBanner';
import { trackPage } from './lib/analytics';
import Home from './pages/Home';
import Maintenance from './pages/Maintenance';
import { adminApi, tokens } from './lib/adminApi';

// Code splitting: every page except Home is its own JS chunk, downloaded only when visited (faster first load on mobile).
const Shop = lazy(() => import('./pages/Shop'));
const Collections = lazy(() => import('./pages/Collections'));
const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const Static = lazy(() => import('./pages/Static'));
const CartPage = lazy(() => import('./pages/CartPage'));
const Checkout = lazy(() => import('./pages/Checkout'));
const CheckoutComplete = lazy(() => import('./pages/CheckoutComplete'));
const CardPay = lazy(() => import('./pages/CardPay'));
// DEVELOPMENT ONLY fake bank page: import.meta.env.DEV is false in production builds, so this code is stripped out of them.
const MockPay = import.meta.env.DEV ? lazy(() => import('./pages/MockPay')) : null;
const Account = lazy(() => import('./pages/Account'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const OrdersList = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/Orders').then((m) => ({ default: m.OrderDetail })));
// Admin is its own set of chunks: customers never download admin code.
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminLogin = lazy(() => import('./admin/Login'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const AdminProducts = lazy(() => import('./admin/Products'));
const ProductForm = lazy(() => import('./admin/ProductForm'));
const AdminCollections = lazy(() => import('./admin/Collections'));
const AdminContent = lazy(() => import('./admin/Content'));
const AdminMessages = lazy(() => import('./admin/Messages'));
const Page = lazy(() => import('./pages/Page'));
const Search = lazy(() => import('./pages/Search'));
const World = lazy(() => import('./pages/World'));
const JournalPost = lazy(() => import('./pages/JournalPost'));
const AdminJournal = lazy(() => import('./admin/Journal'));
const AdminOrders = lazy(() => import('./admin/OrdersAdmin'));
const AdminOrderDetail = lazy(() => import('./admin/OrdersAdmin').then((m) => ({ default: m.AdminOrderDetail })));
const Customers = lazy(() => import('./admin/Customers'));
const Discounts = lazy(() => import('./admin/Discounts'));
const Settings = lazy(() => import('./admin/Settings'));

// MAINTENANCE GATE. Asks the server whether the shop is closed. If it is, the public sees only the "Under maintenance" page.
// An ADMIN who is signed in (Leen, via /admin/login in this browser) still sees the real shop, so she can check her products; the server
// re-checks her role, a token alone is not enough. /admin itself is outside this gate. If the questions fail we show the normal site (fail open).
function MaintenanceGate() {
  const { pathname } = useLocation();
  const [view, setView] = useState<'asking' | 'closed' | 'preview' | 'open'>('asking');
  useEffect(() => {
    const base = (import.meta.env.VITE_API_URL as string | undefined) || '/api';
    fetch(`${base}/maintenance`).then((r) => r.json()).then(async (d) => {
      if (!d.on) return setView('open');
      if (tokens.get()) { try { const me = await adminApi<{ role: string }>('/me'); if (me.role === 'ADMIN') return setView('preview'); } catch { /* not an admin */ } }
      setView('closed');
    }).catch(() => setView('open'));
  }, []);
  if (view === 'asking') return <div className="min-h-screen" />;
  // The password-reset page stays reachable while closed, so the emailed reset link works (it shows nothing else of the shop).
  if (view === 'closed' && !pathname.startsWith('/account/reset')) return <Maintenance />;
  return <>{view === 'preview' && <div className="fixed inset-x-0 bottom-0 z-[60] bg-ink px-4 py-2 text-center text-[11px] normal-case tracking-normal text-white">Preview: the shop is closed to the public. Only you can see it.</div>}<Layout /></>;
}

function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { scrollTo(0, 0); trackPage(pathname); }, [pathname]);   // new page starts at the top; count the page view (only after cookie consent)
  return <CurrencyProvider><AuthProvider><CartProvider>
    <Header />
    {/* soft page transition: fade between routes */}
    <AnimatePresence mode="wait"><motion.main key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <Suspense fallback={<div className="min-h-screen" />}><Outlet /></Suspense></motion.main></AnimatePresence>
    <Footer /><BagDrawer /><PendingOrderBanner /><ConsentBanner />
  </CartProvider></AuthProvider></CurrencyProvider>;
}

export default function App() {
  return <Suspense fallback={<div className="min-h-screen" />}><Routes>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<Dashboard />} />
      <Route path="products" element={<AdminProducts />} />
      <Route path="products/new" element={<ProductForm />} />
      <Route path="products/:id" element={<ProductForm />} />
      <Route path="collections" element={<AdminCollections />} />
      <Route path="orders" element={<AdminOrders />} />
      <Route path="orders/:id" element={<AdminOrderDetail />} />
      <Route path="customers" element={<Customers />} />
      <Route path="discounts" element={<Discounts />} />
      <Route path="settings" element={<Settings />} />
      <Route path="content" element={<AdminContent />} />
      <Route path="messages" element={<AdminMessages />} />
      <Route path="journal" element={<AdminJournal />} />
    </Route>
    <Route element={<MaintenanceGate />}>
    <Route index element={<Home />} />
    <Route path="shop" element={<Shop />} />
    <Route path="collections" element={<Collections />} />
    <Route path="collections/:slug" element={<CollectionPage />} />
    <Route path="products/:slug" element={<ProductPage />} />
    <Route path="cart" element={<CartPage />} />
    <Route path="checkout" element={<Checkout />} />
    <Route path="checkout/complete" element={<CheckoutComplete />} />
    <Route path="checkout/pay" element={<CardPay />} />
    {MockPay && <Route path="dev/mock-pay" element={<MockPay />} />}
    <Route path="account" element={<Account />} />
    <Route path="account/reset" element={<ResetPassword />} />
    <Route path="account/orders" element={<OrdersList />} />
    <Route path="account/orders/:id" element={<OrderDetail />} />
    <Route path="search" element={<Search />} />
    <Route path="leens-world" element={<World />} />
    <Route path="leens-world/journal/:slug" element={<JournalPost />} />
    {/* info pages: one component, content comes from the database (editable in Admin > Content) */}
    {['about', 'contact', 'faq', 'shipping', 'returns', 'privacy', 'terms'].map((p) => <Route key={p} path={p} element={<Page slug={p} />} />)}
    <Route path="*" element={<Static notFound />} />
  </Route></Routes></Suspense>;
}
