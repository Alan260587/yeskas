import React, { useState } from 'react';
import { CreditCard, Globe2, ShieldCheck, MessageCircle, Wallet, Copy, Check, Info } from 'lucide-react';
import { buildWhatsAppLink } from '../data/catalogData';
import { useCatalogConfig } from '../context/CatalogConfigContext';

export const PaymentMethods: React.FC = () => {
  const { paymentConfig } = useCatalogConfig();
  const [copiedBinance, setCopiedBinance] = useState(false);
  const [copiedPagoMovil, setCopiedPagoMovil] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const paymentWaLink = buildWhatsAppLink(
    `¡Hola! Quiero consultar la tasa del día para realizar mi pedido por Pago Móvil (${paymentConfig.pagoMovil.bank} ${paymentConfig.pagoMovil.bankCode}) o Binance (ID: ${paymentConfig.binancePayId}).`,
    paymentConfig.whatsappPhone
  );

  const copyBinanceId = () => {
    navigator.clipboard.writeText(paymentConfig.binancePayId);
    setCopiedBinance(true);
    setTimeout(() => setCopiedBinance(false), 2000);
  };

  const copyAllPagoMovil = () => {
    const text = `Banco: ${paymentConfig.pagoMovil.bank} (${paymentConfig.pagoMovil.bankCode})\nTeléfono: ${paymentConfig.pagoMovil.phone}\nCédula: ${paymentConfig.pagoMovil.id}`;
    navigator.clipboard.writeText(text);
    setCopiedPagoMovil(true);
    setTimeout(() => setCopiedPagoMovil(false), 2000);
  };

  const copySingleField = (fieldKey: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <section className="py-12 bg-zinc-950 border-t border-zinc-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-xl">
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-zinc-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3 uppercase tracking-wider">
                <Globe2 className="w-4 h-4" />
                Coordinación y Cuentas Verificadas
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Métodos de Pago y Datos de Transferencia
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-xl">
                Copia directamente los datos bancarios o de Binance y confirma tu pedido con tu comprobante por WhatsApp al {paymentConfig.whatsappDisplay}.
              </p>
            </div>

            <a
              href={paymentWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Consultar Tasa por WhatsApp ({paymentConfig.whatsappDisplay})</span>
            </a>
          </div>

          {/* Featured Direct Data Banners Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
            {/* 1. PAGO MOVIL BANCO DE VENEZUELA CALLOUT */}
            <div className="bg-gradient-to-br from-blue-950/40 via-zinc-900 to-blue-950/30 border border-blue-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                        Pago Móvil Oficial
                      </span>
                      <h4 className="text-base font-bold text-white">
                        {paymentConfig.pagoMovil.bank} ({paymentConfig.pagoMovil.bankCode})
                      </h4>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-500/30">
                    Bs.
                  </span>
                </div>

                {/* Account Details with individual copy buttons */}
                <div className="space-y-2 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Banco:</span>
                    <span className="font-bold text-white">
                      {paymentConfig.pagoMovil.bank} ({paymentConfig.pagoMovil.bankCode})
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-850">
                    <span className="text-zinc-400">Teléfono:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">
                        {paymentConfig.pagoMovil.phone}
                      </span>
                      <button
                        onClick={() => copySingleField('phone', paymentConfig.pagoMovil.phone)}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                        title="Copiar teléfono"
                      >
                        {copiedField === 'phone' ? '✓ Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-850">
                    <span className="text-zinc-400">Cédula:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">
                        {paymentConfig.pagoMovil.id}
                      </span>
                      <button
                        onClick={() => copySingleField('id', paymentConfig.pagoMovil.id)}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                        title="Copiar cédula"
                      >
                        {copiedField === 'id' ? '✓ Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">
                  Consulta la tasa oficial del día por WhatsApp
                </span>
                <button
                  onClick={copyAllPagoMovil}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                    copiedPagoMovil
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                  }`}
                >
                  {copiedPagoMovil ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>¡Datos Copiados!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Todos los Datos</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. BINANCE PAY CALLOUT */}
            <div className="bg-gradient-to-br from-amber-950/30 via-zinc-900 to-amber-950/20 border border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                        Binance Pay Oficial
                      </span>
                      <h4 className="text-base font-bold text-white">USDT / Criptomonedas</h4>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                    Cero Comisión
                  </span>
                </div>

                <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">ID de Binance Pay:</span>
                    <span className="font-mono text-base font-black text-amber-300 bg-zinc-900 px-2.5 py-0.5 rounded-lg border border-zinc-750">
                      {paymentConfig.binancePayId}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                    Envío instantáneo mediante la opción "Pay" en tu app de Binance. Acreditación automática al pasar captura a WhatsApp.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-emerald-400 font-semibold">
                  ✓ Acreditación inmediata
                </span>
                <button
                  onClick={copyBinanceId}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                    copiedBinance
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold shadow-md'
                  }`}
                >
                  {copiedBinance ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>¡ID Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar ID de Binance</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Summary Features Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">Pago Móvil Venezuela</span>
                <span className="text-zinc-400">
                  {paymentConfig.pagoMovil.bankCode} • {paymentConfig.pagoMovil.phone} •{' '}
                  {paymentConfig.pagoMovil.id}
                </span>
              </div>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">Binance Pay USDT</span>
                <span className="text-zinc-400">Pay ID: {paymentConfig.binancePayId}</span>
              </div>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">100% Seguro y Confiable</span>
                <span className="text-zinc-400">
                  Express (48 a 72h) • Progresivo (7 días+)
                </span>
              </div>
            </div>
          </div>

          {/* Bottom WhatsApp Note */}
          <div className="mt-6 flex items-center gap-2.5 text-xs text-zinc-300 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Recordatorio:</strong> Una vez hecha tu transferencia por Pago Móvil o Binance, envía el comprobante al WhatsApp <strong>{paymentConfig.whatsappDisplay}</strong> para iniciar la entrega del servicio de inmediato.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
