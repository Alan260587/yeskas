import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Sparkles,
  Users,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Calendar,
  Copy,
  Check,
  MessageCircle,
  RotateCcw,
  PlusCircle,
  Edit3,
  Lock,
  Award,
  FileText,
  Clock,
} from 'lucide-react';
import { useCatalogConfig } from '../context/CatalogConfigContext';
import {
  RaffleCreditRecord,
  extractBuyerInfoFromOrder,
  isRaffleMonetizationProduct,
} from '../types/catalog';

interface RafflesPanelProps {
  onShowToast?: (msg: string) => void;
}

export const RafflesPanel: React.FC<RafflesPanelProps> = ({ onShowToast }) => {
  const {
    allServicesAdmin,
    orders,
    raffleState,
    paymentConfig,
    recordOrder,
    updateOrderStatus,
    correctRaffleCycleManually,
    recordCreditMonthlyEarnings,
    updateWinnerContactInfo,
    resetRaffleState,
  } = useCatalogConfig();

  // State for resetting entire raffle system (limpiar pruebas)
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isResettingRaffles, setIsResettingRaffles] = useState<boolean>(false);

  // State for manual counter correction form (Point A)
  const [selectedOrderToRemove, setSelectedOrderToRemove] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  // State for quick simulation / order creation of the $550 product
  const [simBuyerName, setSimBuyerName] = useState<string>('');
  const [simBuyerWhatsapp, setSimBuyerWhatsapp] = useState<string>('');
  const [simMarkCompletedImmediately, setSimMarkCompletedImmediately] = useState<boolean>(true);

  // State per credit card for monthly earnings entry (Point C)
  const [monthLabels, setMonthLabels] = useState<Record<string, string>>({});
  const [monthEarnings, setMonthEarnings] = useState<Record<string, string>>({});
  const [editingWinnerId, setEditingWinnerId] = useState<string | null>(null);
  const [draftWinnerName, setDraftWinnerName] = useState<string>('');
  const [draftWinnerWa, setDraftWinnerWa] = useState<string>('');

  // Copied message feedback state (Point D)
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const notify = (msg: string) => {
    if (onShowToast) onShowToast(msg);
  };

  const handleConfirmResetRaffles = async () => {
    setIsResettingRaffles(true);
    try {
      await resetRaffleState();
      setShowResetConfirm(false);
      setSelectedOrderToRemove('');
      setCorrectionReason('');
      setCorrectionError(null);
      setEditingWinnerId(null);
      notify(
        'Estado de sorteos restablecido a su estado inicial (Ciclo #1, contador 0/2, 0 sorteos, 0 créditos) y sincronizado en todos los dispositivos.'
      );
    } finally {
      setIsResettingRaffles(false);
    }
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  // Find the $550 USD "de 0 a monetizar tu canal" product in catalog by price=550 & name
  const target550Product = useMemo(() => {
    return (
      allServicesAdmin.find((s) => isRaffleMonetizationProduct(s)) || {
        id: 'custom-youtube-1793909619457',
        network: 'youtube' as const,
        name: 'de 0 a monetizar tu canal',
        metric: 'con todas las vistas y seguidores para monetizar',
        price: 550,
        unit: 'con todas las vistas y seguidores para monetizar',
        description: 'Servicio de de 0 a monetizar tu canal garantizado.',
        image:
          'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
      }
    );
  }, [allServicesAdmin]);

  // Orders that contain the $550 product (for quick reference & status toggle)
  const ordersWith550Product = useMemo(() => {
    return orders.filter(
      (o) => Array.isArray(o.items) && o.items.some((it) => isRaffleMonetizationProduct(it))
    );
  }, [orders]);

  const currentCount = raffleState.currentCycleParticipants.length;
  const missingCount = Math.max(0, 2 - currentCount);
  const latestDraw = raffleState.drawHistory.length > 0 ? raffleState.drawHistory[0] : null;

  const handleManualCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      setCorrectionError('Ingresa el motivo de la corrección (ej. Venta cancelada o reembolsada).');
      return;
    }
    setCorrectionError(null);

    const targetOrderId =
      selectedOrderToRemove ||
      (raffleState.currentCycleParticipants.length > 0
        ? raffleState.currentCycleParticipants[raffleState.currentCycleParticipants.length - 1].orderId
        : undefined);

    await correctRaffleCycleManually({
      orderIdToRemove: targetOrderId,
      reason: correctionReason.trim(),
    });

    setCorrectionReason('');
    setSelectedOrderToRemove('');
    notify('Corrección manual aplicada y registrada en el historial de auditoría.');
  };

  const handleCreate550Order = async (e: React.FormEvent) => {
    e.preventDefault();
    const namePart = simBuyerName.trim() || 'Cliente Canal';
    const waPart = simBuyerWhatsapp.trim() || '';
    const combinedClientLink = waPart ? `${namePart} - ${waPart}` : namePart;

    const created = await recordOrder({
      source: 'catalogo_individual',
      clientLink: combinedClientLink,
      deliverySpeed: 'express',
      deliverySpeedLabel: 'Modo Express (48 a 72 horas)',
      paymentMethod: `Pago Móvil (${paymentConfig.pagoMovil.bankCode}) / Binance (${paymentConfig.binancePayId})`,
      items: [
        {
          name: target550Product.name,
          metric: target550Product.metric,
          network: target550Product.network,
          unitPrice: 550,
          quantity: 1,
        },
      ],
      totalUSD: 550,
      notes: `Participante Sorteo $550 USD (${namePart})`,
    });

    if (simMarkCompletedImmediately) {
      await updateOrderStatus(created.id, 'completado');
      notify(
        `Venta de $550 USD (${namePart}) creada y marcada como COMPLETADA. ¡El contador del sorteo se actualizó automáticamente!`
      );
    } else {
      notify(
        `Pedido de $550 USD (${namePart}) creado como PENDIENTE. No cuenta para el sorteo hasta marcarlo como Completado.`
      );
    }

    setSimBuyerName('');
    setSimBuyerWhatsapp('');
  };

  const handleRecordMonthSubmit = async (credit: RaffleCreditRecord, e: React.FormEvent) => {
    e.preventDefault();
    const defaultLabel = `Mes ${credit.months.length + 1}`;
    const label = (monthLabels[credit.id] ?? defaultLabel).trim() || defaultLabel;
    const rawEarn = monthEarnings[credit.id] ?? '';
    if (rawEarn === '' || Number.isNaN(Number(rawEarn)) || Number(rawEarn) < 0) {
      notify('Ingresa un monto válido de ganancia mensual en USD (puede ser 0 o mayor).');
      return;
    }

    const earnNum = Math.max(0, Number(rawEarn));
    await recordCreditMonthlyEarnings(credit.id, label, earnNum);

    setMonthLabels((prev) => ({ ...prev, [credit.id]: `Mes ${credit.months.length + 2}` }));
    setMonthEarnings((prev) => ({ ...prev, [credit.id]: '' }));
    notify(`Mes "${label}" registrado correctamente en la ficha de crédito de ${credit.winnerName}.`);
  };

  // Build the 3 pre-written WhatsApp messages for a credit card (Point D)
  const buildWinnerMessages = (credit: RaffleCreditRecord) => {
    const info = extractBuyerInfoFromOrder({
      id: credit.winnerOrderId,
      clientLink: `${credit.winnerName} ${credit.winnerWhatsapp} ${credit.clientLinkRaw}`,
    });

    const latestMonth =
      credit.months.length > 0 ? credit.months[credit.months.length - 1] : null;

    // (1) Aviso al ganador del sorteo con su crédito de $900 USD
    const msg1WinnerAnnouncement =
      `🎉 *¡FELICIDADES ${credit.winnerName.toUpperCase()}! GANASTE EL SORTEO DEL CICLO #${credit.cycleNumber}*\n\n` +
      `Por tu compra confirmada del paquete *"de 0 a monetizar tu canal" ($550 USD)*, resultaste ganador(a) del sorteo automático entre los 2 compradores de este ciclo.\n\n` +
      `🏆 *Premio asignado:* Crédito de *$${credit.totalCreditUSD} USD* para monetizar un canal.\n` +
      `💳 *Saldo inicial del crédito:* *$${credit.totalCreditUSD} USD*\n\n` +
      `📌 *¿Cómo funciona tu crédito?*\n` +
      `• Mientras tu canal aún no genere ingresos, tu estado es *"Esperando monetización"* y no pagas nada.\n` +
      `• Una vez monetizado, nos reportas tus ganancias mensuales por este WhatsApp y solo abonas el *50% de la ganancia de ese mes* (sin pasarte del saldo restante). Si un mes ganas $0 USD, el pago es $0 USD.\n` +
      `• Al cubrir los $${credit.totalCreditUSD} USD, tu crédito queda *100% Liquidado* y el 100% de tu monetización futura es completamente tuya.`;

    // (2) Cobro mensual con el monto a pagar y el saldo restante
    const monthName = latestMonth ? latestMonth.monthLabel : 'Mes Actual';
    const monthEarned = latestMonth ? latestMonth.reportedEarningsUSD : 0;
    const monthPay = latestMonth ? latestMonth.paymentUSD : 0;
    const balanceAfter = latestMonth
      ? latestMonth.balanceAfterUSD
      : credit.remainingBalanceUSD;

    const msg2MonthlyCollection =
      `📊 *RESUMEN MENSUAL DE TU CRÉDITO DE MONETIZACIÓN ($900 USD) — CICLO #${credit.cycleNumber}*\n\n` +
      `Hola *${credit.winnerName}*, hemos registrado el reporte de tu canal correspondiente a *${monthName}*:\n\n` +
      `• 💰 *Ganancia reportada del mes:* $${monthEarned.toFixed(2)} USD\n` +
      `• 💵 *Monto a pagar este mes (50%):* *$${monthPay.toFixed(2)} USD*\n` +
      `• 📉 *Saldo restante de tu crédito después del pago:* *$${balanceAfter.toFixed(2)} USD*\n\n` +
      (monthPay > 0
        ? `Puedes realizar el abono de *$${monthPay.toFixed(2)} USD* por Pago Móvil (${paymentConfig.pagoMovil.bank} ${paymentConfig.pagoMovil.bankCode} - Tel: ${paymentConfig.pagoMovil.phone}) o Binance Pay (ID: ${paymentConfig.binancePayId}) y enviarnos el comprobante por aquí. ¡Seguimos creciendo!`
        : `Como este mes la ganancia reportada fue de $0.00 USD, tu pago de este mes es de *$0.00 USD* y tu saldo se mantiene en *$${balanceAfter.toFixed(2)} USD* sin cargos.`);

    // (3) Felicitación cuando queda liquidado
    const msg3LiquidatedCongrats =
      `🥳🏆 *¡FELICITACIONES ${credit.winnerName.toUpperCase()}! CRÉDITO DE $900 USD 100% LIQUIDADO*\n\n` +
      `Te confirmamos oficialmente que el saldo de tu crédito del *Ciclo #${credit.cycleNumber}* ha llegado a *$0.00 USD*.\n\n` +
      `✅ *Estado oficial:* *Liquidado — el 100% de su monetización es suya.*\n\n` +
      `A partir de este momento ya no tienes ningún saldo pendiente con nosotros y el *100% de todos los ingresos de tu canal* son íntegramente tuyos. ¡Mucho éxito y gracias por confiar en nosotros!`;

    return {
      validPhoneDigits: info.validPhoneDigits,
      msg1WinnerAnnouncement,
      msg2MonthlyCollection,
      msg3LiquidatedCongrats,
    };
  };

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* HEADER BANNER: PRODUCTO $550 USD Y REGLAS DEL SORTEO AUTOMÁTICO     */}
      {/* =================================================================== */}
      <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-purple-950/40 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Automatización de Sorteos y Créditos ($900 USD)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                Producto Participante: "{target550Product.name}" (${target550Product.price} USD)
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Cada <strong>2 ventas pagadas y confirmadas (Estado: Completado)</strong> del producto de{' '}
              <strong>$550 USD ("de 0 a monetizar tu canal")</strong>, el sistema ejecuta{' '}
              <strong>automáticamente</strong> el sorteo entre los 2 compradores, asigna un{' '}
              <strong>crédito de $900 USD</strong> al ganador y reinicia el contador a <strong>0/2</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-zinc-950/90 border border-zinc-800 rounded-2xl px-4 py-3 shrink-0">
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Ciclo Actual</div>
              <div className="text-lg font-black text-amber-400">
                #{raffleState.currentCycleNumber}
              </div>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Contador</div>
              <div className="text-lg font-black text-emerald-400">{currentCount}/2</div>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Sorteos Realizados</div>
              <div className="text-lg font-black text-purple-400">
                {raffleState.drawHistory.length}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Reset Action Bar (Restablecer estado de sorteos / limpiar pruebas) */}
        <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="text-[11px] text-zinc-400">
            ¿Hiciste pruebas y deseas iniciar desde cero en todos los dispositivos?
          </div>
          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-black transition cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer estado de sorteos (limpiar pruebas)</span>
            </button>
          ) : (
            <div className="w-full sm:w-auto bg-rose-950/60 border border-rose-500/50 rounded-xl p-3 space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-rose-100 leading-relaxed">
                  <strong>¿Confirmas restablecer el sistema de sorteos a su estado inicial?</strong>
                  <p className="text-rose-200/90 mt-0.5">
                    Se borrarán todos los datos de sorteos (volverá a <strong>Ciclo #1</strong>, contador{' '}
                    <strong>0/2</strong>, sin sorteos realizados, sin fichas de crédito, sin correcciones manuales y
                    sin pedidos ya sorteados registrados) y se sincronizará en localStorage, MQTT global y Google Drive.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isResettingRaffles}
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isResettingRaffles}
                  onClick={handleConfirmResetRaffles}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-black transition cursor-pointer shadow-lg shadow-rose-950/50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {isResettingRaffles
                      ? 'Restableciendo...'
                      : 'Sí, restablecer estado de sorteos'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* POINT A: CONTADOR DEL CICLO ACTUAL (0/2, 1/2, 2/2) + COMPRADORES    */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>
                Ciclo Actual #{raffleState.currentCycleNumber} — Ventas Confirmadas ($550 USD)
              </span>
            </h4>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black border ${
                currentCount === 0
                  ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              Progreso: {currentCount}/2 ventas confirmadas
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-3.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (currentCount / 2) * 100)}%` }}
              />
            </div>

            {missingCount > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Falta{missingCount === 1 ? '' : 'n'} {missingCount} venta(s) para el sorteo — El
                  sorteo está bloqueado hasta completar las 2 ventas confirmadas (Regla 5).
                </span>
              </div>
            )}
          </div>

          {/* Buyers in Current Cycle */}
          <div className="space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
              Compradores confirmados en este ciclo ({currentCount}/2):
            </div>

            {raffleState.currentCycleParticipants.length === 0 ? (
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 text-center space-y-1">
                <p className="text-xs font-bold text-zinc-300">
                  0/2 — Aún no hay compradores confirmados en el Ciclo #{raffleState.currentCycleNumber}
                </p>
                <p className="text-[11px] text-zinc-500">
                  Cuando un pedido del paquete de $550 USD pase a estado "Completado", se agregará
                  aquí automáticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {raffleState.currentCycleParticipants.map((participant, idx) => (
                  <div
                    key={participant.orderId}
                    className="bg-zinc-950 border border-emerald-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}/2
                      </span>
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-2">
                          <span>{participant.buyerName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-cyan-400 border border-zinc-800">
                            Pedido #{participant.orderId.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-medium">
                          WhatsApp / Contacto: <strong>{participant.buyerWhatsapp}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-400 self-end sm:self-auto">
                      Confirmado: {new Date(participant.confirmedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest Automatic Draw Result Banner (Point B) */}
          {latestDraw && (
            <div className="bg-gradient-to-r from-emerald-950/50 via-zinc-950 to-amber-950/40 border border-emerald-500/50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-300 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Último Sorteo Ejecutado Automáticamente (Ciclo #{latestDraw.cycleNumber})
                </span>
                <span className="text-[11px] text-zinc-400">
                  {new Date(latestDraw.drawnAt).toLocaleString()}
                </span>
              </div>
              <div className="text-sm font-black text-white">
                🏆 Ganador(a):{' '}
                <span className="text-amber-400">{latestDraw.winner.buyerName}</span>{' '}
                <span className="text-xs font-semibold text-emerald-300">
                  ({latestDraw.winner.buyerWhatsapp})
                </span>
              </div>
              <div className="text-[11px] text-zinc-300">
                Participantes del Ciclo #{latestDraw.cycleNumber}:{' '}
                <strong>1) {latestDraw.participants[0].buyerName}</strong> y{' '}
                <strong>2) {latestDraw.participants[1].buyerName}</strong> • Crédito de{' '}
                <strong className="text-emerald-400">$900 USD</strong> creado automáticamente.
              </div>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* POINT A.2: CORRECCIÓN MANUAL DEL CONTADOR + SIMULADOR RÁPIDO        */}
        {/* =================================================================== */}
        <div className="lg:col-span-5 space-y-4">
          {/* Manual Counter Correction Form */}
          <form
            onSubmit={handleManualCorrectionSubmit}
            className="bg-zinc-900/80 border border-rose-500/30 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-400 shrink-0" />
              <h5 className="text-xs font-black uppercase tracking-wider text-rose-300">
                Corrección Manual del Contador (Cancelación / Devolución)
              </h5>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Si una venta confirmada que ya entró al ciclo se cancela o se devuelve,{' '}
              <strong>no se quita sola</strong>: corrígela manualmente aquí dejando registro de la
              fecha y el motivo.
            </p>

            {raffleState.currentCycleParticipants.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Venta confirmada en el ciclo actual a descontar:
                </label>
                <select
                  value={selectedOrderToRemove}
                  onChange={(e) => setSelectedOrderToRemove(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {raffleState.currentCycleParticipants.map((p) => (
                    <option key={p.orderId} value={p.orderId}>
                      {p.buyerName} ({p.buyerWhatsapp}) — Pedido #{p.orderId.slice(-6).toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Motivo de la corrección (Obligatorio):
              </label>
              <input
                type="text"
                value={correctionReason}
                onChange={(e) => {
                  setCorrectionReason(e.target.value);
                  setCorrectionError(null);
                }}
                placeholder="Ej. Pedido cancelado y reembolsado al comprador"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            {correctionError && (
              <div className="text-[11px] text-rose-400 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{correctionError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600/25 hover:bg-rose-600/40 text-rose-200 border border-rose-500/40 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                {raffleState.currentCycleParticipants.length > 0
                  ? 'Descontar Venta del Ciclo y Registrar Corrección'
                  : 'Registrar Nota de Corrección en Historial'}
              </span>
            </button>
          </form>

          {/* Quick Order Registrar / Simulator for $550 Product */}
          <form
            onSubmit={handleCreate550Order}
            className="bg-zinc-900/80 border border-purple-500/30 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-purple-400" />
                <span>Registrar / Simular Venta de $550 USD</span>
              </h5>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 font-bold">
                de 0 a monetizar tu canal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Nombre del Comprador:
                </label>
                <input
                  type="text"
                  value={simBuyerName}
                  onChange={(e) => setSimBuyerName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  WhatsApp (con código de país):
                </label>
                <input
                  type="text"
                  value={simBuyerWhatsapp}
                  onChange={(e) => setSimBuyerWhatsapp(e.target.value)}
                  placeholder="Ej. +584121234567"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 font-mono"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={simMarkCompletedImmediately}
                onChange={(e) => setSimMarkCompletedImmediately(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>
                Crear directamente con estado <strong className="text-emerald-400">Completado</strong>{' '}
                (suma al contador de inmediato)
              </span>
            </label>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-950/50 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Registrar Pedido de $550 USD</span>
            </button>
          </form>
        </div>
      </div>

      {/* Quick Status Switcher for Existing $550 Orders in History */}
      {ordersWith550Product.length > 0 && (
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h5 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Pedidos de "$550 USD — de 0 a monetizar tu canal" en Historial ({ordersWith550Product.length})
              </span>
            </h5>
            <span className="text-[11px] text-zinc-400">
              Solo los pedidos en estado "Completado" entran al ciclo (Pendiente y En Proceso NO cuentan)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {ordersWith550Product.map((ord) => {
              const info = extractBuyerInfoFromOrder(ord);
              const isConsumed = raffleState.consumedOrderIds.includes(ord.id);
              const isExcluded = raffleState.excludedOrderIds.includes(ord.id);
              const isInCycle = raffleState.currentCycleParticipants.some(
                (p) => p.orderId === ord.id
              );

              return (
                <div
                  key={ord.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate flex items-center gap-1.5">
                      <span>{info.buyerName}</span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        #{ord.id.slice(-5).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {info.buyerWhatsapp} •{' '}
                      {isConsumed ? (
                        <span className="text-purple-400 font-bold">Ya sorteado</span>
                      ) : isExcluded ? (
                        <span className="text-rose-400 font-bold">Excluido por corrección</span>
                      ) : isInCycle ? (
                        <span className="text-emerald-400 font-bold">En ciclo actual</span>
                      ) : (
                        <span>Sin entrar al ciclo</span>
                      )}
                    </div>
                  </div>

                  <select
                    value={ord.status}
                    onChange={(e) => updateOrderStatus(ord.id, e.target.value as any)}
                    className={`text-[11px] font-bold px-2 py-1 rounded-lg border shrink-0 ${
                      ord.status === 'completado'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : ord.status === 'en_proceso'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                        : ord.status === 'cancelado'
                        ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                        : 'bg-zinc-900 text-zinc-200 border-zinc-700'
                    }`}
                  >
                    <option value="pendiente">⏳ Pendiente</option>
                    <option value="en_proceso">🚀 En Proceso</option>
                    <option value="completado">✅ Completado</option>
                    <option value="cancelado">❌ Cancelado</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* POINT C & D: FICHAS DE CRÉDITO POR GANADOR ($900 USD) + WHATSAPP    */}
      {/* =================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>
              Fichas de Crédito por Ganador ($900 USD) y Mensajes de WhatsApp ({raffleState.credits.length})
            </span>
          </h4>
          <span className="text-xs text-zinc-400">
            Pago mensual = 50% de la ganancia del mes (máx. saldo restante). Si ganó $0 → pago $0.
          </span>
        </div>

        {raffleState.credits.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center space-y-2">
            <Trophy className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-sm font-bold text-white">
              Aún no hay fichas de crédito activas
            </p>
            <p className="text-xs text-zinc-400 max-w-lg mx-auto">
              En cuanto se completen 2 ventas confirmadas del producto de $550 USD ("de 0 a monetizar
              tu canal"), el sorteo se ejecutará automáticamente y aquí aparecerá la ficha de crédito
              de $900 USD del ganador con sus mensajes de WhatsApp listos.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {raffleState.credits.map((credit) => {
              const isLiquidated =
                credit.status === 'liquidado' || credit.remainingBalanceUSD <= 0;
              const isPaying = !isLiquidated && credit.status === 'pagando';
              const isEditingContact = editingWinnerId === credit.id;

              const draftEarnStr = monthEarnings[credit.id] ?? '';
              const draftEarnNum =
                draftEarnStr !== '' && !Number.isNaN(Number(draftEarnStr))
                  ? Math.max(0, Number(draftEarnStr))
                  : 0;
              const previewPay =
                draftEarnNum > 0
                  ? Number(
                      Math.min(draftEarnNum * 0.5, credit.remainingBalanceUSD).toFixed(2)
                    )
                  : 0;
              const previewAfter = Number(
                Math.max(0, credit.remainingBalanceUSD - previewPay).toFixed(2)
              );

              const {
                validPhoneDigits,
                msg1WinnerAnnouncement,
                msg2MonthlyCollection,
                msg3LiquidatedCongrats,
              } = buildWinnerMessages(credit);

              return (
                <div
                  key={credit.id}
                  className={`rounded-3xl border p-5 space-y-5 ${
                    isLiquidated
                      ? 'bg-emerald-950/20 border-emerald-500/50'
                      : 'bg-zinc-900/90 border-amber-500/40'
                  }`}
                >
                  {/* Credit Card Top Summary */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black">
                          Ganador Ciclo #{credit.cycleNumber}
                        </span>

                        {/* Status Badge */}
                        {isLiquidated ? (
                          <span className="px-3 py-1 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-950/50">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Liquidado — el 100% de su monetización es suya</span>
                          </span>
                        ) : isPaying ? (
                          <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black">
                            Estado: Pagando (50% mensual)
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-xl bg-zinc-800 text-amber-300 border border-amber-500/30 text-xs font-black">
                            Estado: Esperando monetización
                          </span>
                        )}
                      </div>

                      {!isEditingContact ? (
                        <div className="flex items-center gap-3 flex-wrap pt-1">
                          <h5 className="text-base sm:text-lg font-black text-white">
                            {credit.winnerName}
                          </h5>
                          <span className="text-xs text-emerald-400 font-mono font-bold">
                            WhatsApp: {credit.winnerWhatsapp}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWinnerId(credit.id);
                              setDraftWinnerName(credit.winnerName);
                              setDraftWinnerWa(
                                validPhoneDigits ? `+${validPhoneDigits}` : credit.winnerWhatsapp
                              );
                            }}
                            className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar Nombre / WhatsApp</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={draftWinnerName}
                            onChange={(e) => setDraftWinnerName(e.target.value)}
                            placeholder="Nombre del ganador"
                            className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                          <input
                            type="text"
                            value={draftWinnerWa}
                            onChange={(e) => setDraftWinnerWa(e.target.value)}
                            placeholder="+584121234567"
                            className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              await updateWinnerContactInfo(
                                credit.id,
                                draftWinnerName,
                                draftWinnerWa
                              );
                              setEditingWinnerId(null);
                              notify('Datos de contacto del ganador actualizados.');
                            }}
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-black cursor-pointer"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingWinnerId(null)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-bold cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Financial Balances */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-3 shrink-0">
                      <div className="text-center px-2">
                        <div className="text-[10px] uppercase font-bold text-zinc-400">
                          Crédito Total
                        </div>
                        <div className="text-sm sm:text-base font-black text-white">
                          ${credit.totalCreditUSD.toFixed(2)} USD
                        </div>
                      </div>
                      <div className="text-center px-2 border-x border-zinc-800">
                        <div className="text-[10px] uppercase font-bold text-zinc-400">
                          Abonado
                        </div>
                        <div className="text-sm sm:text-base font-black text-cyan-400">
                          ${(credit.totalCreditUSD - credit.remainingBalanceUSD).toFixed(2)} USD
                        </div>
                      </div>
                      <div className="text-center px-2">
                        <div className="text-[10px] uppercase font-bold text-zinc-400">
                          Saldo Restante
                        </div>
                        <div
                          className={`text-sm sm:text-base font-black ${
                            isLiquidated ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          ${credit.remainingBalanceUSD.toFixed(2)} USD
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Liquidated Celebration Banner */}
                  {isLiquidated && (
                    <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-sm font-black text-emerald-300">
                          Liquidado — el 100% de su monetización es suya
                        </div>
                        <p className="text-xs text-zinc-300">
                          Este ganador completó los $900 USD de su crédito. Su saldo restante es $0.00
                          USD y ya no debe realizar más pagos mensuales.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Form to Record Monthly Earnings + Monthly Ledger Table (Point C) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Monthly Form */}
                    <div className="lg:col-span-5 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 space-y-3">
                      <h6 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Registrar Ganancia Mensual Reportada</span>
                      </h6>

                      {isLiquidated ? (
                        <p className="text-xs text-emerald-300 font-semibold">
                          El crédito ya está 100% liquidado ($0 USD restantes). No se requieren más
                          registros mensuales.
                        </p>
                      ) : (
                        <form
                          onSubmit={(e) => handleRecordMonthSubmit(credit, e)}
                          className="space-y-3"
                        >
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                              Mes / Periodo (texto libre):
                            </label>
                            <input
                              type="text"
                              value={
                                monthLabels[credit.id] ?? `Mes ${credit.months.length + 1}`
                              }
                              onChange={(e) =>
                                setMonthLabels((prev) => ({
                                  ...prev,
                                  [credit.id]: e.target.value,
                                }))
                              }
                              placeholder="Ej. Mes 1 — Noviembre 2026"
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                              Ganancia reportada por el ganador en el mes ($ USD):
                            </label>
                            <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={draftEarnStr}
                                onChange={(e) =>
                                  setMonthEarnings((prev) => ({
                                    ...prev,
                                    [credit.id]: e.target.value,
                                  }))
                                }
                                placeholder="0.00"
                                className="w-full bg-transparent text-xs font-black text-white focus:outline-none"
                              />
                              <span className="text-[10px] font-bold text-zinc-400">USD</span>
                            </div>
                          </div>

                          {/* Automatic Calculation Preview */}
                          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 text-[11px] space-y-1">
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Pago del mes (50%, tope saldo):</span>
                              <strong className="text-emerald-400">
                                ${previewPay.toFixed(2)} USD
                              </strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Saldo después del pago:</span>
                              <strong className="text-amber-300">
                                ${previewAfter.toFixed(2)} USD
                              </strong>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-lg shadow-emerald-950/50"
                          >
                            Guardar Mes y Actualizar Saldo
                          </button>
                        </form>
                      )}
                    </div>

                    {/* Monthly History Table */}
                    <div className="lg:col-span-7 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 space-y-3">
                      <h6 className="text-xs font-black uppercase tracking-wider text-cyan-400">
                        Historial de Meses Registrados ({credit.months.length})
                      </h6>

                      {credit.months.length === 0 ? (
                        <div className="text-center py-6 text-xs text-zinc-500">
                          Sin meses registrados todavía (Estado: Esperando monetización).
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-zinc-800 text-[10px] uppercase text-zinc-400">
                                <th className="py-2 pr-2">Mes</th>
                                <th className="py-2 px-2">Ganancia Reportada</th>
                                <th className="py-2 px-2">Pago (50%)</th>
                                <th className="py-2 pl-2">Saldo Después</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/70">
                              {credit.months.map((m) => (
                                <tr key={m.id}>
                                  <td className="py-2 pr-2 font-bold text-white">
                                    {m.monthLabel}
                                    <div className="text-[10px] text-zinc-500 font-normal">
                                      {new Date(m.recordedAt).toLocaleDateString()}
                                    </div>
                                  </td>
                                  <td className="py-2 px-2 font-mono text-zinc-200">
                                    ${m.reportedEarningsUSD.toFixed(2)} USD
                                  </td>
                                  <td className="py-2 px-2 font-mono font-black text-emerald-400">
                                    ${m.paymentUSD.toFixed(2)} USD
                                  </td>
                                  <td className="py-2 pl-2 font-mono font-black text-amber-300">
                                    ${m.balanceAfterUSD.toFixed(2)} USD
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* =============================================================== */}
                  {/* POINT D: 3 PRE-WRITTEN WHATSAPP MESSAGES FOR THIS WINNER        */}
                  {/* =============================================================== */}
                  <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h6 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4" />
                        <span>
                          Mensajes de WhatsApp Redactados para {credit.winnerName}
                        </span>
                      </h6>

                      {!validPhoneDigits && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Sin número válido en el pedido — Usa "Copiar Texto" o edita el WhatsApp
                            arriba para habilitar wa.me
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Message 1: Winner Notification */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between space-y-2.5">
                        <div className="space-y-1.5">
                          <div className="text-xs font-black text-amber-300">
                            1. Aviso al Ganador ($900 USD)
                          </div>
                          <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap font-sans bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 max-h-36 overflow-y-auto">
                            {msg1WinnerAnnouncement}
                          </pre>
                        </div>
                        <div className="flex flex-col gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              copyText(`m1-${credit.id}`, msg1WinnerAnnouncement)
                            }
                            className="w-full py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {copiedKey === `m1-${credit.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>¡Texto Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar Texto</span>
                              </>
                            )}
                          </button>

                          {validPhoneDigits && (
                            <a
                              href={`https://wa.me/${validPhoneDigits}?text=${encodeURIComponent(
                                msg1WinnerAnnouncement
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Abrir wa.me/{validPhoneDigits}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Message 2: Monthly Payment Collection */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between space-y-2.5">
                        <div className="space-y-1.5">
                          <div className="text-xs font-black text-cyan-300">
                            2. Cobro Mensual (50% y Saldo)
                          </div>
                          <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap font-sans bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 max-h-36 overflow-y-auto">
                            {msg2MonthlyCollection}
                          </pre>
                        </div>
                        <div className="flex flex-col gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              copyText(`m2-${credit.id}`, msg2MonthlyCollection)
                            }
                            className="w-full py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {copiedKey === `m2-${credit.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>¡Texto Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar Texto</span>
                              </>
                            )}
                          </button>

                          {validPhoneDigits && (
                            <a
                              href={`https://wa.me/${validPhoneDigits}?text=${encodeURIComponent(
                                msg2MonthlyCollection
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Abrir wa.me/{validPhoneDigits}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Message 3: Liquidated Congratulations */}
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between space-y-2.5">
                        <div className="space-y-1.5">
                          <div className="text-xs font-black text-emerald-300">
                            3. Felicitación por Liquidación ($0)
                          </div>
                          <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap font-sans bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 max-h-36 overflow-y-auto">
                            {msg3LiquidatedCongrats}
                          </pre>
                        </div>
                        <div className="flex flex-col gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              copyText(`m3-${credit.id}`, msg3LiquidatedCongrats)
                            }
                            className="w-full py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {copiedKey === `m3-${credit.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>¡Texto Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar Texto</span>
                              </>
                            )}
                          </button>

                          {validPhoneDigits && (
                            <a
                              href={`https://wa.me/${validPhoneDigits}?text=${encodeURIComponent(
                                msg3LiquidatedCongrats
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Abrir wa.me/{validPhoneDigits}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* POINT B.2 & A.3: HISTORIAL DE SORTEOS + HISTORIAL DE CORRECCIONES   */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Draw History */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <h5 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Trophy className="w-4 h-4" />
            <span>Historial de Sorteos Realizados ({raffleState.drawHistory.length})</span>
          </h5>

          {raffleState.drawHistory.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">
              Aún no se ha disparado ningún sorteo. Se ejecutará al llegar a 2/2 ventas confirmadas.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {raffleState.drawHistory.map((draw) => (
                <div
                  key={draw.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-amber-400">
                      Ciclo #{draw.cycleNumber}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {new Date(draw.drawnAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-white font-bold">
                    🏆 Ganador: <span className="text-emerald-400">{draw.winner.buyerName}</span> (
                    {draw.winner.buyerWhatsapp})
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Participantes: 1) {draw.participants[0].buyerName} • 2){' '}
                    {draw.participants[1].buyerName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Corrections Audit Log */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <h5 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>
              Registro de Correcciones Manuales del Contador ({raffleState.corrections.length})
            </span>
          </h5>

          {raffleState.corrections.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">
              No se han registrado correcciones manuales en el contador.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {raffleState.corrections.map((corr) => (
                <div
                  key={corr.id}
                  className="bg-zinc-950 border border-rose-500/25 rounded-xl p-3 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-rose-300">
                      Ciclo #{corr.cycleNumber}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {new Date(corr.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-zinc-200 font-semibold">{corr.whatWasCorrected}</div>
                  <div className="text-[11px] text-amber-300">
                    <strong>Motivo:</strong> {corr.reason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
