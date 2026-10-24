import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { NetworkFilter } from './components/NetworkFilter';
import { ProductCard } from './components/ProductCard';
import { SpecialOffers } from './components/SpecialOffers';
import { YouTubeMonetizationCalculator } from './components/YouTubeMonetizationCalculator';
import { MultiOrderCartModal } from './components/MultiOrderCartModal';
import { ChatBot } from './components/ChatBot';
import { PaymentMethods } from './components/PaymentMethods';
import { InstructionsModal, InstructionsTabType } from './components/InstructionsModal';
import { AdminSessionModal } from './components/AdminSessionModal';
import { SessionProvider, useSession } from './context/SessionContext';
import { CatalogConfigProvider, useCatalogConfig } from './context/CatalogConfigContext';
import { buildWhatsAppLink, buildMultiOrderWhatsAppMessage } from './data/catalogData';
import { ServiceItem, CartItem, DeliverySpeedMode } from './types/catalog';
import {
  MessageCircle,
  Bot,
  ShoppingBag,
  FileText,
  ShieldCheck,
  FileUp,
  DollarSign,
  PlusCircle,
  CreditCard,
  ClipboardList,
  Plus,
  Minus,
  Trash2,
  Zap,
  Clock,
  ArrowRight,
  X,
} from 'lucide-react';

const CART_STORAGE_KEY = 'growth_viral_cart_v1';

