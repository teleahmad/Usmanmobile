import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Package,
  Plus,
  Search,
  Share2,
  Shield,
  ShoppingBag,
  Smartphone,
  Star,
  Trash2,
  User,
  Wrench,
} from 'lucide-react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { useAdminAuth } from '../context/AdminAuthContext';
import { formatPkr, SitePage } from '../data/catalogData';
import { UsedPhoneItem } from '../data/usedPhonesData';
import { db } from '../firebase';
import {
  LiveCatalogProduct,
  LiveCustomerReview,
  SiteMediaOverride,
} from '../hooks/useLiveStoreData';
import {
  AdminProductsManager,
  AdminShopPhotosManager,
} from './AdminProductPhotosControls';
import {
  AdminReviewsManager,
  AdminUsedPhonesManager,
} from './AdminUsedPhonesAndReviews';
import { AdminSocialLinksManager } from './AdminSocialLinksManager';
import { DEFAULT_SOCIAL_LINKS, SocialLinksConfig } from './SocialLinksBar';

export interface RepairTicketData {
  id: string;
  token: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  issue: string;
  costPkr: number;
  status: 'received' | 'in_progress' | 'ready' | 'delivered';
  notes?: string;
  createdAt?: any;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  itemsSummary: string;
  totalPkr: number;
  status: 'new' | 'confirmed' | 'dispatched' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: any;
}

