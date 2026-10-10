import React from 'react';
import { Flame, CheckCircle2, MessageCircle, ArrowRight } from 'lucide-react';
import { SPECIAL_OFFERS, WHATSAPP_DISPLAY, buildWhatsAppLink } from '../data/catalogData';
import { ServiceItem } from '../types/catalog';

interface SpecialOffersProps {
  onAddToCart: (service: ServiceItem) => void;
}

export const SpecialOffers: React.FC<SpecialOffersProps> = ({ onAddToCart }) => {
  return (
    <section id="ofertas-especiales" className="py-12 bg-zinc-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3 uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-amber-400" />
              Ofertas Especiales "Solo por Hoy"
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Paquetes Estratégicos de Alto Impacto
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl">
              Campañas completas diseñadas para posicionar tu canal de YouTube o disparar tus cuentas de Instagram y TikTok.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 self-start md:self-auto">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <div className="text-xs">
              <span className="text-zinc-300 block">Cupos limitados por día</span>
              <span className="text-rose-400 font-bold">Reserva directa por WhatsApp</span>
            </div>
          </div>
        </div>

        {/* Offer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SPECIAL_OFFERS.map((offer) => {
            let waMessage = '';
            if (offer.id === 'special-yt-basic') {
              waMessage = `🔥 ¡Hola! Quiero contratar la OFERTA ESPECIAL "Solo por Hoy": *Impulso YouTube Básico ($15)*.\n\n• 358 Likes garantizados\n• 1000 Vistas en mi video preferido\n\n¿Cuáles son los datos de pago para procesar mi orden?`;
            } else if (offer.id === 'special-mega-ig-tt') {
              waMessage = `🔥 ¡Hola! Me interesa cotizar el paquete de *Mega Crecimiento IG & TikTok (10,000 Seguidores)*.\n\n¿Cuáles son las opciones de entrega y métodos de pago? ¡Gracias!`;
            } else {
              waMessage = `🔥 ¡Hola! Me interesa cotizar el *Plan YouTube Viral - Campaña Masiva* de 1 Millón de Visitas + 10,000 Likes + 1,000 Comentarios.\n\n¿Cuál es la cotización y tiempo de despliegue? ¡Gracias!`;
            }

            const waLink = buildWhatsAppLink(waMessage);

            return (
              <div
                key={offer.id}
                className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 hover:border-amber-500/40 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-amber-950/20 group"
              >
                {/* Image */}
                <div className="relative h-44 w-full overflow-hidden bg-zinc-950">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

                  {/* Header Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="text-[11px] font-black px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 fill-white" />
                      Solo por Hoy
                    </span>
                  </div>

                  {/* Price Tag */}
                  <div className="absolute bottom-3 right-3 bg-zinc-950/90 border border-zinc-700/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-lg">
                    {typeof offer.price === 'number' ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-zinc-300 font-semibold">USD</span>
                        <span className="text-2xl font-black text-emerald-400">${offer.price}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
                        Cotizar
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                      {offer.title}
                    </h3>
                    <p className="text-xs font-semibold text-amber-400/90 mt-0.5 mb-2.5">
                      {offer.subtitle}
                    </p>
                    <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                      {offer.description}
                    </p>

                    {/* Features list */}
                    <div className="space-y-2 bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800/80">
                      {offer.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    {typeof offer.price === 'number' && (
                      <button
                        onClick={() =>
                          onAddToCart({
                            id: offer.id,
                            network: offer.network,
                            name: offer.title,
                            metric: 'Oferta Solo por Hoy',
                            price: offer.price as number,
                            unit: 'Paquete Completo',
                            description: offer.description,
                            image: offer.image,
                          })
                        }
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition cursor-pointer active:scale-95"
                      >
                        Añadir paquete a mi Pedido 🛒
                      </button>
                    )}

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2 active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Pedir por WhatsApp ({WHATSAPP_DISPLAY})</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
