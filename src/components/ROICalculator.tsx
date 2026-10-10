import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  HelpCircle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp,
  Percent,
  Calculator,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { WHATSAPP_DISPLAY, BINANCE_PAY_ID, buildWhatsAppLink } from '../data/catalogData';

export type SupportedPlatform = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'kick' | 'spotify';

interface NicheOption {
  id: string;
  name: string;
  description: string;
  ratePerThousand: number; // e.g. RPM for YouTube, $/1k views, or $/stream
}

interface PlatformROIConfig {
  platformName: string;
  platformIcon: string;
  metricLabel: string;
  metricUnit: string;
  defaultMetricValue: number;
  minMetric: number;
  maxMetric: number;
  stepMetric: number;
  sliderPresets: number[];
  metricExplanation: string;
  niches: NicheOption[];
  defaultNicheId: string;
  howItCalculates: string;
  earningsDisclaimer: string;
}

const PLATFORM_ROI_CONFIGS: Record<SupportedPlatform, PlatformROIConfig> = {
  youtube: {
    platformName: 'YouTube',
    platformIcon: '📺',
    metricLabel: 'Vistas mensuales proyectadas',
    metricUnit: 'vistas/mes',
    defaultMetricValue: 50000,
    minMetric: 10000,
    maxMetric: 500000,
    stepMetric: 10000,
    sliderPresets: [25000, 50000, 100000, 250000],
    metricExplanation: 'Visitas estimadas en tus videos largos y Shorts luego de ser aceptado en el Programa de Socios de YouTube (YPP).',
    niches: [
      { id: 'finanzas', name: 'Finanzas, Cripto y Negocios', description: 'Nicho con anunciantes de alto presupuesto', ratePerThousand: 6.5 },
      { id: 'tech', name: 'Tecnología, IA y Tutoriales', description: 'Reseñas de gadgets y software', ratePerThousand: 4.2 },
      { id: 'entretenimiento', name: 'Vlogs, Gaming y Entretenimiento', description: 'Audiencia masiva y contenido recurrente', ratePerThousand: 2.2 },
      { id: 'educacion', name: 'Educación, Cursos e Idiomas', description: 'Contenido didáctico evergreen', ratePerThousand: 3.5 },
      { id: 'musica', name: 'Música y Podcasts', description: 'Consumo prolongado de audio/video', ratePerThousand: 1.8 },
    ],
    defaultNicheId: 'entretenimiento',
    howItCalculates: 'Calculado con el RPM (Ingresos por cada 1,000 reproducciones monetizadas) del Programa de Socios de YouTube según anunciantes de Google AdSense.',
    earningsDisclaimer: 'Las ganancias reales en YouTube dependen del país de la audiencia (EE.UU./España pagan mayor RPM que LATAM), duración de los videos y retención.',
  },
  tiktok: {
    platformName: 'TikTok',
    platformIcon: '🎵',
    metricLabel: 'Vistas de videos > 1 minuto',
    metricUnit: 'vistas calificadas/mes',
    defaultMetricValue: 150000,
    minMetric: 20000,
    maxMetric: 1000000,
    stepMetric: 20000,
    sliderPresets: [50000, 150000, 300000, 750000],
    metricExplanation: 'Vistas calificadas de videos mayores a 60 segundos del Creator Rewards Program (Programa de Recompensas para Creadores).',
    niches: [
      { id: 'viral', name: 'Contenido Viral, Comedia y Retos', description: 'Millones de reproducciones de consumo rápido', ratePerThousand: 0.55 },
      { id: 'negocios', name: 'Finanzas, Tips y Marketing', description: 'Mayor RPM por temática profesional', ratePerThousand: 1.2 },
      { id: 'gaming', name: 'Gaming y Streaming Highlights', description: 'Clips y partidas entretenidas', ratePerThousand: 0.7 },
      { id: 'estilo', name: 'Moda, Belleza y Lifestyle', description: 'Audiencia interesada en marcas de consumo', ratePerThousand: 0.85 },
    ],
    defaultNicheId: 'viral',
    howItCalculates: 'Calculado con la tasa de pago del TikTok Creator Rewards Program (promedio de $0.40 a $1.20 por cada 1,000 vistas calificadas mayores a 1 min).',
    earningsDisclaimer: 'El Creator Rewards Program requiere cuentas con región habilitada (EE.UU., España, etc.), contenido original y vistas con al menos 5 seg de retención.',
  },
  instagram: {
    platformName: 'Instagram',
    platformIcon: '📸',
    metricLabel: 'Alcance mensual y visualizaciones de Reels',
    metricUnit: 'reproducciones/mes',
    defaultMetricValue: 80000,
    minMetric: 15000,
    maxMetric: 600000,
    stepMetric: 15000,
    sliderPresets: [30000, 80000, 200000, 500000],
    metricExplanation: 'Reproducciones en Reels más interacción mensual estimada que desbloquea acuerdos con marcas, suscripciones y regalos.',
    niches: [
      { id: 'marcas', name: 'Patrocinios de Marcas y Colaboraciones', description: 'Cobro por Reel/Story promocional según seguidores y vistas', ratePerThousand: 2.8 },
      { id: 'regalos', name: 'Regalos en Reels y Suscripciones Fan', description: 'Monetización directa de fans en Instagram', ratePerThousand: 1.5 },
      { id: 'afiliados', name: 'Afiliados y Venta de Productos', description: 'Comisiones directas por enlaces en bio y stickers', ratePerThousand: 3.2 },
    ],
    defaultNicheId: 'marcas',
    howItCalculates: 'Estimación basada en las tarifas promedio de micro y nano influencers en LATAM por cada 1,000 impactos con audiencia fiel.',
    earningsDisclaimer: 'Instagram monetiza principalmente mediante regalos en Reels, suscripciones exclusivas y principalmente acuerdos publicitarios con marcas locales e internacionales.',
  },
  facebook: {
    platformName: 'Facebook',
    platformIcon: '📘',
    metricLabel: 'Minutos reproducidos en videos largos',
    metricUnit: 'minutos/mes',
    defaultMetricValue: 120000,
    minMetric: 30000,
    maxMetric: 1000000,
    stepMetric: 30000,
    sliderPresets: [60000, 120000, 300000, 800000],
    metricExplanation: 'Minutos reproducidos en videos de 3+ minutos en tu Fanpage monetizada con anuncios In-Stream de Meta.',
    niches: [
      { id: 'curiosidades', name: 'Historias, Curiosidades y Reflexiones', description: 'Videos virales de alta retención de 3 a 8 minutos', ratePerThousand: 1.6 },
      { id: 'noticias', name: 'Noticias, Farándula y Actualidad', description: 'Consumo diario continuo', ratePerThousand: 1.3 },
      { id: 'humor', name: 'Comedia, Sketches y Bromas', description: 'Audiencia de todas las edades con alta compartibilidad', ratePerThousand: 1.4 },
      { id: 'educacion', name: 'Tutoriales, Cocina y Hágalo Usted Mismo', description: 'Público que busca aprender', ratePerThousand: 2.1 },
    ],
    defaultNicheId: 'curiosidades',
    howItCalculates: 'Calculado en base al eCPM de anuncios In-Stream de Meta por cada 1,000 reproducciones de anuncios en videos elegibles.',
    earningsDisclaimer: 'Facebook requiere cumplir las políticas de monetización de contenido de Meta y mantener videos originales sin infracciones de copyright.',
  },
  kick: {
    platformName: 'Kick',
    platformIcon: '🟢',
    metricLabel: 'Suscriptores de pago y espectadores medios',
    metricUnit: 'suscriptores de pago',
    defaultMetricValue: 25,
    minMetric: 5,
    maxMetric: 300,
    stepMetric: 5,
    sliderPresets: [15, 30, 60, 120],
    metricExplanation: 'Suscriptores de pago en tu canal de Kick ($5 USD por sub mensual).',
    niches: [
      { id: 'subs95', name: 'División 95/5 de Suscripciones Kick', description: 'Recibes el 95% ($4.75 USD neto por cada sub de $5)', ratePerThousand: 4750 },
      { id: 'kcp', name: 'Kick Creator Program (Pago por Hora)', description: 'Suscripciones + pago estimado por horas de stream activo', ratePerThousand: 6500 },
    ],
    defaultNicheId: 'subs95',
    howItCalculates: 'Calculado con la división récord de Kick de 95% para el creador ($4.75 USD por cada suscriptor de pago) más propinas.',
    earningsDisclaimer: 'Kick paga el 95% directo de cada sub a través de Stripe o criptomonedas sin retenciones abusivas, siendo la plataforma de streaming más rentable por suscriptor.',
  },
  spotify: {
    platformName: 'Spotify',
    platformIcon: '🎧',
    metricLabel: 'Reproducciones (Streams) mensuales',
    metricUnit: 'streams/mes',
    defaultMetricValue: 40000,
    minMetric: 5000,
    maxMetric: 500000,
    stepMetric: 5000,
    sliderPresets: [10000, 30000, 75000, 200000],
    metricExplanation: 'Streams orgánicos mensuales generados en tus pistas y álbumes por usuarios Free y Premium en Spotify for Artists.',
    niches: [
      { id: 'latam', name: 'Audiencia Latinoamérica (Regalías S4)', description: 'Tasa promedio por stream en países hispanohablantes', ratePerThousand: 2.8 },
      { id: 'global', name: 'Audiencia Mixta (Global / USA / Europa)', description: 'Streams de suscriptores Premium con mayor pago por play', ratePerThousand: 4.1 },
    ],
    defaultNicheId: 'latam',
    howItCalculates: 'Calculado según las regalías oficiales de distribuidoras musicales (DistroKid, TuneCore, etc.) de aproximadamente $0.0028 a $0.0041 USD por stream.',
    earningsDisclaimer: 'Spotify exige que las pistas tengan más de 1,000 streams anuales para generar liquidación de regalías bajo sus nuevas políticas de monetización.',
  },
};