interface AdminDashboardProps {
  products: LiveCatalogProduct[];
  usedPhones?: UsedPhoneItem[];
  liveReviews?: LiveCustomerReview[];
  reviewsVisible?: boolean;
  socialLinks?: SocialLinksConfig;
  mediaOverrides: Record<string, SiteMediaOverride>;
  onNavigate: (page: SitePage) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  usedPhones = [],
  liveReviews = [],
  reviewsVisible = true,
  socialLinks = DEFAULT_SOCIAL_LINKS,
  mediaOverrides,
  onNavigate,
}) => {
  const {
    user,
    authLoading,
    isAdmin: isAuthorizedAdmin,
    signInWithGoogle,
    signInWithPassword,
    signOutAdmin,
  } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<
    'repairs' | 'orders' | 'products' | 'used-phones' | 'photos' | 'social' | 'reviews'
  >('products');
  const [repairs, setRepairs] = useState<RepairTicketData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Email & Password sign-in form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signingInPassword, setSigningInPassword] = useState(false);
  const [signingInGoogle, setSigningInGoogle] = useState(false);
  const [showConsoleHint, setShowConsoleHint] = useState(false);

  // New Repair Form state
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newDeviceModel, setNewDeviceModel] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [newCost, setNewCost] = useState('1500');
  const [newNotes, setNewNotes] = useState('');
  const [creatingRepair, setCreatingRepair] = useState(false);

  const handleGoogleSignIn = async () => {
    setFeedbackMsg(null);
    setShowConsoleHint(false);
    setSigningInGoogle(true);
    const result = await signInWithGoogle();
    setSigningInGoogle(false);
    if (!result.ok && result.error) {
      setFeedbackMsg({ text: result.error, type: 'error' });
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    setShowConsoleHint(false);
    setSigningInPassword(true);
    const result = await signInWithPassword(loginEmail, loginPassword);
    setSigningInPassword(false);
    if (result.ok) {
      setLoginPassword('');
    } else if (result.error) {
      setFeedbackMsg({ text: result.error, type: 'error' });
      if (result.needsConsoleSetup) {
        setShowConsoleHint(true);
      }
    }
  };

  const handleSignOut = async () => {
    await signOutAdmin();
    setRepairs([]);
    setOrders([]);
  };

  // Real-time Firestore subscriptions when signed in as an authorized admin
  useEffect(() => {
    if (!user || !isAuthorizedAdmin) return;

    // 1. Repairs subscription
    const repairsCol = collection(db, 'repairs');
    const unsubRepairs = onSnapshot(
      repairsCol,
      (snapshot) => {
        const loaded: RepairTicketData[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<RepairTicketData, 'id'>),
        }));
        setRepairs(loaded);
      },
      (error) => {
        console.warn('Repairs snapshot warning:', error);
      },
    );

    // 2. Orders subscription
    const ordersCol = collection(db, 'orders');
    const unsubOrders = onSnapshot(
      ordersCol,
      (snapshot) => {
        const loaded: OrderData[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<OrderData, 'id'>),
        }));
        setOrders(loaded);
      },
      (error) => {
        console.warn('Orders snapshot warning:', error);
      },
    );

    return () => {
      unsubRepairs();
      unsubOrders();
    };
  }, [user, isAuthorizedAdmin]);

  // Create New Repair Ticket
  const handleCreateRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone || !newDeviceModel || !newIssue) {
      setFeedbackMsg({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    try {
      setCreatingRepair(true);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const token = `UMR-${randomSuffix}`;

      const repairPayload = {
        token,
        customerName: newCustomerName.trim(),
        customerPhone: newCustomerPhone.trim(),
        deviceModel: newDeviceModel.trim(),
        issue: newIssue.trim(),
        costPkr: Number(newCost) || 0,
        status: 'received' as const,
        notes: newNotes.trim() || 'Received at shop counter',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'repairs'), repairPayload);

      // Clean inputs
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewDeviceModel('');
      setNewIssue('');
      setNewNotes('');
      setFeedbackMsg({
        text: `Repair Ticket ${token} successfully created and saved in Firebase!`,
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      setFeedbackMsg({
        text: 'Failed to save repair ticket in Firestore.',
        type: 'error',
      });
    } finally {
      setCreatingRepair(false);
    }
  };

  // Update Repair Status
  const handleUpdateRepairStatus = async (
    repairId: string,
    newStatus: 'received' | 'in_progress' | 'ready' | 'delivered',
  ) => {
    try {
      await updateDoc(doc(db, 'repairs', repairId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      setFeedbackMsg({
        text: `Ticket status updated to ${newStatus.toUpperCase()}`,
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      setFeedbackMsg({ text: 'Error updating ticket status in database.', type: 'error' });
    }
  };

  // Delete Repair Ticket
  const handleDeleteRepair = async (repairId: string) => {
    if (!window.confirm('Are you sure you want to delete this repair record?')) return;
    try {
      await deleteDoc(doc(db, 'repairs', repairId));
      setFeedbackMsg({ text: 'Repair ticket deleted.', type: 'success' });
    } catch (err) {
      console.error(err);
      setFeedbackMsg({ text: 'Error deleting repair record.', type: 'error' });
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: 'new' | 'confirmed' | 'dispatched' | 'completed' | 'cancelled',
  ) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      setFeedbackMsg({
        text: `Order status updated to ${newStatus.toUpperCase()}`,
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      setFeedbackMsg({ text: 'Error updating order status.', type: 'error' });
    }
  };

  // WhatsApp notification generators
  const getRepairStatusWhatsAppUrl = (ticket: RepairTicketData) => {
    let msg = `Assalam o Alaikum ${ticket.customerName}! `;
    if (ticket.status === 'received') {
      msg += `Aapka mobile (${ticket.deviceModel}) Usman Mobile Repairing Centre me receive ho chuka hai. Tracking Token: ${ticket.token}. Issue: ${ticket.issue}. Estimated charges: Rs. ${ticket.costPkr}.`;
    } else if (ticket.status === 'in_progress') {
      msg += `Aapka mobile (${ticket.deviceModel}) par repair lab me kaam chal raha hai. Token: ${ticket.token}.`;
    } else if (ticket.status === 'ready') {
      msg += `Aapka mobile (${ticket.deviceModel}) bilkul test aur theek ho chuka hai! Aap shop Hussain Khan Wala se receive kar sakte hain. Total charges: Rs. ${ticket.costPkr}. Shukriya!`;
    } else {
      msg += `Aapka mobile (${ticket.deviceModel}) successfully deliver ho gaya hai. Usman Mobile Repairing Centre par aetimad ka shukriya!`;
    }

    const cleanPhone = ticket.customerPhone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;
  };

  const filteredRepairs = repairs.filter(
    (r) =>
      r.token?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerPhone?.includes(searchQuery) ||
      r.deviceModel?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#F3ECE6] text-[#141414] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-100"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Shop</span>
            </button>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#141414] flex items-center gap-2">
                <Shield className="h-6 w-6 text-[#EA4E1B]" />
                Usman Mobile Admin Dashboard
              </h1>
              <p className="text-xs text-neutral-500">
                Firebase Firestore Connected · Hussain Khan Wala Repair Lab
              </p>
            </div>
          </div>

          {/* Auth State in Header */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-black/5">
                <div className="text-right text-xs">
                  <div className="font-bold text-[#141414] truncate max-w-[160px]">
                    {user.email || user.displayName || 'Admin'}
                  </div>
                  <div
                    className={`text-[10px] font-semibold flex items-center gap-1 justify-end ${
                      isAuthorizedAdmin ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isAuthorizedAdmin ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                      }`}
                    />
                    {isAuthorizedAdmin ? 'Authorized Admin' : 'Unauthorized Account'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:text-red-600 transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="inline-flex items-center gap-2 rounded-full bg-[#141414] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800"
              >
                <Lock className="h-4 w-4" />
                <span>Admin Login with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`mt-4 flex items-center justify-between rounded-xl p-3.5 text-xs font-medium ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-xs font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {authLoading ? (
          <div className="mt-16 flex flex-col items-center justify-center gap-3 text-neutral-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#EA4E1B]/25 border-t-[#EA4E1B]" />
            <p className="text-xs font-semibold">Checking admin session...</p>
          </div>
        ) : !user ? (
          /* Dual Sign-In Card: Email & Password + Google Popup */
          <div className="mt-10 mx-auto max-w-md rounded-3xl bg-white p-7 sm:p-8 shadow-lg border border-black/5">
            <div className="text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EA4E1B]/10 text-[#EA4E1B] mb-3.5">
                <Lock className="h-7 w-7" />
              </div>
              <h2 className="font-display text-xl font-extrabold text-[#141414]">
                Admin Sign In
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
                Sign in with your authorized admin email &amp; password or Google account to edit
                products, photos, and customer reviews directly on the live store.
              </p>
            </div>

            {/* Email & Password Login Form */}
            <form onSubmit={handlePasswordSignIn} className="mt-6 space-y-3.5 text-left">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-[11px] font-bold text-neutral-700"
                >
                  Admin Email
                </label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="username"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter authorized admin email"
                    className="h-11 w-full rounded-xl border border-neutral-300 bg-neutral-50 pr-3 pl-9 text-xs font-medium text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-[11px] font-bold text-neutral-700"
                >
                  Password
                </label>
                <div className="relative mt-1">
                  <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="h-11 w-full rounded-xl border border-neutral-300 bg-neutral-50 pr-10 pl-9 text-xs font-medium text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 hover:text-[#141414]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={signingInPassword}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#EA4E1B] text-sm font-bold text-white shadow-md transition hover:bg-[#d44212] disabled:opacity-60"
              >
                <KeyRound className="h-4 w-4" />
                <span>{signingInPassword ? 'Signing in...' : 'Sign In with Password'}</span>
              </button>
            </form>

            {showConsoleHint && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-left text-[11px] leading-relaxed text-amber-900">
                <p className="font-bold">One-time Firebase Console setup for Password Login:</p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                  <li>Open Firebase Console &rarr; Authentication &rarr; Sign-in method &rarr; enable <strong>Email/Password</strong>.</li>
                  <li>Go to Authentication &rarr; Users &rarr; click <strong>Add user</strong> and add both authorized admin emails with your chosen password.</li>
                </ol>
              </div>
            )}

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                or
              </span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            {/* Google Popup Sign-In */}
            <button
              type="button"
              disabled={signingInGoogle}
              onClick={handleGoogleSignIn}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-neutral-300 bg-white text-sm font-bold text-[#141414] shadow-2xs transition hover:border-[#141414] hover:bg-neutral-50 disabled:opacity-60"
            >
              <User className="h-4 w-4 text-[#EA4E1B]" />
              <span>{signingInGoogle ? 'Opening Google...' : 'Sign In with Google Popup'}</span>
            </button>

            <div className="mt-4 text-center text-[11px] text-neutral-400">
              Direct access for Usman Mobile staff · Hussain Khan Wala
            </div>
          </div>
        ) : !isAuthorizedAdmin ? (
          /* Signed in with a non-admin email */
          <div className="mt-12 mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-lg border border-red-200">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="font-display text-xl font-extrabold text-[#141414]">
              Unauthorized Account
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              Signed in as <strong className="text-neutral-900">{user.email}</strong>. Please sign
              in with any of the authorized emails ending with{' '}
              <strong className="text-neutral-900">pro@gmail.com</strong> or{' '}
              <strong className="text-neutral-900">768@gmail.com</strong>.
            </p>

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EA4E1B] py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#d44212]"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out &amp; Switch Account</span>
            </button>
          </div>
        ) : (
          /* Main Dashboard Content */
          <div className="mt-8 space-y-8">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-black/5">
                <div className="text-xs font-semibold text-neutral-500">Active Repairs</div>
                <div className="mt-1 text-2xl font-extrabold text-[#EA4E1B]">
                  {repairs.filter((r) => r.status !== 'delivered').length}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">In lab / In progress</div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm border border-black/5">
                <div className="text-xs font-semibold text-neutral-500">Ready for Pickup</div>
                <div className="mt-1 text-2xl font-extrabold text-emerald-600">
                  {repairs.filter((r) => r.status === 'ready').length}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Completed testing</div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm border border-black/5">
                <div className="text-xs font-semibold text-neutral-500">Total Orders</div>
                <div className="mt-1 text-2xl font-extrabold text-[#141414]">
                  {orders.length}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Web cart orders</div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm border border-black/5">
                <div className="text-xs font-semibold text-neutral-500">Catalog Items</div>
                <div className="mt-1 text-2xl font-extrabold text-[#141414]">
                  {products.filter((p) => !p.hidden).length}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Live products</div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap border-b border-black/10 gap-x-5 gap-y-2">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 pb-3 text-sm font-bold transition border-b-2 ${
                  activeTab === 'products'
                    ? 'border-[#EA4E1B] text-[#EA4E1B]'
                    : 'border-transparent text-neutral-500 hover:text-[#141414]'
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Products ({products.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('used-phones')}
                className={`flex items-center gap-2 pb-3 text-sm font-bold transition border-b-2 ${
                  activeTab === 'used-phones'
                    ? 'border-[#EA4E1B] text-[#EA4E1B]'
                    : 'border-transparent text-neutral-500 hover:text-[#141414]'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span>Used Phones ({usedPhones.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className={`flex items-center gap-2 pb-3 text-sm font-bold transition border-b-2 ${
                  activeTab === 'photos'
                    ? 'border-[#EA4E1B] text-[#EA4E1B]'
                    : 'border-transparent text-neutral-500 hover:text-[#141414]'
                }`}
              >
                <Camera className="h-4 w-4" />
                <span>Shop Photos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('social')}
                className={`flex items-center gap-2 pb-3 text-sm font-bold transition border-b-2 ${
                  activeTab === 'social'
                    ? 'border-[#EA4E1B] text-[#EA4E1B]'
                    : 'border-transparent text-neutral-500 hover:text-[#141414]'
                }`}
              >
                <Share2 className="h-4 w-4" />
                <span>Social Links</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center gap-2 pb-3 text-sm font-bold transition border-b-2 ${
                  activeTab === 'reviews'
                    ? 'border-[#EA4E1B] text-[#EA4E1B]'
                    : 'border-transparent text-neutral-500 hover:text-[#141414]'
                }`}
              >
                <Star className="h-4 w-4" />
                <span>Reviews ({liveReviews.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('repairs')}
                className={`flex items-center gap-2 pb-3 text-sm font-bold transition border-b-2 ${
                  activeTab === 'repairs'
                    ? 'border-[#EA4E1B] text-[#EA4E1B]'
                    : 'border-transparent text-neutral-500 hover:text-[#141414]'
                }`}
              >
                <Wrench className="h-4 w-4" />
                <span>Repairs ({repairs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 pb-3 text-sm font-bold transition border-b-2 ${
                  activeTab === 'orders'
                    ? 'border-[#EA4E1B] text-[#EA4E1B]'
                    : 'border-transparent text-neutral-500 hover:text-[#141414]'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Orders ({orders.length})</span>
              </button>
            </div>

            {/* TAB 1: REPAIR TICKETS */}
            {activeTab === 'repairs' && (
              <div className="space-y-6">
                {/* Create Repair Job Form */}
                <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-black/5">
                  <h3 className="font-display text-lg font-bold text-[#141414] flex items-center gap-2">
                    <Plus className="h-5 w-5 text-[#EA4E1B]" />
                    Create New Mobile Repair Ticket (نیا ریپئرنگ ٹوکن)
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Creates an instant tracking token in Firestore database and generates a prefilled WhatsApp update.
                  </p>

                  <form onSubmit={handleCreateRepair} className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700">Customer Name *</label>
                      <input
                        type="text"
                        required
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        placeholder="e.g. Muhammad Ali"
                        className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700">WhatsApp Mobile *</label>
                      <input
                        type="tel"
                        required
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        placeholder="e.g. 03001234567"
                        className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700">Device Model *</label>
                      <input
                        type="text"
                        required
                        value={newDeviceModel}
                        onChange={(e) => setNewDeviceModel(e.target.value)}
                        placeholder="e.g. Vivo Y20 / iPhone 11"
                        className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700">Fault / Issue *</label>
                      <input
                        type="text"
                        required
                        value={newIssue}
                        onChange={(e) => setNewIssue(e.target.value)}
                        placeholder="e.g. LCD display broken, charging jack IC"
                        className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700">Estimated Cost (PKR)</label>
                      <input
                        type="number"
                        value={newCost}
                        onChange={(e) => setNewCost(e.target.value)}
                        placeholder="1500"
                        className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700">Counter Notes</label>
                      <input
                        type="text"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="e.g. Customer provided PIN code"
                        className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={creatingRepair}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#EA4E1B] px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#d44212] disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        <span>{creatingRepair ? 'Saving in Firestore...' : 'Create & Save Ticket'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Repair Tickets List */}
                <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-black/5">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-black/5">
                    <div>
                      <h3 className="font-display text-base font-bold text-[#141414]">
                        Existing Repair Tickets
                      </h3>
                      <p className="text-xs text-neutral-500">Live synchronized with Google Firestore</p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search token, phone, name..."
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {filteredRepairs.length === 0 ? (
                    <div className="py-12 text-center text-xs text-neutral-400">
                      No repair tickets found. Create your first repair ticket above!
                    </div>
                  ) : (
                    <div className="mt-4 divide-y divide-neutral-100">
                      {filteredRepairs.map((ticket) => {
                        const statusColors = {
                          received: 'bg-amber-100 text-amber-800 border-amber-200',
                          in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
                          ready: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                          delivered: 'bg-neutral-100 text-neutral-700 border-neutral-200',
                        };

                        return (
                          <div
                            key={ticket.id}
                            className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#EA4E1B] bg-[#EA4E1B]/10 px-2.5 py-0.5 rounded-md">
                                  {ticket.token}
                                </span>
                                <span className="text-sm font-bold text-[#141414]">
                                  {ticket.customerName}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  ({ticket.customerPhone})
                                </span>
                              </div>
                              <div className="text-xs text-neutral-600">
                                <strong>Device:</strong> {ticket.deviceModel} · <strong>Issue:</strong> {ticket.issue}
                              </div>
                              <div className="text-[11px] text-neutral-400">
                                Charges: {formatPkr(ticket.costPkr)} · Notes: {ticket.notes || 'None'}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* Status Select */}
                              <select
                                value={ticket.status}
                                onChange={(e) =>
                                  handleUpdateRepairStatus(
                                    ticket.id,
                                    e.target.value as RepairTicketData['status'],
                                  )
                                }
                                className={`text-xs font-bold rounded-xl border px-3 py-1.5 focus:outline-none ${
                                  statusColors[ticket.status]
                                }`}
                              >
                                <option value="received">Received (موصول)</option>
                                <option value="in_progress">In Progress (کام جاری)</option>
                                <option value="ready">Ready (تیار ہے)</option>
                                <option value="delivered">Delivered (حوالے کر دیا)</option>
                              </select>

                              {/* WhatsApp Direct Notify */}
                              <a
                                href={getRepairStatusWhatsAppUrl(ticket)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>Notify WhatsApp</span>
                              </a>

                              {/* Delete Ticket */}
                              <button
                                type="button"
                                onClick={() => handleDeleteRepair(ticket.id)}
                                className="rounded-xl border border-neutral-200 p-2 text-neutral-400 hover:text-red-600 hover:border-red-200 transition"
                                title="Delete Ticket"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ONLINE ORDERS */}
            {activeTab === 'orders' && (
              <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-black/5">
                <div className="pb-4 border-b border-black/5">
                  <h3 className="font-display text-base font-bold text-[#141414]">
                    Customer Purchase Orders
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Orders received from website visitors across Pattoki and Hussain Khan Wala.
                  </p>
                </div>

                {orders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-neutral-400">
                    No web orders yet. When customers check out from the cart, orders will appear here in real-time.
                  </div>
                ) : (
                  <div className="mt-4 divide-y divide-neutral-100">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">
                              {ord.orderNumber}
                            </span>
                            <span className="text-sm font-bold text-[#141414]">
                              {ord.customerName}
                            </span>
                            <span className="text-xs text-neutral-500">
                              ({ord.customerPhone})
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-neutral-600">
                            <strong>Items:</strong> {ord.itemsSummary}
                          </div>
                          <div className="text-xs font-bold text-[#EA4E1B] mt-0.5">
                            Total: {formatPkr(ord.totalPkr)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={ord.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(
                                ord.id,
                                e.target.value as OrderData['status'],
                              )
                            }
                            className="text-xs font-bold rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 focus:outline-none"
                          >
                            <option value="new">New Order</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>

                          <a
                            href={`https://wa.me/${ord.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Assalam o Alaikum ${ord.customerName}! Aapke Usman Mobile order #${ord.orderNumber} ke hawale se rabta kiya hai.`,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* TAB 3: LIVE PRODUCTS MANAGER */}
            {activeTab === 'products' && (
              <AdminProductsManager
                products={products}
                setFeedbackMsg={setFeedbackMsg}
              />
            )}

            {/* TAB 4: USED / SECOND-HAND PHONES MANAGER */}
            {activeTab === 'used-phones' && (
              <AdminUsedPhonesManager
                usedPhones={usedPhones}
                onFeedback={setFeedbackMsg}
              />
            )}

            {/* TAB 5: SHOP INTERIOR & EXTERIOR PHOTOS MANAGER */}
            {activeTab === 'photos' && (
              <AdminShopPhotosManager
                mediaOverrides={mediaOverrides}
                setFeedbackMsg={setFeedbackMsg}
              />
            )}

            {/* TAB 5B: SOCIAL MEDIA LINKS MANAGER */}
            {activeTab === 'social' && (
              <AdminSocialLinksManager
                socialLinks={socialLinks}
                setFeedbackMsg={setFeedbackMsg}
              />
            )}

            {/* TAB 6: LIVE CUSTOMER REVIEWS MANAGER */}
            {activeTab === 'reviews' && (
              <AdminReviewsManager
                liveReviews={liveReviews}
                reviewsVisible={reviewsVisible}
                onFeedback={setFeedbackMsg}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
