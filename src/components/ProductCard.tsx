import React, { useState } from 'react';
import { ShoppingBag, MessageCircle, Check, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { ServiceItem } from '../types/catalog';
import { NETWORK_INFO, buildSingleProductWhatsAppMessage, buildWhatsAppLink } from '../data/catalogData';

interface ProductCardProps {
  service: ServiceItem;
  onAddToCart: (service: ServiceItem) => void;
  isInCart: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  service,
  onAddToCart,
  isInCart,
}) => {
  const [justAdded, setJustAdded] = useState(false);
  const netInfo = NETWORK_INFO[service.network];

  const handleAdd = () => {
    onAddToCart(service);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const directWaUrl = buildWhatsAppLink(buildSingleProductWhatsAppMessage(service));

  return (
    <div className={`group relative bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/50 ${netInfo.borderHover}`}>
      {/* Representative Image Container */}
      <div className="relative h-44 w-full overflow-hidden bg-zinc-950">
        <img
          src={service.image}
          alt={service.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85 group-hover:opacity-100"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

        {/* Platform Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl shadow-md uppercase tracking-wider ${netInfo.badgeColor}`}>
            {netInfo.name}
          </span>
          {service.popular && (
            <span className="text-[10px] font-black px-2 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md flex items-center gap-1 uppercase">
              <Sparkles className="w-3 h-3" />
              {service.tag || 'Popular'}
            </span>
          )}
        </div>

        {/* Price Tag Overlay */}
        <div className="absolute bottom-3 right-3 bg-zinc-950/90 border border-zinc-700/80 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg flex items-baseline gap-1">
          <span className="text-xs text-zinc-300 font-semibold">USD</span>
          <span className="text-xl font-black text-white">${service.price}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-base text-white group-hover:text-purple-300 transition-colors">
              {service.name}
            </h3>
          </div>

          <div className="inline-block px-2.5 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold mb-2.5 border border-zinc-700/60">
            {service.metric}
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 mb-3">
            {service.description}
          </p>

          {/* Idea 4: Delivery Time & Guarantee Badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1 border-t border-zinc-800/60">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 font-medium">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{service.deliveryTime || '24 - 48 hrs'}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-emerald-300 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{service.guarantee || 'Garantía 30D'}</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/80">
          {/* Add to Multi-Order Cart (Idea 1) */}
          <button
            onClick={handleAdd}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
              justAdded
                ? 'bg-purple-600 text-white'
                : isInCart
                ? 'bg-zinc-800 hover:bg-zinc-750 text-purple-300 border border-purple-500/40'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>¡Añadido al pedido!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <span>{isInCart ? 'Añadir otra unidad' : 'Añadir a mi Pedido'}</span>
              </>
            )}
          </button>

          {/* Direct WhatsApp Order */}
          <a
            href={directWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Pedir directo por WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
