import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  User,
  FileText,
  Power,
  FileUp,
  DollarSign,
  PlusCircle,
  CreditCard,
  ClipboardList,
  Save,
  RotateCcw,
  Search,
  Trash2,
  Edit3,
  Check,
  Clock,
  Zap,
  Copy,
  Package,
  Sparkles,
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useCatalogConfig } from '../context/CatalogConfigContext';
import { NETWORK_INFO } from '../data/catalogData';
import { SocialNetwork, OrderStatus, ServiceItem } from '../types/catalog';

interface AdminSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInstructions: () => void;
  onOpenUploadPdfs?: () => void;
}

type AdminTab = 'prices' | 'products' | 'payments' | 'orders' | 'session';

export const AdminSessionModal: React.FC<AdminSessionModalProps> = ({
  isOpen,
  onClose,
  onOpenInstructions,
  onOpenUploadPdfs,
}) => {
  const {
    sessionId,
    myUserNumber,
    isAdmin,
    isAdminOccupiedByOther,
    activeAdminUserNumber,
    totalUsers,
    users,
    loginAdmin,
    logoutAdmin,
  } = useSession();

  const {
    allServicesAdmin,
    specialOffers,
    diagnosticPrices,
    paymentConfig,
    orders,
    updateServicePrice,
    updateServiceDetails,
    toggleServiceHidden,
    createCustomService,
    deleteCustomService,
    updateSpecialOfferPrice,
    updateDiagnosticPrice,
    saveBulkPrices,
    updatePaymentConfig,
    resetAllToDefaults,
    updateOrderStatus,
    deleteOrder,
    clearOrders,
  } = useCatalogConfig();

  // Login states
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'invalid' | 'busy' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin active tab
  const [activeTab, setActiveTab] = useState<AdminTab>('prices');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab 1: Price Editor local drafts
  const [priceSearch, setPriceSearch] = useState('');
  const [priceNetworkFilter, setPriceNetworkFilter] = useState<string>('all');
  const [priceSectionFilter, setPriceSectionFilter] = useState<'all' | 'catalog' | 'monetization' | 'offers'>('all');
  const [draftServicePrices, setDraftServicePrices] = useState<Record<string, string>>({});
  const [draftDiagPrices, setDraftDiagPrices] = useState<Record<string, string>>({});
  const [draftOfferPrices, setDraftOfferPrices] = useState<Record<string, string>>({});

  // Tab 2: Product Creator & Editor (#3)
  const [newProdNetwork, setNewProdNetwork] = useState<SocialNetwork>('instagram');
  const [newProdName, setNewProdName] = useState('');
  const [newProdMetric, setNewProdMetric] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('15');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdTag, setNewProdTag] = useState('Nuevo');
  const [newProdDelivery, setNewProdDelivery] = useState('48 a 72 horas');
  const [newProdPopular, setNewProdPopular] = useState(true);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceDraft, setEditServiceDraft] = useState<{
    name: string;
    metric: string;
    price: string;
    description: string;
    tag: string;
    deliveryTime: string;
  }>({
    name: '',
    metric: '',
    price: '',
    description: '',
    tag: '',
    deliveryTime: '48 a 72 horas',
  });

  // Tab 3: Payment & WhatsApp Editor (#8)
  const [payWhatsappPhone, setPayWhatsappPhone] = useState(paymentConfig.whatsappPhone);
  const [payWhatsappDisplay, setPayWhatsappDisplay] = useState(paymentConfig.whatsappDisplay);
  const [payBinanceId, setPayBinanceId] = useState(paymentConfig.binancePayId);
  const [payBankName, setPayBankName] = useState(paymentConfig.pagoMovil.bank);
  const [payBankCode, setPayBankCode] = useState(paymentConfig.pagoMovil.bankCode);
  const [payBankPhone, setPayBankPhone] = useState(paymentConfig.pagoMovil.phone);
  const [payBankCid, setPayBankCid] = useState(paymentConfig.pagoMovil.id);

  // Tab 4: Orders History Filter (#9)
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Sync draft prices when catalog data changes
  useEffect(() => {
    const sMap: Record<string, string> = {};
    allServicesAdmin.forEach((s) => {
      sMap[s.id] = String(s.price);
    });
    setDraftServicePrices(sMap);
  }, [allServicesAdmin]);

  useEffect(() => {
    const dMap: Record<string, string> = {};
    diagnosticPrices.forEach((d) => {
      dMap[d.id] = String(d.price);
    });
    setDraftDiagPrices(dMap);
  }, [diagnosticPrices]);

  useEffect(() => {
    const oMap: Record<string, string> = {};
    specialOffers.forEach((o) => {
      oMap[o.id] = o.price === 'consultar' ? '' : String(o.price);
    });
    setDraftOfferPrices(oMap);
  }, [specialOffers]);

  useEffect(() => {
    setPayWhatsappPhone(paymentConfig.whatsappPhone);
    setPayWhatsappDisplay(paymentConfig.whatsappDisplay);
    setPayBinanceId(paymentConfig.binancePayId);
    setPayBankName(paymentConfig.pagoMovil.bank);
    setPayBankCode(paymentConfig.pagoMovil.bankCode);
    setPayBankPhone(paymentConfig.pagoMovil.phone);
    setPayBankCid(paymentConfig.pagoMovil.id);
  }, [paymentConfig]);

  // Filtered items for Price Editor
  const filteredCatalogServices = useMemo(() => {
    const q = priceSearch.toLowerCase().trim();
    return allServicesAdmin.filter((s) => {
      const matchNet = priceNetworkFilter === 'all' || s.network === priceNetworkFilter;
      const matchQ =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.metric.toLowerCase().includes(q) ||
        s.network.toLowerCase().includes(q);
      return matchNet && matchQ;
    });
  }, [allServicesAdmin, priceNetworkFilter, priceSearch]);

  const filteredDiagPackages = useMemo(() => {
    const q = priceSearch.toLowerCase().trim();
    return diagnosticPrices.filter((d) => {
      const matchNet = priceNetworkFilter === 'all' || d.network === priceNetworkFilter;
      const matchQ =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.metric.toLowerCase().includes(q) ||
        d.network.toLowerCase().includes(q);
      return matchNet && matchQ;
    });
  }, [diagnosticPrices, priceNetworkFilter, priceSearch]);

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'all') return orders;
    return orders.filter((o) => o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorType('invalid');
      setErrorMessage('Ingresa la contraseña de administrador (****).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setErrorType(null);

    const result = await loginAdmin(password);
    setIsSubmitting(false);

    if (result.ok) {
      setPassword('');
      setErrorMessage(null);
      setErrorType(null);
      setActiveTab('prices');
    } else {
      setErrorType(result.code === 'admin_already_connected' ? 'busy' : 'invalid');
      setErrorMessage(result.message);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setPassword('');
    setErrorMessage(null);
    setErrorType(null);
  };

  const handleSaveAllPrices = async () => {
    const sPrices: Record<string, number> = {};
    for (const [id, val] of Object.entries(draftServicePrices)) {
      const num = Number(val);
      if (!Number.isNaN(num) && num >= 0) {
        sPrices[id] = num;
      }
    }

    const dPrices: Record<string, number> = {};
    for (const [id, val] of Object.entries(draftDiagPrices)) {
      const num = Number(val);
      if (!Number.isNaN(num) && num >= 0) {
        dPrices[id] = num;
      }
    }

    const oPrices: Record<string, number | 'consultar'> = {};
    for (const [id, val] of Object.entries(draftOfferPrices)) {
      const trimmed = String(val).trim();
      if (!trimmed || trimmed.toLowerCase() === 'consultar') {
        oPrices[id] = 'consultar';
      } else {
        const num = Number(trimmed);
        oPrices[id] = !Number.isNaN(num) && num >= 0 ? num : 'consultar';
      }
    }

    await saveBulkPrices({
      servicePrices: sPrices,
      diagPrices: dPrices,
      offerPrices: oPrices,
    });
    showToast('¡Todos los precios en USD se han guardado y actualizado en toda la app!');
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdMetric.trim()) {
      showToast('Completa el nombre del producto y la métrica/paquete.');
      return;
    }
    const priceNum = Math.max(0, Number(newProdPrice) || 0);
    await createCustomService({
      network: newProdNetwork,
      name: newProdName,
      metric: newProdMetric,
      price: priceNum,
      description: newProdDesc,
      tag: newProdTag,
      popular: newProdPopular,
      deliveryTime: newProdDelivery,
    });
    setNewProdName('');
    setNewProdMetric('');
    setNewProdDesc('');
    showToast('¡Nuevo producto creado y publicado en el catálogo en USD!');
  };

  const startEditingService = (service: ServiceItem) => {
    setEditingServiceId(service.id);
    setEditServiceDraft({
      name: service.name,
      metric: service.metric,
      price: String(service.price),
      description: service.description,
      tag: service.tag || '',
      deliveryTime: service.deliveryTime || '48 a 72 horas',
    });
  };

  const saveEditedService = async (id: string) => {
    const priceNum = Math.max(0, Number(editServiceDraft.price) || 0);
    await updateServiceDetails(id, {
      name: editServiceDraft.name.trim() || 'Servicio',
      metric: editServiceDraft.metric.trim() || '1K',
      price: priceNum,
      description: editServiceDraft.description.trim(),
      tag: editServiceDraft.tag.trim(),
      deliveryTime: editServiceDraft.deliveryTime,
    });
    setEditingServiceId(null);
    showToast('Producto actualizado correctamente.');
  };

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePaymentConfig({
      whatsappPhone: payWhatsappPhone.trim() || '584242934550',
      whatsappDisplay: payWhatsappDisplay.trim() || '+58 424 2934550',
      binancePayId: payBinanceId.trim() || '965190483',
      pagoMovil: {
        bank: payBankName.trim() || 'Banco de Venezuela',
        bankCode: payBankCode.trim() || '0102',
        phone: payBankPhone.trim() || '04242934550',
        id: payBankCid.trim() || '28525460',
      },
    });
    showToast('¡Datos de Pago Móvil, Binance Pay y WhatsApp actualizados en toda la web!');
  };

  const copyOrderSummary = (order: any) => {
    const itemsText = order.items
      .map((i: any) => `• ${i.name} (${i.metric}) x${i.quantity} = $${i.unitPrice * i.quantity} USD`)
      .join('\n');
    const summary = `📋 PEDIDO #${order.id.slice(-5)}\nCliente/Enlace: ${order.clientLink || 'En chat'}\nRitmo: ${order.deliverySpeedLabel}\nPago: ${order.paymentMethod}\nServicios:\n${itemsText}\nTotal: $${order.totalUSD} USD`;
    navigator.clipboard.writeText(summary);
    setCopiedOrderId(order.id);
    setTimeout(() => setCopiedOrderId(null), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${
          isAdmin ? 'max-w-5xl' : 'max-w-lg'
        } bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[92vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-zinc-900/95 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                isAdmin
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : isAdminOccupiedByOther
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
              }`}
            >
              {isAdmin ? (
                <ShieldCheck className="w-5 h-5" />
              ) : isAdminOccupiedByOther ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <KeyRound className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2 flex-wrap">
                <span>
                  {isAdmin
                    ? 'Panel de Administración General (Precios USD, Productos, Pagos y Pedidos)'
                    : 'Control de Usuarios y Acceso Admin'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-cyan-400 border border-zinc-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {totalUsers} {totalUsers === 1 ? 'conectado' : 'conectados'}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Sesión actual: <strong className="text-zinc-200">Usuario #{myUserNumber}</strong> (
                {isAdmin ? 'Administrador Exclusivo 1/1' : 'Usuario Normal / Cliente'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Admin</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              aria-label="Cerrar ventana"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-5 py-2.5 text-xs font-black flex items-center justify-between animate-in fade-in duration-150 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Admin Navigation Tabs (Only visible when logged in as Admin) */}
        {isAdmin && (
          <div className="px-4 sm:px-6 py-2.5 bg-zinc-900/70 border-b border-zinc-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => setActiveTab('prices')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'prices'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>1. Precios en USD (Todos)</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>2. Crear / Editar Productos (#3)</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'payments'
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-950/50'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>3. Datos de Pago y WhatsApp (#8)</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/50'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>4. Historial de Pedidos (#9)</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('session')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'session'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>5. Usuarios y PDFs ({totalUsers})</span>
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* =============================================================== */}
          {/* VIEW FOR NORMAL USERS (NOT LOGGED IN AS ADMIN)                  */}
          {/* =============================================================== */}
          {!isAdmin && (
            <>
              {isAdminOccupiedByOther ? (
                <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-black text-rose-300">
                        Administrador Ocupado (1/1 en uso por Usuario #{activeAdminUserNumber ?? 1})
                      </h4>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                        Actualmente ya hay <strong>1 Administrador conectado</strong> en otra sesión. Tu cuenta se mantiene en <strong>Modo Usuario Normal (Cliente)</strong>.
                      </p>
                      <p className="text-[11px] text-rose-300/90 mt-1.5 font-medium">
                        • Solo se permite 1 Administrador conectado a la vez. En cuanto el Administrador actual cierre su página o cierre sesión, se liberará automáticamente el acceso.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4">
                  <div className="flex items-start gap-2.5">
                    <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-black text-amber-300">
                        Estás en Modo Usuario Normal (Cliente)
                      </h4>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                        El puesto de Administrador está disponible (0/1). Ingresa la clave secreta (
                        <span className="font-mono text-amber-300">****</span>) para abrir el editor de precios en USD, creador de paquetes, datos de pago e historial de pedidos.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleLogin}
                className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3"
              >
                <label className="block text-xs font-bold text-zinc-300">
                  Conectar como Administrador (Clave requerida:{' '}
                  <span className="font-mono text-amber-400">****</span>)
                </label>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Ingresa la contraseña (****)"
                    disabled={isSubmitting}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-950 border ${
                      errorMessage
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-zinc-700 focus:border-amber-500'
                    } text-sm text-white font-mono tracking-widest focus:outline-none transition`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {errorMessage && (
                  <div
                    className={`flex items-start gap-2 text-xs p-2.5 rounded-xl border ${
                      errorType === 'busy'
                        ? 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                        : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/30"
                >
                  <Unlock className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Verificando disponibilidad...'
                      : 'Entrar al Panel de Administrador (1 a la vez)'}
                  </span>
                </button>
              </form>

              {/* Connected Users List for Normal Users */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Usuarios Conectados en Tiempo Real ({totalUsers})</span>
                  </h4>
                  <span className="text-[11px] text-zinc-500">Máximo 1 Admin activo</span>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl divide-y divide-zinc-800/80 max-h-48 overflow-y-auto">
                  {users.map((u) => {
                    const isMe = u.sessionId === sessionId;
                    const isUserAdmin = u.role === 'admin';
                    return (
                      <div
                        key={u.sessionId}
                        className="flex items-center justify-between px-4 py-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              isUserAdmin
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {isUserAdmin ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                              <span>Usuario #{u.userNumber}</span>
                              {isMe && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-extrabold">
                                  TÚ
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500">
                              {isUserAdmin
                                ? 'Administrador con control de precios y catálogo'
                                : 'Modo Normal (Catálogo, carrito y calculadora)'}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isUserAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[11px]">
                              <ShieldCheck className="w-3 h-3" />
                              Admin Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-semibold text-[11px]">
                              Normal
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* =============================================================== */}
          {/* TAB 1: ADMIN PRICE EDITOR IN USD (BASE PROPOSAL A)              */}
          {/* =============================================================== */}
          {isAdmin && activeTab === 'prices' && (
            <div className="space-y-5">
              {/* Top Action Bar */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <span>Editor General de Precios en USD ($ Dólares)</span>
                  </h4>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Aquí salen <strong>todos los productos, paquetes de monetización y ofertas especiales</strong> con su red social y métrica. Modifica cualquier precio en USD y pulsa guardar.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={handleSaveAllPrices}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-950/50 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Todos los Precios (USD)</span>
                  </button>
                  <button
                    onClick={async () => {
                      await resetAllToDefaults();
                      showToast('Se restauraron todos los precios originales en USD.');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs border border-zinc-700 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar Originales</span>
                  </button>
                </div>
              </div>

              {/* Delivery Speed Info Banner (Base Proposal B) */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong className="text-white">Ritmo y Velocidad de Entrega Activo en toda la App:</strong>{' '}
                    <span className="text-amber-300 font-bold">Modo Express: 48 a 72 horas</span> •{' '}
                    <span className="text-emerald-300 font-bold">Modo Progresivo: 7 días en adelante</span>
                  </span>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold self-start sm:self-auto">
                  Sincronizado en Tiempo Real
                </span>
              </div>

              {/* Filters & Search */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={priceSearch}
                    onChange={(e) => setPriceSearch(e.target.value)}
                    placeholder="Buscar producto, paquete o métrica..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <select
                  value={priceSectionFilter}
                  onChange={(e) => setPriceSectionFilter(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Todas las secciones (Catálogo + Monetización + Ofertas)</option>
                  <option value="catalog">1. Productos del Catálogo ({allServicesAdmin.length})</option>
                  <option value="monetization">2. Paquetes de Monetización ({diagnosticPrices.length})</option>
                  <option value="offers">3. Ofertas Especiales ({specialOffers.length})</option>
                </select>

                <select
                  value={priceNetworkFilter}
                  onChange={(e) => setPriceNetworkFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Todas las Redes Sociales</option>
                  <option value="facebook">Facebook</option>
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="kick">Kick Streaming</option>
                  <option value="spotify">Spotify</option>
                </select>
              </div>

              {/* 1. CATALOG SERVICES TABLE */}
              {(priceSectionFilter === 'all' || priceSectionFilter === 'catalog') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h5 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-purple-400" />
                      <span>Productos y Servicios del Catálogo ({filteredCatalogServices.length})</span>
                    </h5>
                    <span className="text-[11px] text-zinc-400">Moneda: USD ($)</span>
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl divide-y divide-zinc-800/80 overflow-hidden">
                    {filteredCatalogServices.map((service) => {
                      const netInfo = NETWORK_INFO[service.network] || NETWORK_INFO.instagram;
                      const draftVal = draftServicePrices[service.id] ?? String(service.price);

                      return (
                        <div
                          key={service.id}
                          className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/90 transition"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shrink-0 ${netInfo.badgeColor}`}
                            >
                              {netInfo.name}
                            </span>
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                                <span>{service.name}</span>
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 text-purple-300 border border-zinc-700 font-semibold">
                                  Paquete: {service.metric}
                                </span>
                                {service.isCustom && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                    Creado por Admin
                                  </span>
                                )}
                                {service.hidden && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                                    Oculto
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                Unidad: {service.unit} • Entrega: {service.deliveryTime || '48 a 72 horas'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <div className="flex items-center bg-zinc-950 border border-zinc-700 focus-within:border-emerald-500 rounded-xl px-2.5 py-1.5">
                              <span className="text-xs font-black text-emerald-400 mr-1">$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={draftVal}
                                onChange={(e) =>
                                  setDraftServicePrices((prev) => ({
                                    ...prev,
                                    [service.id]: e.target.value,
                                  }))
                                }
                                className="w-20 bg-transparent text-sm font-black text-white focus:outline-none text-right"
                              />
                              <span className="text-[10px] font-bold text-zinc-400 ml-1.5">USD</span>
                            </div>

                            <button
                              onClick={async () => {
                                const num = Math.max(0, Number(draftVal) || 0);
                                await updateServicePrice(service.id, num);
                                showToast(`Precio actualizado: ${service.name} -> $${num} USD`);
                              }}
                              className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                              title="Guardar este precio en USD"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Guardar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. MONETIZATION ANALYZER PACKAGES TABLE */}
              {(priceSectionFilter === 'all' || priceSectionFilter === 'monetization') && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <h5 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Paquetes del Analizador de Monetización ({filteredDiagPackages.length})</span>
                    </h5>
                    <span className="text-[11px] text-zinc-400">Precios Base en USD ($)</span>
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl divide-y divide-zinc-800/80 overflow-hidden">
                    {filteredDiagPackages.map((pkg) => {
                      const netInfo = NETWORK_INFO[pkg.network] || NETWORK_INFO.youtube;
                      const draftVal = draftDiagPrices[pkg.id] ?? String(pkg.price);

                      return (
                        <div
                          key={pkg.id}
                          className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/90 transition"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shrink-0 ${netInfo.badgeColor}`}
                            >
                              {netInfo.name}
                            </span>
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                                <span>{pkg.name}</span>
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                                  {pkg.metric}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5">{pkg.unitDescription}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <div className="flex items-center bg-zinc-950 border border-zinc-700 focus-within:border-amber-500 rounded-xl px-2.5 py-1.5">
                              <span className="text-xs font-black text-amber-400 mr-1">$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={draftVal}
                                onChange={(e) =>
                                  setDraftDiagPrices((prev) => ({
                                    ...prev,
                                    [pkg.id]: e.target.value,
                                  }))
                                }
                                className="w-20 bg-transparent text-sm font-black text-white focus:outline-none text-right"
                              />
                              <span className="text-[10px] font-bold text-zinc-400 ml-1.5">USD</span>
                            </div>

                            <button
                              onClick={async () => {
                                const num = Math.max(0, Number(draftVal) || 0);
                                await updateDiagnosticPrice(pkg.id, num);
                                showToast(`Paquete de monetización actualizado: $${num} USD`);
                              }}
                              className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-zinc-950 border border-amber-500/40 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Guardar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. SPECIAL OFFERS TABLE */}
              {(priceSectionFilter === 'all' || priceSectionFilter === 'offers') && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <h5 className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                      <span>🔥 Ofertas Especiales "Solo por Hoy" ({specialOffers.length})</span>
                    </h5>
                    <span className="text-[11px] text-zinc-400">
                      Deja vacío para mostrar "Cotizar" o escribe monto en USD
                    </span>
                  </div>

                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl divide-y divide-zinc-800/80 overflow-hidden">
                    {specialOffers.map((offer) => {
                      const draftVal = draftOfferPrices[offer.id] ?? '';
                      return (
                        <div
                          key={offer.id}
                          className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                              <span>{offer.title}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                                {offer.subtitle}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5">{offer.description}</p>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <div className="flex items-center bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1.5">
                              <span className="text-xs font-black text-emerald-400 mr-1">$</span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="Cotizar"
                                value={draftVal}
                                onChange={(e) =>
                                  setDraftOfferPrices((prev) => ({
                                    ...prev,
                                    [offer.id]: e.target.value,
                                  }))
                                }
                                className="w-24 bg-transparent text-sm font-black text-white placeholder-zinc-500 focus:outline-none text-right"
                              />
                              <span className="text-[10px] font-bold text-zinc-400 ml-1.5">USD</span>
                            </div>

                            <button
                              onClick={async () => {
                                const trimmed = String(draftVal).trim();
                                const nextPrice =
                                  !trimmed || Number.isNaN(Number(trimmed))
                                    ? 'consultar'
                                    : Math.max(0, Number(trimmed));
                                await updateSpecialOfferPrice(offer.id, nextPrice);
                                showToast(
                                  `Oferta "${offer.title}" actualizada a ${
                                    nextPrice === 'consultar' ? 'Cotizar' : `$${nextPrice} USD`
                                  }`
                                );
                              }}
                              className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Guardar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 2: CREATE & EDIT PRODUCTS / PACKAGES (PROPOSAL #3)          */}
          {/* =============================================================== */}
          {isAdmin && activeTab === 'products' && (
            <div className="space-y-6">
              {/* Create New Product Form */}
              <form
                onSubmit={handleCreateProduct}
                className="bg-zinc-900/80 border border-purple-500/30 rounded-2xl p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <PlusCircle className="w-5 h-5 text-purple-400" />
                      <span>Crear Nuevo Producto o Paquete en el Catálogo (Propuesta #3)</span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Agrega cualquier servicio o combo nuevo con su precio en USD y velocidad de entrega.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Red Social:
                    </label>
                    <select
                      value={newProdNetwork}
                      onChange={(e) => setNewProdNetwork(e.target.value as SocialNetwork)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                      <option value="kick">Kick Streaming</option>
                      <option value="spotify">Spotify</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Nombre del Producto / Paquete:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Paquete 5K Seguidores VIP"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Cantidad / Métrica:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 5K Seg. o 10K Vistas"
                      value={newProdMetric}
                      onChange={(e) => setNewProdMetric(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Precio en USD ($):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      required
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-black text-emerald-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Descripción del Servicio:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Crecimiento acelerado con garantía de reposición de 30 días."
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Ritmo de Entrega Predeterminado:
                    </label>
                    <select
                      value={newProdDelivery}
                      onChange={(e) => setNewProdDelivery(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-purple-500"
                    >
                      <option value="48 a 72 horas">Modo Express (48 a 72 horas)</option>
                      <option value="7 días en adelante">Modo Progresivo (7 días en adelante)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newProdPopular}
                        onChange={(e) => setNewProdPopular(e.target.checked)}
                        className="rounded accent-purple-600"
                      />
                      <span>Destacar con insignia ({newProdTag || 'Popular'})</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Etiqueta (Ej. Oferta / Top)"
                      value={newProdTag}
                      onChange={(e) => setNewProdTag(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white w-36"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-950/50 transition flex items-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Publicar Producto en el Catálogo</span>
                  </button>
                </div>
              </form>

              {/* Manage / Edit / Hide Existing Products */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                    Gestionar, Editar u Ocultar Productos Existentes ({allServicesAdmin.length})
                  </h5>
                  <span className="text-[11px] text-zinc-400">
                    Puedes editar nombre, métrica, precio USD o pausar cualquier servicio
                  </span>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl divide-y divide-zinc-800/80 max-h-96 overflow-y-auto">
                  {allServicesAdmin.map((service) => {
                    const isEditing = editingServiceId === service.id;
                    const netInfo = NETWORK_INFO[service.network] || NETWORK_INFO.instagram;

                    return (
                      <div key={service.id} className="p-3.5 space-y-2.5">
                        {isEditing ? (
                          <div className="bg-zinc-950 border border-purple-500/40 rounded-xl p-3 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                              <input
                                type="text"
                                value={editServiceDraft.name}
                                onChange={(e) =>
                                  setEditServiceDraft((prev) => ({ ...prev, name: e.target.value }))
                                }
                                placeholder="Nombre del producto"
                                className="sm:col-span-2 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                              />
                              <input
                                type="text"
                                value={editServiceDraft.metric}
                                onChange={(e) =>
                                  setEditServiceDraft((prev) => ({ ...prev, metric: e.target.value }))
                                }
                                placeholder="Métrica (Ej. 1K Seg.)"
                                className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                              />
                              <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5">
                                <span className="text-xs font-bold text-emerald-400 mr-1">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={editServiceDraft.price}
                                  onChange={(e) =>
                                    setEditServiceDraft((prev) => ({ ...prev, price: e.target.value }))
                                  }
                                  className="w-full bg-transparent text-xs font-black text-white focus:outline-none"
                                />
                                <span className="text-[10px] text-zinc-400 ml-1">USD</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <input
                                type="text"
                                value={editServiceDraft.description}
                                onChange={(e) =>
                                  setEditServiceDraft((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }))
                                }
                                placeholder="Descripción"
                                className="sm:col-span-2 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                              />
                              <select
                                value={editServiceDraft.deliveryTime}
                                onChange={(e) =>
                                  setEditServiceDraft((prev) => ({
                                    ...prev,
                                    deliveryTime: e.target.value,
                                  }))
                                }
                                className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                              >
                                <option value="48 a 72 horas">Express (48 a 72 horas)</option>
                                <option value="7 días en adelante">Progresivo (7 días en adelante)</option>
                              </select>
                            </div>

                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingServiceId(null)}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => saveEditedService(service.id)}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-black cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Guardar Cambios</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${netInfo.badgeColor}`}
                              >
                                {netInfo.name}
                              </span>
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-2">
                                  <span className={service.hidden ? 'line-through text-zinc-500' : ''}>
                                    {service.name}
                                  </span>
                                  <span className="text-[11px] text-purple-400 font-semibold">
                                    ({service.metric})
                                  </span>
                                  <span className="text-xs font-black text-emerald-400">
                                    ${service.price} USD
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => startEditingService(service)}
                                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await toggleServiceHidden(service.id);
                                  showToast(
                                    service.hidden
                                      ? `Producto "${service.name}" visible nuevamente.`
                                      : `Producto "${service.name}" pausado/oculto del catálogo.`
                                  );
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                                  service.hidden
                                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {service.hidden ? 'Mostrar en Catálogo' : 'Pausar / Ocultar'}
                              </button>
                              {service.isCustom && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await deleteCustomService(service.id);
                                    showToast('Producto personalizado eliminado.');
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white transition cursor-pointer"
                                  title="Eliminar producto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3: PAYMENT METHODS & WHATSAPP EDITOR (PROPOSAL #8)          */}
          {/* =============================================================== */}
          {isAdmin && activeTab === 'payments' && (
            <form onSubmit={handleSavePaymentConfig} className="space-y-5">
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4">
                <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  <span>Editor de Datos de Pago y WhatsApp en Tiempo Real (Propuesta #8)</span>
                </h4>
                <p className="text-xs text-zinc-300 mt-1">
                  Cualquier cambio aquí actualizará de inmediato los botones de WhatsApp, el carrito, el analizador de monetización, el bot y la sección de métodos de pago.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pago Móvil Card */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-blue-400">
                    🏦 Datos de Pago Móvil (Venezuela)
                  </h5>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Nombre del Banco:
                    </label>
                    <input
                      type="text"
                      value={payBankName}
                      onChange={(e) => setPayBankName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                        Código de Banco:
                      </label>
                      <input
                        type="text"
                        value={payBankCode}
                        onChange={(e) => setPayBankCode(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                        Cédula / RIF:
                      </label>
                      <input
                        type="text"
                        value={payBankCid}
                        onChange={(e) => setPayBankCid(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Teléfono Pago Móvil:
                    </label>
                    <input
                      type="text"
                      value={payBankPhone}
                      onChange={(e) => setPayBankPhone(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 font-bold"
                    />
                  </div>
                </div>

                {/* Binance & WhatsApp Card */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-amber-400">
                    🟡 Binance Pay & 📲 WhatsApp Oficial
                  </h5>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      ID de Binance Pay Oficial:
                    </label>
                    <input
                      type="text"
                      value={payBinanceId}
                      onChange={(e) => setPayBinanceId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 font-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Número de WhatsApp (Solo dígitos con código de país):
                    </label>
                    <input
                      type="text"
                      value={payWhatsappPhone}
                      onChange={(e) => setPayWhatsappPhone(e.target.value)}
                      placeholder="584242934550"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Formato Visible de WhatsApp en la Web:
                    </label>
                    <input
                      type="text"
                      value={payWhatsappDisplay}
                      onChange={(e) => setPayWhatsappDisplay(e.target.value)}
                      placeholder="+58 424 2934550"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Datos de Pago y WhatsApp</span>
                </button>
              </div>
            </form>
          )}

          {/* =============================================================== */}
          {/* TAB 4: WHATSAPP ORDERS HISTORY (PROPOSAL #9)                    */}
          {/* =============================================================== */}
          {isAdmin && activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-cyan-400" />
                    <span>Historial y Registro de Pedidos Enviados a WhatsApp (Propuesta #9)</span>
                  </h4>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Cada pedido que un cliente envía a WhatsApp desde el catálogo, carrito o analizador queda registrado aquí automáticamente.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
                  >
                    <option value="all">Todos ({orders.length})</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="completado">Completados</option>
                    <option value="cancelado">Cancelados</option>
                  </select>

                  {orders.length > 0 && (
                    <button
                      onClick={async () => {
                        await clearOrders();
                        showToast('Historial de pedidos limpiado.');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition cursor-pointer"
                    >
                      Limpiar Historial
                    </button>
                  )}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-10 text-center space-y-2">
                  <ClipboardList className="w-10 h-10 text-zinc-600 mx-auto" />
                  <p className="text-sm font-bold text-white">
                    Aún no hay pedidos registrados en este filtro
                  </p>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Cuando un cliente pulse "Pedir por WhatsApp" en cualquier servicio, paquete o carrito, aparecerá aquí al instante con todos sus detalles.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => {
                    const dateStr = new Date(order.createdAt).toLocaleString();
                    return (
                      <div
                        key={order.id}
                        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-800">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-cyan-400 font-mono">
                              #{order.id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-[11px] text-zinc-400">{dateStr}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                              {order.source.replace('_', ' ')}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                                order.deliverySpeed === 'progressive'
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {order.deliverySpeedLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                updateOrderStatus(order.id, e.target.value as OrderStatus)
                              }
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                                order.status === 'completado'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                  : order.status === 'en_proceso'
                                  ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                                  : order.status === 'cancelado'
                                  ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                                  : 'bg-zinc-950 text-zinc-200 border-zinc-700'
                              }`}
                            >
                              <option value="pendiente">⏳ Pendiente</option>
                              <option value="en_proceso">🚀 En Proceso</option>
                              <option value="completado">✅ Completado</option>
                              <option value="cancelado">❌ Cancelado</option>
                            </select>

                            <button
                              onClick={() => copyOrderSummary(order)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedOrderId === order.id ? 'Copiado' : 'Copiar'}</span>
                            </button>

                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-600 text-zinc-400 hover:text-white transition cursor-pointer"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="md:col-span-2 space-y-1.5">
                            <div className="text-zinc-400 font-semibold">
                              Paquetes / Servicios Solicitados:
                            </div>
                            <div className="space-y-1 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800/80">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <span className="text-zinc-200 font-medium">
                                    {i + 1}. <strong>{item.name}</strong> ({item.metric}){' '}
                                    <span className="text-purple-400 font-bold">
                                      x{item.quantity}
                                    </span>
                                  </span>
                                  <span className="text-emerald-400 font-black">
                                    ${item.unitPrice * item.quantity} USD
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80 flex flex-col justify-between space-y-2">
                            <div className="space-y-1">
                              <div className="text-[11px] text-zinc-400">
                                <strong>Enlace / Cliente:</strong>{' '}
                                <span className="text-white break-all">
                                  {order.clientLink || 'Enviado por chat'}
                                </span>
                              </div>
                              <div className="text-[11px] text-zinc-400">
                                <strong>Método de Pago:</strong>{' '}
                                <span className="text-zinc-200">{order.paymentMethod}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-zinc-800 flex items-baseline justify-between">
                              <span className="text-xs font-bold text-zinc-400">Total Pedido:</span>
                              <span className="text-lg font-black text-emerald-400">
                                ${order.totalUSD} USD
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 5: SESSION, CONNECTED USERS & PDF SHORTCUTS                 */}
          {/* =============================================================== */}
          {isAdmin && activeTab === 'session' && (
            <div className="space-y-5">
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-black text-emerald-300">
                        Sesión de Administrador Activa (1/1)
                      </h4>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        Tienes el control exclusivo de Administrador. Los demás usuarios están en modo cliente y ven en vivo los precios en USD que guardes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950/70 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5 text-xs text-zinc-300">
                  <Power className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong className="text-white">Cierre automático activo:</strong> Al cerrar la pestaña o navegador, tu sesión de Administrador se cierra automáticamente.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenInstructions();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Abrir Instructivo PDF</span>
                  </button>
                  {onOpenUploadPdfs && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenUploadPdfs();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition cursor-pointer"
                    >
                      <FileUp className="w-4 h-4" />
                      <span>Subir y Guardar PDFs (1-10)</span>
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión Admin</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Usuarios Conectados en Tiempo Real ({totalUsers})</span>
                  </h4>
                  <span className="text-[11px] text-zinc-500">Máximo 1 Admin activo</span>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl divide-y divide-zinc-800/80">
                  {users.map((u) => {
                    const isMe = u.sessionId === sessionId;
                    const isUserAdmin = u.role === 'admin';
                    return (
                      <div
                        key={u.sessionId}
                        className="flex items-center justify-between px-4 py-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              isUserAdmin
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {isUserAdmin ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                              <span>Usuario #{u.userNumber}</span>
                              {isMe && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-extrabold">
                                  TÚ
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500">
                              {isUserAdmin
                                ? 'Administrador Exclusivo (Edición de precios USD, productos y pagos)'
                                : 'Modo Normal / Cliente'}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isUserAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[11px]">
                              <ShieldCheck className="w-3 h-3" />
                              Admin Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-semibold text-[11px]">
                              Normal
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
