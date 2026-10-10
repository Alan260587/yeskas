import React, { useState } from 'react';
import { ShoppingBag, X, Trash2, Plus, Minus, MessageCircle, ArrowRight, ShieldCheck, CheckCircle2, Zap, Clock } from 'lucide-react';
import { CartItem } from '../types/catalog';
import { WHATSAPP_DISPLAY, BINANCE_PAY_ID, PAGO_MOVIL_DATA, buildWhatsAppLink, buildMultiOrderWhatsAppMessage } from '../data/catalogData';

interface MultiOrderCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const MultiOrderCartModal: React.FC<MultiOrderCartModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [usernameOrUrl, setUsernameOrUrl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(`Pago Móvil (Banco Venezuela 0102 - ${PAGO_MOVIL_DATA.phone})`);
  const [deliverySpeed, setDeliverySpeed] = useState<'express' | 'progressive'>('express');
  const [clientNotes, setClientNotes] = useState('');

  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleSendToWhatsApp = () => {
    if (items.length === 0) return;

    const fullNotes = `🚀 Ritmo: ${deliverySpeed === 'express' ? '⚡ Express (24-48h)' : '🌱 Progresivo (3-7 días)'} | 🛡️ Garantía 30D Antidrop${clientNotes ? ' | ' + clientNotes : ''}`;

    const message = buildMultiOrderWhatsAppMessage(
      items.map((i) => ({
        name: i.name,
        metric: i.metric,
        network: i.network,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
      total,
      { usernameOrUrl, paymentMethod, clientNotes: fullNotes }
    );

    const link = buildWhatsAppLink(message);
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4.5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Mi Pedido Conjunto
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {items.length} {items.length === 1 ? 'servicio' : 'servicios'}
                </span>
              </h2>
              <p className="text-xs text-zinc-300">
                Se enviará directamente al WhatsApp {WHATSAPP_DISPLAY}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {items.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Aún no has añadido servicios a tu pedido</h3>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto mb-6">
                Explora el catálogo y pulsa en "Añadir a mi Pedido" para combinar varios servicios de Instagram, TikTok, YouTube, Facebook o Kick en un solo chat de WhatsApp.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                Ver Catálogo de Promociones
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-zinc-300 font-semibold px-1">
                  <span>Servicios seleccionados</span>
                  <button
                    onClick={onClearCart}
                    className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Vaciar todo
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((item) => {
                    const subtotal = item.unitPrice * item.quantity;
                    return (
                      <div
                        key={item.id}
                        className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {item.network}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-white">{item.name}</div>
                            <div className="text-xs text-purple-400 font-medium">
                              {item.metric} • ${item.unitPrice} c/u
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls & Price */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 self-end sm:self-auto w-full sm:w-auto">
                          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold text-white w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <div className="text-sm font-black text-emerald-400">${subtotal}</div>
                            <div className="text-[10px] text-zinc-300">USD</div>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Metadata Inputs */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <h4 className="text-xs uppercase tracking-wider text-zinc-300 font-bold">
                  Datos para tu Pedido por WhatsApp
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Enlace de tu perfil, video o canal (o tu @usuario):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. @miusuario o https://instagram.com/miusuario"
                    value={usernameOrUrl}
                    onChange={(e) => setUsernameOrUrl(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-zinc-300">
                      Método de Pago Preferido:
                    </label>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      Datos verificados
                    </span>
                  </div>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                  >
                    <option value={`Pago Móvil (Banco Venezuela 0102 - ${PAGO_MOVIL_DATA.phone})`}>
                      Pago Móvil (Banco Venezuela 0102 - {PAGO_MOVIL_DATA.phone})
                    </option>
                    <option value={`Binance Pay (ID: ${BINANCE_PAY_ID})`}>
                      Binance Pay (ID: {BINANCE_PAY_ID})
                    </option>
                    <option value="Zelle / Criptomonedas (Por WhatsApp)">
                      Zelle / Criptomonedas (Por WhatsApp)
                    </option>
                    <option value="PayPal / Otro método internacional">
                      PayPal / Otro método internacional
                    </option>
                  </select>

                  {/* Quick info helper box */}
                  <div className="mt-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 flex items-center justify-between">
                    <div>
                      {paymentMethod.includes('Pago Móvil') ? (
                        <span>
                          🏦 <strong>BDV:</strong> 0102 • Tel: <strong>{PAGO_MOVIL_DATA.phone}</strong> • C.I: <strong>{PAGO_MOVIL_DATA.id}</strong>
                        </span>
                      ) : (
                        <span>
                          🟡 <strong>Binance Pay:</strong> ID <strong>{BINANCE_PAY_ID}</strong> (Cero comisión)
                        </span>
                      )}
                    </div>
                    <span className="text-emerald-400 font-semibold text-[10px]">Verificado</span>
                  </div>
                </div>

                {/* Idea 4: Delivery Speed Selector */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Ritmo de Entrega (Para todos los paquetes):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliverySpeed('express')}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                        deliverySpeed === 'express'
                          ? 'bg-amber-500/15 border-amber-500/60 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1 text-amber-400">
                        <Zap className="w-3 h-3" />
                        <span>Modo Express (24-48h)</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Entrega acelerada</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliverySpeed('progressive')}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                        deliverySpeed === 'progressive'
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1 text-emerald-400">
                        <Clock className="w-3 h-3" />
                        <span>Modo Progresivo (3-7d)</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Drip-feed natural</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Notas adicionales o distribución del pedido (opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 'Dividir los likes en mis últimos 2 videos'"
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              {/* Guarantees */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Nunca te pediremos contraseña</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>Atención directa por WhatsApp</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer with Total and CTA */}
        {items.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-zinc-800/80 bg-zinc-900/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-300 font-semibold block">Total a pagar:</span>
                <span className="text-xs text-emerald-400 font-medium">Todos los países aplican</span>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-white">${total}</span>
                <span className="text-xs font-semibold text-zinc-300 ml-1">USD</span>
              </div>
            </div>

            <button
              onClick={handleSendToWhatsApp}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-black text-sm sm:text-base bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950/60 transition active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Enviar Pedido a WhatsApp ({WHATSAPP_DISPLAY})</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <p className="text-[11px] text-zinc-300 text-center">
              Al hacer clic se abrirá WhatsApp con el resumen de tu pedido listo para enviar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
