import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { NetworkFilter } from './components/NetworkFilter';
import { ProductCard } from './components/ProductCard';
import { SpecialOffers } from './components/SpecialOffers';
import { YouTubeMonetizationCalculator } from './components/YouTubeMonetizationCalculator';
import { MultiOrderCartModal } from './components/MultiOrderCartModal';
import { ChatBot } from './components/ChatBot';
import { PaymentMethods } from './components/PaymentMethods';
import { InstructionsModal } from './components/InstructionsModal';
import { SERVICES_DATA, WHATSAPP_DISPLAY, buildWhatsAppLink } from './data/catalogData';
import { ServiceItem, CartItem } from './types/catalog';
import { MessageCircle, Bot, ShoppingBag, ArrowUp, FileText } from 'lucide-react';

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart operations (Idea 1)
  const handleAddToCart = (service: ServiceItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.serviceId === service.id);
      if (existing) {
        return prev.map((item) =>
          item.serviceId === service.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: `cart-${service.id}-${Date.now()}`,
          serviceId: service.id,
          network: service.network,
          name: service.name,
          metric: service.metric,
          unitPrice: service.price,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
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
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return SERVICES_DATA.filter((service) => {
      const matchesCategory = activeCategory === 'all' || service.network === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        service.name.toLowerCase().includes(q) ||
        service.metric.toLowerCase().includes(q) ||
        service.description.toLowerCase().includes(q) ||
        service.network.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  // Counts for pills
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: SERVICES_DATA.length };
    SERVICES_DATA.forEach((s) => {
      map[s.network] = (map[s.network] || 0) + 1;
    });
    return map;
  }, []);

  const scrollToOffers = () => {
    const el = document.getElementById('ofertas-especiales');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToCalculator = () => {
    const el = document.getElementById('seccion-calculadora');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const generalWaUrl = buildWhatsAppLink('¡Hola! Quiero consultar precios y hacer un pedido de crecimiento para mis redes sociales.');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCalculator={scrollToCalculator}
        onOpenBot={() => setIsBotOpen(true)}
        onScrollToOffers={scrollToOffers}
        onOpenInstructions={() => setIsInstructionsOpen(true)}
      />

      {/* Hero Section */}
      <Hero
        onOpenCalculator={scrollToCalculator}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenInstructions={() => setIsInstructionsOpen(true)}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          const el = document.getElementById('catalogo-servicios');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Special Offers Section (Page 2) */}
      <SpecialOffers onAddToCart={handleAddToCart} />

      {/* Idea 7: YouTube Monetization Calculator Section */}
      <section id="seccion-calculadora" className="py-12 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <YouTubeMonetizationCalculator 
            onAddToCart={handleAddToCart}
            onOpenInstructions={() => setIsInstructionsOpen(true)}
          />
        </div>
      </section>

      {/* Main Catalog Grid (Page 1 & Page 3) */}
      <main id="catalogo-servicios" className="py-12 bg-zinc-950 border-t border-zinc-900 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Catálogo de Servicios y Promociones
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Selecciona los servicios que deseas, añádelos a tu pedido consolidado o solicita atención directa por WhatsApp (+58 424 2934550).
            </p>
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
              <p className="text-base font-bold text-white mb-2">No se encontraron servicios con ese término</p>
              <p className="text-xs text-zinc-400 mb-4">Prueba con otra palabra clave o selecciona otra categoría.</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredServices.map((service) => {
                const isInCart = cart.some((i) => i.serviceId === service.id);
                return (
                  <ProductCard
                    key={service.id}
                    service={service}
                    onAddToCart={handleAddToCart}
                    isInCart={isInCart}
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
                WhatsApp +58 424 2934550
              </span>
            </div>
            <p className="text-zinc-500 text-xs">
              Estrategias diseñadas para hacerte crecer de forma rápida y segura en Spotify, Facebook, TikTok, Instagram, YouTube y Kick.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <a
              href={generalWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-bold transition"
            >
              Contactar por WhatsApp (+58 424 2934550)
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
              onClick={() => setIsCartOpen(true)}
              className="text-purple-400 hover:text-purple-300 font-bold transition cursor-pointer"
            >
              Ver mi Pedido ({cartCount})
            </button>
            <span className="text-zinc-700">•</span>
            <button
              onClick={() => setIsInstructionsOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 font-bold transition cursor-pointer flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Instructivo PDF</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-5 right-4 sm:right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
        {/* Floating Cart Pill if items exist */}
        {cartCount > 0 && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs sm:text-sm shadow-2xl shadow-purple-950/80 hover:scale-105 transition-all cursor-pointer border border-purple-400/40"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Mi Pedido ({cartCount})</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-lg">${cartTotal}</span>
          </button>
        )}

        {/* Floating Bot button */}
        {!isBotOpen && (
          <button
            onClick={() => setIsBotOpen(true)}
            className="pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-cyan-500/40 text-xs font-bold shadow-xl transition-all cursor-pointer hover:scale-105"
            aria-label="Abrir asistente virtual"
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Bot de Respuestas</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>
        )}

        {/* Floating WhatsApp direct button */}
        <a
          href={generalWaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto w-14 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-950/80 transition-all hover:scale-110 active:scale-95 border border-emerald-400/30"
          aria-label="Abrir chat en WhatsApp"
          title={`WhatsApp: ${WHATSAPP_DISPLAY}`}
        >
          <MessageCircle className="w-7 h-7 fill-white" />
        </a>
      </div>

      {/* Modals */}
      <MultiOrderCartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      <ChatBot
        isOpen={isBotOpen}
        onClose={() => setIsBotOpen(false)}
        onOpenCalculator={scrollToCalculator}
      />

      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />
    </div>
  );
}
