import React from 'react';
import { MessageCircle, ShieldCheck, Zap, Youtube, CheckCircle2, ShoppingBag, Sparkles, FileText } from 'lucide-react';
import { WHATSAPP_DISPLAY, buildWhatsAppLink } from '../data/catalogData';

interface HeroProps {
  onOpenCalculator: () => void;
  onOpenCart: () => void;
  onSelectCategory: (category: string) => void;
  onOpenInstructions?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenCalculator,
  onOpenCart,
  onSelectCategory,
  onOpenInstructions,
}) => {
  const generalWaUrl = buildWhatsAppLink('¡Hola! Vengo de la web y quiero consultar precios y disponibilidad para mis redes sociales.');

  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white border-b border-zinc-800/80">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700/80 text-zinc-300 text-xs sm:text-sm font-medium mb-5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-emerald-400">Atención Activa</span>
            <span className="text-zinc-500">•</span>
            <span>Contacto Directo WhatsApp: {WHATSAPP_DISPLAY}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none text-white mb-4">
            Catálogo de Promociones <br />
            <span className="bg-gradient-to-r from-rose-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              para Redes Sociales
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 mb-6 font-normal">
            Estrategias diseñadas para hacerte crecer de forma rápida y segura. Selecciona varios servicios, arma tu pedido consolidado y contrata al instante por WhatsApp.
          </p>

          {/* Key Trust Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-zinc-300 mb-8">
            <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Seguro (Sin contraseñas)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Entrega Rápida</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Binance (ID: 965190483) / Pago Móvil por WhatsApp</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
            <a
              href={generalWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-700/25 transition-all transform active:scale-95"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Escribir al WhatsApp ({WHATSAPP_DISPLAY})</span>
            </a>

            <button
              onClick={onOpenCart}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white shadow-md transition-all cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-5 h-5 text-purple-400" />
              <span>Armar Pedido Multi-Servicio</span>
            </button>

            <button
              onClick={onOpenCalculator}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Analizador de Monetización Multi-Red</span>
            </button>

            {onOpenInstructions && (
              <button
                onClick={onOpenInstructions}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/60 text-indigo-200 transition-all cursor-pointer active:scale-95"
              >
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Instructivo PDF Oficial</span>
              </button>
            )}
          </div>
        </div>

        {/* Network Quick Jump Badges */}
        <div className="mt-8 pt-6 border-t border-zinc-800/60 flex items-center justify-center flex-wrap gap-2 text-xs">
          <span className="text-zinc-300 font-medium mr-2">Explorar por red:</span>
          <button
            onClick={() => onSelectCategory('spotify')}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-green-500/30 text-emerald-400 font-semibold transition-all cursor-pointer"
          >
            🎧 Spotify Music
          </button>
          <button
            onClick={() => onSelectCategory('instagram')}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-pink-500/30 text-pink-400 font-semibold transition-all cursor-pointer"
          >
            📸 Instagram
          </button>
          <button
            onClick={() => onSelectCategory('tiktok')}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-cyan-500/30 text-cyan-400 font-semibold transition-all cursor-pointer"
          >
            🎵 TikTok
          </button>
          <button
            onClick={() => onSelectCategory('youtube')}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-red-500/30 text-red-400 font-semibold transition-all cursor-pointer"
          >
            ▶️ YouTube
          </button>
          <button
            onClick={() => onSelectCategory('facebook')}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-blue-500/30 text-blue-400 font-semibold transition-all cursor-pointer"
          >
            📘 Facebook
          </button>
          <button
            onClick={() => onSelectCategory('kick')}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/30 text-emerald-400 font-semibold transition-all cursor-pointer"
          >
            🟩 Kick Streaming
          </button>
        </div>
      </div>
    </section>
  );
};
