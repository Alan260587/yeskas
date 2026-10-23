import React, { useState } from 'react';
import { Flame, CheckCircle2, MessageCircle, ArrowRight, Plus, Minus, ShoppingBag, Check } from 'lucide-react';
import { buildWhatsAppLink } from '../data/catalogData';
import { ServiceItem, SpecialPackage } from '../types/catalog';
import { useCatalogConfig } from '../context/CatalogConfigContext';

interface SpecialOffersProps {
  onAddToCart: (service: ServiceItem, quantity?: number) => void;
}

export const SpecialOffers: React.FC<SpecialOffersProps> = ({ onAddToCart }) => {
  const { specialOffers, paymentConfig, recordOrder } = useCatalogConfig();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedId, setAddedId] = useState<string | null>(null);

  const getQty = (id: string) => quantities[id] || 1;
  const setQty = (id: string, next: number) =>
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, next) }));

  const handleOrderOfferWhatsApp = (offer: SpecialPackage) => {
    const qty = getQty(offer.id);
    const isNumericPrice = typeof offer.price === 'number';
    const totalPrice = isNumericPrice ? (offer.price as number) * qty : 0;

    let waMessage = '';
    if (isNumericPrice) {
      waMessage = `🔥 ¡Hola! Quiero contratar la OFERTA ESPECIAL "Solo por Hoy": *${offer.title}*${qty > 1 ? ` (x${qty} paquetes)` : ''} por *$${totalPrice} USD*.\n\n• ${offer.features.join('\n• ')}\n• Ritmo de entrega: Express (48 a 72 horas) o Progresivo (7 días en adelante)\n\n¿Me confirmas los datos para Pago Móvil (${paymentConfig.pagoMovil.bankCode} / ${paymentConfig.pagoMovil.phone}) o Binance Pay (${paymentConfig.binancePayId})?`;
    } else if (offer.id === 'special-mega-ig-tt') {
      waMessage = `🔥 ¡Hola! Me interesa cotizar el paquete de *${offer.title} (${offer.subtitle})*.\n\n¿Cuáles son las opciones de entrega (Express 48-72h o Progresivo 7 días+) y métodos de pago? ¡Gracias!`;
    } else {
      waMessage = `🔥 ¡Hola! Me interesa cotizar el *${offer.title}* (${offer.subtitle}).\n\n¿Cuál es la cotización en USD y el tiempo de despliegue? ¡Gracias!`;
    }

    recordOrder({
      source: 'oferta_especial',
      clientLink: 'Por confirmar en WhatsApp',
      deliverySpeed: 'express',
      deliverySpeedLabel: 'Modo Express (48 a 72 horas)',
      paymentMethod: `Pago Móvil (${paymentConfig.pagoMovil.bankCode}) / Binance (${paymentConfig.binancePayId})`,
      items: [
        {
          name: offer.title,
          metric: offer.subtitle,
          network: offer.network,
          unitPrice: isNumericPrice ? (offer.price as number) : 0,
          quantity: qty,
        },
      ],
      totalUSD: totalPrice,
    });

    const waLink = buildWhatsAppLink(waMessage, paymentConfig.whatsappPhone);
    window.open(waLink, '_blank');
  };

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
              Campañas completas diseñadas para posicionar tu canal de YouTube o disparar tus cuentas de Instagram y TikTok. Entrega Express (48 a 72 horas) o Progresiva (7 días en adelante).
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 self-start md:self-auto">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <div className="text-xs">
              <span className="text-zinc-300 block">Cupos limitados por día</span>
              <span className="text-rose-400 font-bold">
                Reserva directa por WhatsApp ({paymentConfig.whatsappDisplay})
              </span>
            </div>
          </div>
        </div>

        {/* Offer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {specialOffers.map((offer) => {
            const qty = getQty(offer.id);
            const isJustAdded = addedId === offer.id;

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
                        <span className="text-2xl font-black text-emerald-400">
                          ${offer.price * qty}
                        </span>
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
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => setQty(offer.id, qty - 1)}
                            className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-white px-2">x{qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(offer.id, qty + 1)}
                            className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            onAddToCart(
                              {
                                id: offer.id,
                                network: offer.network,
                                name: offer.title,
                                metric: 'Oferta Solo por Hoy',
                                price: offer.price as number,
                                unit: 'Paquete Completo',
                                description: offer.description,
                                image: offer.image,
                              },
                              qty
                            );
                            setAddedId(offer.id);
                            setTimeout(() => setAddedId(null), 1200);
                          }}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
                            isJustAdded
                              ? 'bg-purple-600 text-white'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                          }`}
                        >
                          {isJustAdded ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>¡Añadido (x{qty})!</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                              <span>Añadir {qty > 1 ? `x${qty} ` : ''}al Pedido</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOrderOfferWhatsApp(offer)}
                      className="w-full py-3 px-4 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Pedir por WhatsApp ({paymentConfig.whatsappDisplay})</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
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