function AppContent() {
  const { services, paymentConfig, orders, recordOrder } = useCatalogConfig();
  const { isAdmin } = useSession();

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [quickCartSpeed, setQuickCartSpeed] = useState<DeliverySpeedMode>('express');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(true);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [instructionsInitialTab, setInstructionsInitialTab] = useState<InstructionsTabType>('how');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Apertura automática de bienvenida del Bot IA 2.5 Flash (a los 4.5 segundos, 1 vez por sesión)
  useEffect(() => {
    let alreadyWelcomed = false;
    try {
      alreadyWelcomed = sessionStorage.getItem('growth_viral_bot_welcomed_v1') === '1';
    } catch {
      // ignore storage errors
    }
    if (alreadyWelcomed) return;

    const timer = window.setTimeout(() => {
      setIsBotOpen((prevBot) => {
        // Solo abre automáticamente si el usuario no tiene otro modal abierto
        if (!isCartOpen && !isInstructionsOpen && !isAdminModalOpen && !prevBot) {
          try {
            sessionStorage.setItem('growth_viral_bot_welcomed_v1', '1');
          } catch {
            // ignore
          }
          return true;
        }
        return prevBot;
      });
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [isCartOpen, isInstructionsOpen, isAdminModalOpen]);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const handleOpenInstructions = useCallback((tab: InstructionsTabType = 'how') => {
    setInstructionsInitialTab(tab);
    setIsInstructionsOpen(true);
  }, []);

  const handleOpenCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  // Sync cart unit prices when Admin modifies USD prices in real time
  useEffect(() => {
    setCart((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const updatedService = services.find((s) => s.id === item.serviceId);
        if (
          updatedService &&
          (updatedService.price !== item.unitPrice ||
            updatedService.name !== item.name ||
            updatedService.metric !== item.metric)
        ) {
          changed = true;
          return {
            ...item,
            name: updatedService.name,
            metric: updatedService.metric,
            unitPrice: updatedService.price,
          };
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, [services]);

  // Base C: Support adding 1 or multiple quantities / packages at once with zero lag
  const handleAddToCart = useCallback(
    (service: ServiceItem, quantityToAdd: number = 1, deliverySpeed?: DeliverySpeedMode) => {
      const qty = Math.max(1, quantityToAdd);
      if (deliverySpeed) {
        setQuickCartSpeed(deliverySpeed);
      }
      setCart((prev) => {
        const existing = prev.find((item) => item.serviceId === service.id);
        if (existing) {
          return prev.map((item) =>
            item.serviceId === service.id
              ? {
                  ...item,
                  unitPrice: service.price,
                  quantity: item.quantity + qty,
                  deliverySpeed: deliverySpeed || item.deliverySpeed,
                }
              : item
          );
        }
        return [
          ...prev,
          {
            id: `cart-${service.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            serviceId: service.id,
            network: service.network,
            name: service.name,
            metric: service.metric,
            unitPrice: service.price,
            quantity: qty,
            deliverySpeed: deliverySpeed || 'express',
          },
        ];
      });
    },
    []
  );

  const handleUpdateQuantity = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  // Fast O(1) lookup map for ProductCard
  const cartByServiceId = useMemo(() => {
    const map: Record<string, CartItem> = {};
    for (const item of cart) {
      map[item.serviceId] = item;
    }
    return map;
  }, [cart]);

  // Direct WhatsApp URL for the entire Cart (works for 1, 2, or more products right from the Sticky Cart Bar)
  const cartWhatsAppHref = useMemo(() => {
    if (cart.length === 0) return '#';
    const speedLabel =
      quickCartSpeed === 'express'
        ? '⚡ Modo Express (48 a 72 horas)'
        : '🌱 Modo Progresivo (7 días en adelante)';

    const message = buildMultiOrderWhatsAppMessage(
      cart.map((i) => ({
        name: i.name,
        metric: i.metric,
        network: i.network,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
      cartTotal,
      {
        usernameOrUrl: 'Lo envío por aquí en el chat',
        paymentMethod: `Pago Móvil (${paymentConfig.pagoMovil.bankCode}) / Binance (${paymentConfig.binancePayId})`,
        clientNotes: `🚀 Ritmo elegido: ${speedLabel} | 🛡️ Garantía 30D Antidrop`,
      },
      paymentConfig
    );

    return buildWhatsAppLink(message, paymentConfig.whatsappPhone);
  }, [cart, cartTotal, quickCartSpeed, paymentConfig]);

  const handleRecordDirectCartOrder = useCallback(() => {
    if (cart.length === 0) return;
    recordOrder({
      source: 'pedido_conjunto',
      clientLink: 'Por confirmar en WhatsApp',
      deliverySpeed: quickCartSpeed,
      deliverySpeedLabel:
        quickCartSpeed === 'progressive'
          ? 'Modo Progresivo (7 días en adelante)'
          : 'Modo Express (48 a 72 horas)',
      paymentMethod: `Pago Móvil (${paymentConfig.pagoMovil.bankCode}) / Binance (${paymentConfig.binancePayId})`,
      items: cart.map((i) => ({
        name: i.name,
        metric: i.metric,
        network: i.network,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
      totalUSD: cartTotal,
    });
  }, [cart, cartTotal, quickCartSpeed, paymentConfig, recordOrder]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return services.filter((service) => {
      const matchesCategory = activeCategory === 'all' || service.network === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        service.name.toLowerCase().includes(q) ||
        service.metric.toLowerCase().includes(q) ||
        service.description.toLowerCase().includes(q) ||
        service.network.toLowerCase().includes(q)
      );
    });
  }, [services, activeCategory, searchQuery]);

  // Counts for pills
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: services.length };
    services.forEach((s) => {
      map[s.network] = (map[s.network] || 0) + 1;
    });
    return map;
  }, [services]);

  const scrollToOffers = useCallback(() => {
    const el = document.getElementById('ofertas-especiales');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToCalculator = useCallback(() => {
    const el = document.getElementById('seccion-calculadora');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const generalWaUrl = useMemo(
    () =>
      buildWhatsAppLink(
        '¡Hola! Quiero consultar precios en USD y hacer un pedido de crecimiento para mis redes sociales.',
        paymentConfig.whatsappPhone
      ),
    [paymentConfig.whatsappPhone]
  );

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden bg-zinc-950 text-zinc-100 flex flex-col selection:bg-purple-600 selection:text-white ${
        cart.length > 0 ? 'pb-44 sm:pb-28' : ''
      }`}
    >
      {/* Top Navbar */}
      <Navbar
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={handleOpenCart}
        onOpenCalculator={scrollToCalculator}
        onOpenBot={() => setIsBotOpen(true)}
        onScrollToOffers={scrollToOffers}
        onOpenInstructions={() => handleOpenInstructions('how')}
        onOpenUploadPdfs={() => handleOpenInstructions('upload-pdfs')}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
      />

      {/* Exclusive Admin Quick Control Toolbar when Admin is Connected */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-emerald-950/90 via-zinc-900 to-indigo-950/90 border-b border-emerald-500/40 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-black text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>MODO ADMINISTRADOR ACTIVO (1/1):</span>
              <span className="text-zinc-300 font-medium hidden sm:inline">
                Edita todos los precios en USD, crea paquetes, modifica pagos o revisa pedidos.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition cursor-pointer shadow"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Editar Precios USD</span>
              </button>
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Crear Producto (#3)</span>
              </button>
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black transition cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Datos Pago (#8)</span>
              </button>
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Pedidos ({orders.length}) (#9)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <Hero
        onOpenCalculator={scrollToCalculator}
        onOpenCart={handleOpenCart}
        onOpenInstructions={() => handleOpenInstructions('how')}
        onOpenUploadPdfs={() => handleOpenInstructions('upload-pdfs')}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          const el = document.getElementById('catalogo-servicios');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Special Offers Section */}
      <SpecialOffers
        onAddToCart={handleAddToCart}
        onOpenCart={handleOpenCart}
        cartCount={cartCount}
      />

      {/* Monetization Calculator Section */}
      <section id="seccion-calculadora" className="py-10 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <YouTubeMonetizationCalculator
            onAddToCart={handleAddToCart}
            onOpenCart={handleOpenCart}
            cartCount={cartCount}
            cartTotal={cartTotal}
            onOpenInstructions={() => setIsInstructionsOpen(true)}
          />
        </div>
      </section>

      {/* Main Catalog Grid */}
      <main id="catalogo-servicios" className="py-10 bg-zinc-950 border-t border-zinc-900 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Catálogo de Servicios y Promociones (USD)
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Elige cantidad, selecciona <strong>Modo Express (48 a 72 horas)</strong> o <strong>Modo Progresivo (7 días en adelante)</strong> y agrega 1, 2 o más paquetes a tu carrito para mandar por WhatsApp.
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-black transition cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Editar Precios USD / Crear Paquetes</span>
              </button>
            )}
          </div>

          {/* Network Filter & Search */}
          <NetworkFilter
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            counts={counts}
          />

          {/* Products Grid */}
          {filteredServices.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/40 rounded-3xl border border-zinc-800">
              <p className="text-base font-bold text-white mb-2">
                No se encontraron servicios con ese término
              </p>
              <p className="text-xs text-zinc-400 mb-4">
                Prueba con otra palabra clave o selecciona otra categoría.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold transition cursor-pointer"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredServices.map((service) => {
                const cartItem = cartByServiceId[service.id];
                const isInCart = Boolean(cartItem);
                return (
                  <ProductCard
                    key={service.id}
                    service={service}
                    onAddToCart={handleAddToCart}
                    onOpenCart={handleOpenCart}
                    isInCart={isInCart}
                    cartQuantity={cartItem?.quantity || 0}
                    totalCartItems={cart.length}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Payment Methods & Guarantees */}
      <PaymentMethods />

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800/80 py-10 text-zinc-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <div className="font-extrabold text-sm text-white flex items-center justify-center md:justify-start gap-2 mb-1">
              <span>GROWTH VIRAL PRO</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                WhatsApp {paymentConfig.whatsappDisplay}
              </span>
            </div>
            <p className="text-zinc-500 text-xs">
              Estrategias diseñadas para hacerte crecer en Spotify, Facebook, TikTok, Instagram, YouTube y Kick. Ritmo Express (48 a 72 horas) o Progresivo (7 días en adelante).
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <a
              href={generalWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-bold transition"
            >
              Contactar por WhatsApp ({paymentConfig.whatsappDisplay})
            </a>
            <span className="text-zinc-700">•</span>
            <button
              onClick={() => setIsBotOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 font-bold transition cursor-pointer"
            >
              Bot de Respuestas 24/7
            </button>
            <span className="text-zinc-700">•</span>
            <button
              onClick={handleOpenCart}
              className="text-purple-400 hover:text-purple-300 font-bold transition cursor-pointer"
            >
              Ver mi Carrito ({cartCount})
            </button>
            <span className="text-zinc-700">•</span>
            <button
              onClick={() => handleOpenInstructions('how')}
              className="text-indigo-400 hover:text-indigo-300 font-bold transition cursor-pointer flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Instructivo PDF</span>
            </button>
            <span className="text-zinc-700">•</span>
            <button
              onClick={() => handleOpenInstructions('upload-pdfs')}
              className="text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer flex items-center gap-1"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Subir y Guardar PDFs</span>
            </button>
            <span className="text-zinc-700">•</span>
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-bold transition cursor-pointer flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Panel Admin (Precios USD)</span>
            </button>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          APARTADO DE CARRITO FIJO INFERIOR PARA MANDAR A WHATSAPP (1, 2 O MÁS PRODUCTOS)
         ========================================================================= */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/98 border-t-2 border-purple-500 shadow-2xl px-3 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            {/* Left: Selected Products Chips (shows 1, 2 or all products clearly) */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between sm:justify-start gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[11px] font-black uppercase tracking-wide">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>
                    Tu Carrito: {cart.length}{' '}
                    {cart.length === 1 ? 'Producto' : 'Productos'} ({cartCount} paq.)
                  </span>
                </span>

                {/* Quick Rhythm Switcher right in the cart bar */}
                <div className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setQuickCartSpeed('express')}
                    className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                      quickCartSpeed === 'express'
                        ? 'bg-amber-500 text-zinc-950 font-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Zap className="w-2.5 h-2.5" />
                    <span>Express 48-72h</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCartSpeed('progressive')}
                    className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                      quickCartSpeed === 'progressive'
                        ? 'bg-emerald-500 text-zinc-950 font-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    <span>Progresivo 7d+</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer ml-auto sm:ml-2"
                  title="Vaciar carrito"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Vaciar</span>
                </button>
              </div>

              {/* Horizontal list of products in the cart */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {cart.map((item, idx) => (
                  <div
                    key={item.id}
                    className="shrink-0 flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1 text-xs"
                  >
                    <span className="text-[10px] font-black text-purple-400">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white max-w-[140px] sm:max-w-[180px] truncate">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1 bg-zinc-950 rounded-lg px-1 py-0.5 border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-[11px] font-black text-emerald-400 px-1">
                        x{item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-4 h-4 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <span className="text-[11px] font-black text-white">
                      ${item.unitPrice * item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                      title="Quitar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Total + Open Full Cart + Direct Send to WhatsApp */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0 pt-1 lg:pt-0 border-t lg:border-t-0 border-zinc-800">
              <div className="text-left sm:text-right mr-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                  Total ({cart.length} prod.):
                </span>
                <span className="text-lg sm:text-2xl font-black text-emerald-400">
                  ${cartTotal} USD
                </span>
              </div>

              <button
                type="button"
                onClick={handleOpenCart}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-purple-500/50 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <span>Ver Carrito ({cart.length})</span>
              </button>

              <a
                href={cartWhatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleRecordDirectCartOrder}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/70 transition active:scale-95 cursor-pointer shrink-0"
              >
                <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                <span>Mandar a WhatsApp (${cartTotal} USD)</span>
                <ArrowRight className="w-4 h-4 hidden sm:inline shrink-0" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons (Prominently visible on both mobile and desktop) */}
      <div
        className={`fixed right-3 sm:right-6 z-[45] flex flex-col items-end gap-2 pointer-events-none transition-all duration-200 ${
          cart.length > 0 ? 'bottom-44 sm:bottom-28' : 'bottom-4 sm:bottom-6'
        }`}
      >
        {!isBotOpen && showWelcomeBubble && (
          <div className="pointer-events-auto relative max-w-[235px] sm:max-w-[270px] bg-zinc-900/95 border border-cyan-500/60 rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-cyan-950/70 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
            <button
              type="button"
              onClick={() => setShowWelcomeBubble(false)}
              className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 hover:text-white flex items-center justify-center text-[10px] cursor-pointer"
              aria-label="Cerrar saludo"
            >
              <X className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsBotOpen(true)}
              className="text-left w-full cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-black text-cyan-300 group-hover:text-cyan-200">
                  👋 ¡Hola! Soy tu Asesor IA 2.5
                </span>
              </div>
              <p className="text-[11px] text-zinc-200 leading-snug">
                ¿Te ayudo con <strong className="text-white">precios en USD</strong> o entregas <strong className="text-amber-300">Express 48-72h</strong>? Toca aquí.
              </p>
            </button>
          </div>
        )}

        {!isBotOpen && (
          <button
            type="button"
            onClick={() => setIsBotOpen(true)}
            className="pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-zinc-950/95 hover:bg-zinc-900 text-cyan-300 border-2 border-cyan-500/70 text-xs sm:text-sm font-black shadow-2xl shadow-cyan-950/80 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
            aria-label="Abrir Asesor Bot IA 2.5 Flash"
          >
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[11px] sm:text-xs font-black text-white flex items-center gap-1">
                Bot IA 2.5
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              </span>
              <span className="text-[9px] text-cyan-400 font-semibold">
                Asesor en vivo
              </span>
            </div>
          </button>
        )}

        {cart.length === 0 && (
          <a
            href={generalWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xl transition active:scale-95 border border-emerald-400/30"
            aria-label="Abrir chat en WhatsApp"
            title={`WhatsApp: ${paymentConfig.whatsappDisplay}`}
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
          </a>
        )}
      </div>

      {/* Modals */}
      <MultiOrderCartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onAddToCart={handleAddToCart}
      />

      <ChatBot
        isOpen={isBotOpen}
        onClose={() => setIsBotOpen(false)}
        onOpenCalculator={scrollToCalculator}
      />

      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        initialTab={instructionsInitialTab}
      />

      <AdminSessionModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onOpenInstructions={() => handleOpenInstructions('how')}
        onOpenUploadPdfs={() => handleOpenInstructions('upload-pdfs')}
      />
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <CatalogConfigProvider>
        <AppContent />
      </CatalogConfigProvider>
    </SessionProvider>
  );
}
