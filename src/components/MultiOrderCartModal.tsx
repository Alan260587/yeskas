import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  X,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Clock,
  PlusCircle,
} from 'lucide-react';
import { CartItem, DeliverySpeedMode, ServiceItem } from '../types/catalog';
import { buildWhatsAppLink, buildMultiOrderWhatsAppMessage } from '../data/catalogData';
import { useCatalogConfig } from '../context/CatalogConfigContext';

interface MultiOrderCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onAddToCart?: (service: ServiceItem, quantity?: number, deliverySpeed?: DeliverySpeedMode) => void;
}

export const MultiOrderCartModal: React.FC<MultiOrderCartModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onAddToCart,
}) => {
  const { services, paymentConfig, recordOrder } = useCatalogConfig();

  const [usernameOrUrl, setUsernameOrUrl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(
    `Pago Móvil (${paymentConfig.pagoMovil.bank} ${paymentConfig.pagoMovil.bankCode} - ${paymentConfig.pagoMovil.phone})`
  );
  const [deliverySpeed, setDeliverySpeed] = useState<DeliverySpeedMode>('express');
  const [clientNotes, setClientNotes] = useState('');
  const [quickAddServiceId, setQuickAddServiceId] = useState<string>('');
  const [quickAddQty, setQuickAddQty] = useState<number>(1);

  useEffect(() => {
    setPaymentMethod(
      `Pago Móvil (${paymentConfig.pagoMovil.bank} ${paymentConfig.pagoMovil.bankCode} - ${paymentConfig.pagoMovil.phone})`
    );
  }, [paymentConfig]);

  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items]
  );

  const whatsappHref = useMemo(() => {
    if (items.length === 0) return '#';

    const speedLabel =
      deliverySpeed === 'express'
        ? '⚡ Modo Express (48 a 72 horas)'
        : '🌱 Modo Progresivo (7 días en adelante)';

    const fullNotes = `🚀 Ritmo: ${speedLabel} | 🛡️ Garantía 30D Antidrop${
      clientNotes ? ' | ' + clientNotes : ''
    }`;

    const message = buildMultiOrderWhatsAppMessage(
      items.map((i) => ({
        name: i.name,
        metric: `${i.metric}${
          i.deliverySpeed
            ? i.deliverySpeed === 'progressive'
              ? ' [Progresivo 7d+]'
              : ' [Express 48-72h]'
            : ''
        }`,
        network: i.network,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
      total,
      { usernameOrUrl, paymentMethod, clientNotes: fullNotes },
      paymentConfig
    );

    return buildWhatsAppLink(message, paymentConfig.whatsappPhone);
  }, [items, total, deliverySpeed, clientNotes, usernameOrUrl, paymentMethod, paymentConfig]);

  if (!isOpen) return null;

  const handleQuickAddService = () => {
    if (!onAddToCart || !quickAddServiceId) return;
    const found = services.find((s) => s.id === quickAddServiceId);
    if (found) {
      onAddToCart(found, quickAddQty, deliverySpeed);
      setQuickAddQty(1);
    }
  };

  const handleRecordOrderOnSend = () => {
    if (items.length === 0) return;

    recordOrder({
      source: 'pedido_conjunto',
      clientLink: usernameOrUrl.trim() || 'Por confirmar en WhatsApp',
      deliverySpeed,
      deliverySpeedLabel:
        deliverySpeed === 'progressive'
          ? 'Modo Progresivo (7 días en adelante)'
          : 'Modo Express (48 a 72 horas)',
      paymentMethod,
      items: items.map((i) => ({
        name: i.name,
        metric: i.metric,
        network: i.network,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })),
      totalUSD: total,
      notes: clientNotes,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-purple-500/40 rounded-3xl w-full max-w-2xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (shrink-0 so it never collapses) */}
        <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-black text-white flex items-center gap-2 flex-wrap">
                <span>Mi Carrito / Pedido Conjunto</span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-600 text-white">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'} ({totalUnits} ud.)
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-400 font-semibold">
                WhatsApp directo: {paymentConfig.whatsappDisplay} • Total: ${total} USD
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content (min-h-0 flex-1 so it ALWAYS scrolls properly even with 2, 5, or 20 products) */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Quick Add Multiple Services Selector right inside the cart */}
          {onAddToCart && (
            <div className="bg-purple-950/30 border border-purple-500/40 rounded-2xl p-3 space-y-2">
              <label className="text-xs font-black text-purple-200 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Añadir otro producto o paquete a este mismo pedido:</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={quickAddServiceId}
                  onChange={(e) => setQuickAddServiceId(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Selecciona otro paquete del catálogo para sumar...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.network.toUpperCase()}] {s.name} ({s.metric}) — ${s.price} USD
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-700 rounded-xl px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => setQuickAddQty((q) => Math.max(1, q - 1))}
                      className="w-5 h-5 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black text-white px-1.5">x{quickAddQty}</span>
                    <button
                      type="button"
                      onClick={() => setQuickAddQty((q) => q + 1)}
                      className="w-5 h-5 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={!quickAddServiceId}
                    onClick={handleQuickAddService}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-black transition cursor-pointer whitespace-nowrap"
                  >
                    + Sumar al Carrito
                  </button>
                </div>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Tu carrito está vacío
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto mb-5">
                Selecciona arriba un paquete o agrega 1, 2 o más productos desde el catálogo para enviarlos juntos en un solo pedido de WhatsApp.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                Explorar Catálogo de Productos
              </button>
            </div>
          ) : (
            <>
              {/* Selected Items List */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs text-zinc-300 font-bold px-1">
                  <span>
                    Productos en tu carrito ({items.length}{' '}
                    {items.length === 1 ? 'producto' : 'productos distintos'}):
                  </span>
                  <button
                    onClick={onClearCart}
                    className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Vaciar carrito
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const subtotal = item.unitPrice * item.quantity;
                    return (
                      <div
                        key={item.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="flex items-start sm:items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-300 font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700 shrink-0">
                            {item.network}
                          </span>
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-white leading-snug">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-purple-300 font-medium">
                              {item.metric} • ${item.unitPrice} USD c/u
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls & Price */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
                          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black text-white w-6 text-center">
                              x{item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-right min-w-[65px]">
                            <div className="text-sm font-black text-emerald-400">
                              ${subtotal} USD
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Details Form */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-emerald-400 font-black flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Datos para Mandar tu Pedido a WhatsApp</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Tu enlace o usuario (opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. @miusuario o link de tu perfil/canal"
                      value={usernameOrUrl}
                      onChange={(e) => setUsernameOrUrl(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Método de Pago Preferido:
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option
                        value={`Pago Móvil (${paymentConfig.pagoMovil.bank} ${paymentConfig.pagoMovil.bankCode} - ${paymentConfig.pagoMovil.phone})`}
                      >
                        Pago Móvil ({paymentConfig.pagoMovil.bank} {paymentConfig.pagoMovil.bankCode})
                      </option>
                      <option value={`Binance Pay (ID: ${paymentConfig.binancePayId})`}>
                        Binance Pay (ID: {paymentConfig.binancePayId})
                      </option>
                      <option value="Zelle / Criptomonedas (Por WhatsApp)">
                        Zelle / Criptomonedas
                      </option>
                      <option value="PayPal / Otro método internacional">
                        PayPal / Otro método
                      </option>
                    </select>
                  </div>
                </div>

                {/* Delivery Speed Selector (Express 48-72h vs Progresivo 7 días en adelante) */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1.5">
                    Ritmo y Velocidad de Entrega:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliverySpeed('express')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        deliverySpeed === 'express'
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-black flex items-center gap-1 text-amber-400">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Modo Express</span>
                      </div>
                      <div className="text-[11px] font-bold text-white">48 a 72 horas</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliverySpeed('progressive')}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        deliverySpeed === 'progressive'
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-black flex items-center gap-1 text-emerald-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Modo Progresivo</span>
                      </div>
                      <div className="text-[11px] font-bold text-white">7 días en adelante</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Notas adicionales o cómo repartir tus paquetes (opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 'Repartir los likes en mis últimos 2 videos'"
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ALWAYS-VISIBLE STICKY FOOTER FOR WHATSAPP SEND (shrink-0 guarantees it NEVER disappears with 2+ products) */}
        {items.length > 0 && (
          <div className="shrink-0 p-4 sm:p-5 border-t border-emerald-500/40 bg-gradient-to-r from-zinc-900 via-emerald-950/40 to-zinc-900 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Resumen: {items.length}{' '}
                    {items.length === 1 ? 'producto' : 'productos'} ({totalUnits} paq.)
                  </span>
                </div>
                <span className="text-[11px] text-emerald-300 font-semibold block">
                  Ritmo:{' '}
                  {deliverySpeed === 'express'
                    ? '⚡ Express (48 a 72 horas)'
                    : '🌱 Progresivo (7 días en adelante)'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-zinc-300 font-bold mr-1">Total:</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  ${total}
                </span>
                <span className="text-xs font-bold text-white ml-1">USD</span>
              </div>
            </div>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleRecordOrderOnSend}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-black text-sm sm:text-base bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60 transition active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-white shrink-0" />
              <span>
                Mandar Pedido ({items.length}{' '}
                {items.length === 1 ? 'Producto' : 'Productos'}) a WhatsApp — ${total} USD
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
