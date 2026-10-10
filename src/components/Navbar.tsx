import React, { useState } from 'react';
import { ShoppingBag, MessageCircle, Sparkles, Youtube, Flame, Share2, Check, FileText } from 'lucide-react';
import { WHATSAPP_DISPLAY, buildWhatsAppLink } from '../data/catalogData';

interface NavbarProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenCalculator: () => void;
  onOpenBot: () => void;
  onScrollToOffers: () => void;
  onOpenInstructions: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenCalculator,
  onOpenBot,
  onScrollToOffers,
  onOpenInstructions,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const directWaUrl = buildWhatsAppLink('¡Hola! Me gustaría consultar información sobre los servicios del catálogo de crecimiento en redes.');

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  GROWTH VIRAL
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Catálogo Oficial • WhatsApp {WHATSAPP_DISPLAY}
              </p>
            </div>
          </div>

          {/* Center Navigation Shortcuts */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={onScrollToOffers}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" />
              Solo por Hoy
            </button>
            <button
              onClick={onOpenCalculator}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Analizador de Monetización
            </button>
            <button
              onClick={onOpenInstructions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Instructivo PDF
            </button>
            <button
              onClick={onOpenBot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Bot 24/7
            </button>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Instructivo PDF trigger for mobile / tablet */}
            <button
              onClick={onOpenInstructions}
              className="flex lg:hidden items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 transition-all cursor-pointer"
              title="Ver y descargar Instructivo PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Manual PDF</span>
            </button>
            {/* Share link button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95"
              title="Copiar enlace para compartir"
              aria-label="Compartir enlace"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-zinc-400" />
                  <span className="hidden sm:inline">Compartir</span>
                </>
              )}
            </button>

            {/* WhatsApp Direct Link Button */}
            <a
              href={directWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span className="hidden sm:inline">WhatsApp:</span>
              <span>{WHATSAPP_DISPLAY}</span>
            </a>

            {/* Cart & Multi-Order Trigger */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white transition-all cursor-pointer active:scale-95 shadow-sm"
              aria-label="Ver pedido conjunto"
            >
              <ShoppingBag className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Mi Pedido</span>
              {cartCount > 0 ? (
                <span className="flex items-center gap-1 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {cartCount} • ${cartTotal}
                </span>
              ) : (
                <span className="text-zinc-400 text-xs">$0</span>
              )}

              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