interface ROICalculatorProps {
  platform: SupportedPlatform;
  packageInvestmentUSD: number;
  channelOrAccountUrl?: string;
  onConsultPlan?: () => void;
}

export const ROICalculator: React.FC<ROICalculatorProps> = ({
  platform,
  packageInvestmentUSD,
  channelOrAccountUrl = '',
  onConsultPlan,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  const config = PLATFORM_ROI_CONFIGS[platform] || PLATFORM_ROI_CONFIGS.youtube;

  const [selectedNicheId, setSelectedNicheId] = useState<string>(config.defaultNicheId);
  const [metricValue, setMetricValue] = useState<number>(config.defaultMetricValue);

  // Sync default niche when platform changes
  React.useEffect(() => {
    setSelectedNicheId(config.defaultNicheId);
    setMetricValue(config.defaultMetricValue);
  }, [platform, config]);

  const activeNiche = useMemo(() => {
    return config.niches.find((n) => n.id === selectedNicheId) || config.niches[0];
  }, [config, selectedNicheId]);

  // Earnings calculations
  const calculations = useMemo(() => {
    let monthlyUSD = 0;

    if (platform === 'kick') {
      // metricValue is subscribers
      const subs = metricValue;
      if (selectedNicheId === 'subs95') {
        monthlyUSD = subs * 4.75;
      } else {
        // kcp: subs + estimated hourly rate
        monthlyUSD = subs * 4.75 + (subs > 20 ? 80 : 30);
      }
    } else {
      // per 1,000 rate
      monthlyUSD = (metricValue / 1000) * activeNiche.ratePerThousand;
    }

    const annualUSD = monthlyUSD * 12;

    // ROI & Payback
    const investment = Math.max(1, packageInvestmentUSD);
    const monthsToPayback = monthlyUSD > 0 ? investment / monthlyUSD : 999;
    const daysToPayback = Math.round(monthsToPayback * 30);
    const firstMonthNetProfit = monthlyUSD - investment;
    const annualNetProfit = annualUSD - investment;
    const roiPercentage = ((annualUSD - investment) / investment) * 100;

    return {
      monthlyUSD: Math.round(monthlyUSD),
      annualUSD: Math.round(annualUSD),
      daysToPayback: Math.max(7, daysToPayback),
      monthsToPayback: Number(monthsToPayback.toFixed(1)),
      firstMonthNetProfit: Math.round(firstMonthNetProfit),
      annualNetProfit: Math.round(annualNetProfit),
      roiPercentage: Math.max(0, Math.round(roiPercentage)),
    };
  }, [platform, metricValue, activeNiche, packageInvestmentUSD, selectedNicheId]);

  const handleShareOnWhatsApp = () => {
    const text = `📊 *PROYECCIÓN DE GANANCIAS Y RETORNO DE INVERSIÓN (ROI)*\n` +
      `Plataforma: *${config.platformName}* ${config.platformIcon}\n` +
      `Cuenta/Enlace: ${channelOrAccountUrl.trim() || 'Por acordar en chat'}\n` +
      `─────────────────────────\n` +
      `📌 *Nicho / Categoría:* ${activeNiche.name}\n` +
      `📈 *Métrica mensual estimada:* ${metricValue.toLocaleString()} ${config.metricUnit}\n` +
      `💰 *Ingresos estimados mensuales:* ~$${calculations.monthlyUSD.toLocaleString()} USD / mes\n` +
      `📅 *Ingresos proyectados a 1 año:* ~$${calculations.annualUSD.toLocaleString()} USD\n` +
      `💵 *Inversión en paquetes del catálogo:* $${packageInvestmentUSD} USD\n` +
      `⚡ *Tiempo estimado de retorno (Payback):* ¡Aproximadamente ${calculations.daysToPayback} días!\n` +
      `📈 *ROI estimado primer año:* +${calculations.roiPercentage}% de rendimiento\n` +
      `─────────────────────────\n` +
      `🤝 Quiero adquirir el paquete de $${packageInvestmentUSD} USD para comenzar a monetizar cuanto antes. ¿Coordinamos por Binance ID (${BINANCE_PAY_ID}) o Pago Móvil?`;

    const url = buildWhatsAppLink(text);
    window.open(url, '_blank');
  };

  return (
    <div className="mt-8 pt-8 border-t border-zinc-800/80">
      {/* Top Banner / Accordion Header */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-emerald-950/20 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/50 flex-shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" />
                Idea #20: Simulador de Retorno de Inversión (ROI)
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                ¿Cuánto dinero ganarás al monetizar tu {config.platformName}?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-xl">
                Calcula cuánto dinero generará tu cuenta mes a mes una vez aprobada tu monetización, y descubre en cuántos días recuperas tu inversión en paquetes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition cursor-pointer"
            >
              <span>{isOpen ? 'Plegar Simulador' : 'Abrir Simulador'}</span>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isOpen && (
          <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-6">
            {/* Interactive Controls Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Sliders & Niche Selection */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Niche Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      1. Selecciona tu Nicho o Tipo de Contenido:
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      Tasa: ${activeNiche.ratePerThousand} USD / 1k
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {config.niches.map((niche) => {
                      const isSelected = niche.id === selectedNicheId;
                      return (
                        <button
                          key={niche.id}
                          type="button"
                          onClick={() => setSelectedNicheId(niche.id)}
                          className={`p-3 rounded-xl text-left border transition cursor-pointer relative ${
                            isSelected
                              ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md shadow-emerald-950/50'
                              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isSelected ? 'text-emerald-300' : 'text-zinc-200'}`}>
                              {niche.name}
                            </span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                            {niche.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Metric Slider */}
                <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">
                        2. {config.metricLabel}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {config.metricExplanation}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-400">
                        {metricValue.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-zinc-400 block -mt-1">
                        {config.metricUnit}
                      </span>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <input
                    type="range"
                    min={config.minMetric}
                    max={config.maxMetric}
                    step={config.stepMetric}
                    value={metricValue}
                    onChange={(e) => setMetricValue(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                  />

                  {/* Quick Presets */}
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <span className="text-[10px] text-zinc-400 font-semibold">Presets rápidos:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {config.sliderPresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setMetricValue(preset)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            metricValue === preset
                              ? 'bg-emerald-500 text-zinc-950 font-black'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                          }`}
                        >
                          {preset >= 1000 ? `${(preset / 1000).toLocaleString()}K` : preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Explanation accordion button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="text-xs text-zinc-400 hover:text-emerald-400 transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{showExplanation ? 'Ocultar detalles de la fórmula' : '¿Cómo se calculan estos ingresos y el retorno?'}</span>
                  </button>

                  {showExplanation && (
                    <div className="mt-2.5 p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-300 space-y-2 leading-relaxed">
                      <p>
                        <strong className="text-white">Fórmula de ingresos:</strong> {config.howItCalculates}
                      </p>
                      <p className="text-zinc-400 text-[11px]">
                        <strong className="text-zinc-300">Aviso oficial:</strong> {config.earningsDisclaimer}
                      </p>
                      <p className="text-emerald-400 text-[11px] font-semibold">
                        💡 Recuerda: El primer mes monetizado cubre la inversión del paquete, y a partir de ahí todos los ingresos mensuales son ganancia pura para ti.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Earnings Summary Card & Payback Timeline */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                
                {/* Visual Earnings Card */}
                <div className="bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-950 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-2xl relative">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Ingresos Proyectados
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">
                      Estimación Real
                    </span>
                  </div>

                  {/* Main Monthly Revenue */}
                  <div className="py-4">
                    <span className="text-xs text-zinc-400 block font-medium">Estimado al Mes Monetizado:</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">
                        ${calculations.monthlyUSD.toLocaleString()}
                      </span>
                      <span className="text-sm font-bold text-zinc-300">USD / mes</span>
                    </div>
                    <span className="text-xs text-zinc-400 mt-1 block">
                      ≈ ${(calculations.monthlyUSD * 12).toLocaleString()} USD al año de ingresos pasivos
                    </span>
                  </div>

                  {/* ROI & Payback Highlight */}
                  <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Inversión en Paquetes:
                      </span>
                      <span className="font-bold text-white">
                        ${packageInvestmentUSD} USD
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        Tiempo para Recuperar (Payback):
                      </span>
                      <span className="font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                        ¡{calculations.daysToPayback} días!
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-purple-400" />
                        Rentabilidad Estimada (ROI 1er Año):
                      </span>
                      <span className="font-extrabold text-purple-300">
                        +{calculations.roiPercentage}%
                      </span>
                    </div>

                    {calculations.firstMonthNetProfit > 0 && (
                      <div className="pt-2 border-t border-zinc-800 text-[11px] text-emerald-300 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>
                          En tu mes #1 ganas <strong>${calculations.firstMonthNetProfit} USD netos</strong> luego de pagar el paquete por completo.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Action Button */}
                  <button
                    type="button"
                    onClick={handleShareOnWhatsApp}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-950/70 transition active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Compartir Proyección en WhatsApp</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>

                  <p className="text-[10px] text-zinc-400 text-center mt-2">
                    Te abre WhatsApp con el cálculo exacto de retorno para cerrar el paquete con el soporte.
                  </p>
                </div>

              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
