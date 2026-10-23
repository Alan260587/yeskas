import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  Check, 
  Copy, 
  Eye, 
  EyeOff,
  ShieldCheck, 
  MessageCircle, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  KeyRound, 
  AlertCircle,
  ShieldAlert,
  FileUp
} from 'lucide-react';
import { generateInstructionsPDF } from '../utils/generateInstructionsPDF';
import { useSession } from '../context/SessionContext';
import { useCatalogConfig } from '../context/CatalogConfigContext';
import { PdfUploadManager } from './PdfUploadManager';
import { fetchAndSyncSavedPdfs } from '../utils/pdfStorage';

export type InstructionsTabType = 'how' | 'client' | 'admin' | 'whatsapp' | 'requirements' | 'upload-pdfs';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: InstructionsTabType;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose, initialTab = 'how' }) => {
  const {
    isAdmin: isAdminUnlocked,
    isAdminOccupiedByOther,
    activeAdminUserNumber,
    totalUsers,
    myUserNumber,
    loginAdmin,
    logoutAdmin,
  } = useSession();
  const { paymentConfig } = useCatalogConfig();

  const [activeTab, setActiveTab] = useState<InstructionsTabType>(initialTab);
  const [savedPdfCount, setSavedPdfCount] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      fetchAndSyncSavedPdfs().then((docs) => setSavedPdfCount(docs.length));
    }
  }, [isOpen, initialTab]);

  // Modal / prompt for locked action (download / print / direct unlock)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTarget, setAuthModalTarget] = useState<'download' | 'print' | 'tab-admin' | 'tab-whatsapp' | 'general'>('general');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState('Contraseña incorrecta. Inténtalo de nuevo.');
  const [showPin, setShowPin] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Inline PIN input for Tab lock screen
  const [inlinePin, setInlinePin] = useState('');
  const [inlinePinError, setInlinePinError] = useState(false);
  const [inlinePinErrorMessage, setInlinePinErrorMessage] = useState('Contraseña incorrecta. Inténtalo de nuevo.');
  const [showInlinePin, setShowInlinePin] = useState(false);

  if (!isOpen) return null;

  // Direct download PDF
  const executeDownloadPDF = () => {
    try {
      setIsDownloading(true);
      generateInstructionsPDF(paymentConfig);
      setTimeout(() => setIsDownloading(false), 900);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setIsDownloading(false);
    }
  };

  // Protected download handler
  const handleDownloadPDF = () => {
    if (isAdminUnlocked) {
      executeDownloadPDF();
    } else {
      setAuthModalTarget('download');
      setPinInput('');
      setPinError(false);
      setIsAuthModalOpen(true);
    }
  };

  // Protected print handler
  const handlePrint = () => {
    if (isAdminUnlocked) {
      window.print();
    } else {
      setAuthModalTarget('print');
      setPinInput('');
      setPinError(false);
      setIsAuthModalOpen(true);
    }
  };

  // Unlock verification for modal dialog (with server-backed 1-admin-at-a-time check)
  const handleVerifyAuthModal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsVerifyingPin(true);
    const result = await loginAdmin(pinInput);
    setIsVerifyingPin(false);

    if (result.ok) {
      setIsAuthModalOpen(false);
      setPinError(false);
      const target = authModalTarget;
      setPinInput('');

      // Perform pending action if applicable
      if (target === 'download') {
        setTimeout(() => executeDownloadPDF(), 150);
      } else if (target === 'print') {
        setTimeout(() => window.print(), 150);
      } else if (target === 'tab-admin') {
        setActiveTab('admin');
      } else if (target === 'tab-whatsapp') {
        setActiveTab('whatsapp');
      }
    } else {
      setPinError(true);
      setPinErrorMessage(result.message);
    }
  };

  // Unlock verification for inline tab lock screen (with server-backed 1-admin-at-a-time check)
  const handleVerifyInline = async (targetTab?: 'admin' | 'whatsapp') => {
    setIsVerifyingPin(true);
    const result = await loginAdmin(inlinePin);
    setIsVerifyingPin(false);

    if (result.ok) {
      setInlinePin('');
      setInlinePinError(false);
      if (targetTab) {
        setActiveTab(targetTab);
      }
    } else {
      setInlinePinError(true);
      setInlinePinErrorMessage(result.message);
    }
  };

  // Re-lock manually & release exclusive Admin slot
  const handleLockAgain = async () => {
    await logoutAdmin();
    if (activeTab === 'admin' || activeTab === 'whatsapp') {
      setActiveTab('how');
    }
  };

  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedScript(id);
      setTimeout(() => setCopiedScript(null), 2000);
    }
  };

  const sampleWaMessage = `🎯 *PLAN DE MONETIZACIÓN OFICIAL: YOUTUBE*

¡Hola! He diagnosticado mi cuenta en el catálogo y quiero coordinar mi pedido:

📺 *Canal o usuario:* https://youtube.com/@mi_canal_creador

📊 *SITUACIÓN ACTUAL VS REQUISITOS:*
• Horas de reproducción: 1,200h ➜ *Faltan: 2,800h* (Meta: 4,000h)
• Suscriptores: 350 subs ➜ *Faltan: 650 subs* (Meta: 1,000 subs)

📦 *PAQUETES DEL CATÁLOGO PARA MONETIZAR (CON GARANTÍA):*
1. *1x Combo 3,000 Horas YouTube* (Garantía 30 días | Progresivo 7 días en adelante) ➜ *$65 USD*
2. *1x 1,000 Suscriptores Reales YouTube* (Garantía 30 días | Express 48 a 72 horas) ➜ *$35 USD*
─────────────────────────
⚡ *Ritmo y velocidad de entrega:* Modo Progresivo (7 días en adelante) / Modo Express (48 a 72 horas)
💰 *PRESUPUESTO TOTAL ESTIMADO:* *$100 USD*

🤝 *Quiero ponerme de acuerdo contigo por aquí:*
Para confirmar la tasa para Pago Móvil (${paymentConfig.pagoMovil.bank} ${paymentConfig.pagoMovil.bankCode}) o Binance Pay (ID: ${paymentConfig.binancePayId}), coordinar el inicio y recibir el soporte. ¡Quedo atento!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-8 py-4 sm:py-5 border-b border-zinc-850 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Instructivo y Manual Oficial de Operaciones
                </h2>
                {isAdminUnlocked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Unlock className="w-3 h-3 text-emerald-400" />
                    Admin Activo (1/1 • Usuario #{myUserNumber})
                  </span>
                ) : isAdminOccupiedByOther ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    Admin Ocupado (1/1 por Usuario #{activeAdminUserNumber ?? 1})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    <Lock className="w-3 h-3 text-amber-400" />
                    Modo Normal • Clave Admin: ****
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-cyan-300 border border-zinc-700">
                  👥 {totalUsers} en línea
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Guía completa: Cómo se usa, Qué ve el Cliente, Qué ves Tú y Qué te llega por WhatsApp. (Cierre automático al cerrar página).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {/* Quick Upload & Save PDFs button */}
            <button
              onClick={() => setActiveTab('upload-pdfs')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 ${
                activeTab === 'upload-pdfs'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-950/50'
                  : 'bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border-emerald-500/40'
              }`}
              title="Subir y guardar 1 o hasta 10 archivos PDF"
            >
              <FileUp className="w-4 h-4 text-emerald-300" />
              <span>Subir / Guardar PDFs ({savedPdfCount}/10)</span>
            </button>

            {/* Quick Lock / Unlock button */}
            {isAdminUnlocked ? (
              <button
                onClick={handleLockAgain}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 hover:text-white text-xs font-semibold border border-rose-500/40 transition cursor-pointer"
                title="Cerrar sesión de Administrador y volver a modo usuario normal"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Cerrar Admin</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthModalTarget('general');
                  setPinInput('');
                  setPinError(false);
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 text-xs font-semibold border border-amber-500/30 transition cursor-pointer"
                title="Desbloquear opciones de Administrador con contraseña"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAdminOccupiedByOther ? 'Admin en Uso (1/1)' : 'Desbloquear Admin'}</span>
              </button>
            )}

            {/* Download PDF button (Protected with password) */}
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition cursor-pointer active:scale-95 disabled:opacity-50 ${
                isAdminUnlocked
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30'
                  : 'bg-zinc-800 hover:bg-zinc-750 text-amber-300 border border-amber-500/40 shadow-amber-950/20'
              }`}
              title={isAdminUnlocked ? 'Descargar PDF oficial' : 'Requiere contraseña (****) para descargar'}
            >
              {isAdminUnlocked ? (
                <Download className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400" />
              )}
              <span>{isDownloading ? 'Generando...' : isAdminUnlocked ? 'Descargar PDF' : 'Descargar PDF 🔒'}</span>
            </button>

            {/* Print button (Protected with password) */}
            <button
              onClick={handlePrint}
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isAdminUnlocked
                  ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border-zinc-750'
                  : 'bg-zinc-900 hover:bg-zinc-850 text-amber-300/80 border-amber-500/30'
              }`}
              title={isAdminUnlocked ? 'Imprimir o guardar como PDF' : 'Requiere contraseña (****) para imprimir'}
            >
              {isAdminUnlocked ? (
                <Printer className="w-4 h-4 text-zinc-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isAdminUnlocked ? 'Imprimir' : 'Imprimir 🔒'}</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 sm:px-8 py-3 border-b border-zinc-850 bg-zinc-950 overflow-x-auto text-xs font-bold scrollbar-none">
          {/* Tab 1: Cómo se usa */}
          <button
            onClick={() => setActiveTab('how')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === 'how'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1. Cómo se usa</span>
          </button>

          {/* Tab 2: Qué ve el Cliente */}
          <button
            onClick={() => setActiveTab('client')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === 'client'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>2. Qué ve el Cliente</span>
          </button>

          {/* Tab 3: Qué ves Tú (Admin) - BLOQUEADO CON CONTRASEÑA */}
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === 'admin'
                ? isAdminUnlocked
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'bg-amber-600/30 text-amber-200 border border-amber-500/50'
                : isAdminUnlocked
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  : 'text-amber-300/80 hover:text-amber-200 hover:bg-amber-950/30'
            }`}
          >
            {isAdminUnlocked ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>3. Qué ves Tú (Admin)</span>
            {!isAdminUnlocked && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 font-mono">
                🔒 ****
              </span>
            )}
          </button>

          {/* Tab 4: Qué te llega por WhatsApp - BLOQUEADO CON CONTRASEÑA */}
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === 'whatsapp'
                ? isAdminUnlocked
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'bg-emerald-950/60 text-emerald-200 border border-emerald-500/50'
                : isAdminUnlocked
                  ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
                  : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950/30'
            }`}
          >
            {isAdminUnlocked ? (
              <MessageCircle className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>4. Qué te llega por WhatsApp</span>
            {!isAdminUnlocked && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-mono">
                🔒 ****
              </span>
            )}
          </button>

          {/* Tab 5: Requisitos por Red */}
          <button
            onClick={() => setActiveTab('requirements')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === 'requirements'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>5. Requisitos por Red (2026)</span>
          </button>

          {/* Tab 6: Subir y Guardar PDFs (1 a 10+) */}
          <button
            onClick={() => setActiveTab('upload-pdfs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === 'upload-pdfs'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-emerald-300 bg-emerald-950/30 border border-emerald-500/30 hover:bg-emerald-900/40'
            }`}
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>6. Subir y Guardar PDFs (1 a 10)</span>
            {savedPdfCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-emerald-200 font-extrabold">
                {savedPdfCount}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-sm">
          {/* TAB 1: CÓMO SE USA */}
          {activeTab === 'how' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-gradient-to-r from-purple-950/60 to-zinc-900 p-5 rounded-2xl border border-purple-900/40">
                <h3 className="text-base font-black text-white flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Flujo de Trabajo Paso a Paso (Sin Fricción)
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300">
                  El sistema está diseñado para que cualquier creador de contenido o negocio calcule exactamente cuánto le falta para monetizar su canal o cuenta social, obtenga una cotización instantánea y envíe el pedido directo a tu WhatsApp.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-600/30 text-purple-400 flex items-center justify-center text-xs font-black">
                      1
                    </span>
                    <h4 className="font-bold text-white text-sm">Selección de Plataforma</h4>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Se elige entre YouTube, TikTok, Instagram, Facebook, Kick o Spotify. Cada red carga automáticamente los requisitos oficiales actualizados para monetizar.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center text-xs font-black">
                      2
                    </span>
                    <h4 className="font-bold text-white text-sm">Ingreso de Enlace y Métricas</h4>
                  </div>
                  <p className="text-xs text-zinc-400">
                    El cliente pega su URL pública (ej. youtube.com/@micuenta) y mueve los sliders suaves o botones rápidos para indicar cuántos seguidores u horas tiene hoy.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center text-xs font-black">
                      3
                    </span>
                    <h4 className="font-bold text-white text-sm">Diagnóstico y Asignación</h4>
                  </div>
                  <p className="text-xs text-zinc-400">
                    El algoritmo calcula la diferencia exacta entre lo que tiene y la meta oficial. Asigna los paquetes del catálogo con garantía de 30 días y tiempo estimado de entrega.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-600/30 text-amber-400 flex items-center justify-center text-xs font-black">
                      4
                    </span>
                    <h4 className="font-bold text-white text-sm">Envío Automatizado por WhatsApp</h4>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Al tocar el botón de WhatsApp, se genera un mensaje preformateado y detallado con enlace, déficit y total a pagar para que cierres la venta en un instante.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUÉ VE EL CLIENTE */}
          {activeTab === 'client' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-gradient-to-r from-blue-950/60 to-zinc-900 p-5 rounded-2xl border border-blue-900/40">
                <h3 className="text-base font-black text-white flex items-center gap-2 mb-1.5">
                  <Eye className="w-4 h-4 text-blue-400" />
                  Experiencia Visual del Comprador en Pantalla
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300">
                  El cliente experimenta una interfaz moderna estilo Cyber-Dark con alto impacto visual, diseñada para generar confianza, transparencia y urgencia de compra.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">1. Selector de Plataforma con Colores Oficiales</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Ve 6 tarjetas interactivas: YouTube, TikTok, Instagram, Facebook, Kick y Spotify. Al tocar una, cambian los requisitos y paquetes correspondientes.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">2. Campo para su Enlace Público y Sliders Numéricos</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Un input donde escribe su link y barras deslizantes fáciles de arrastrar o botones de presets para indicar sus números actuales sin esfuerzo.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">3. Panel de Progreso Visual y Tarjeta de Diagnóstico</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Ve barras de porcentaje completado, badges que le indican en rojo/amarillo cuánto le falta para cumplir las políticas y en verde lo que ya tiene.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">4. Paquetes del Catálogo con Precios en USD</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Ve los nombres exactos de los paquetes asignados, el precio individual de cada uno, el tiempo estimado de entrega y la garantía de 30 días con reposición.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">5. Simulador de Ganancias Post-Monetización (ROI)</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Ve gráficos de ganancias estimadas mes a mes, el tiempo de recuperación de la inversión (payback en días) y la rentabilidad neta anual.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">6. Botón Verde Destacado de WhatsApp</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Al tocarlo, WhatsApp se abre directamente en su teléfono o navegador con el mensaje redactado y estructurado listo para enviártelo sin tener que escribir nada manual.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUÉ VES TÚ (ADMIN) - CON PROTECCIÓN POR CONTRASEÑA */}
          {activeTab === 'admin' && (
            <div>
              {!isAdminUnlocked ? (
                /* LOCK SCREEN PARA TAB ADMIN */
                <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900/90 border border-amber-500/30 text-center max-w-xl mx-auto space-y-6 shadow-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/40">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      Sección de Administrador Bloqueada
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                      Esta sección contiene información confidencial de administración, cobros (Binance Pay ID, Pago Móvil BDV), márgenes y directrices de venta. Ingresa la contraseña para desbloquear.
                    </p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleVerifyInline('admin');
                    }}
                    className="space-y-4 max-w-sm mx-auto"
                  >
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showInlinePin ? 'text' : 'password'}
                        value={inlinePin}
                        onChange={(e) => {
                          setInlinePin(e.target.value);
                          setInlinePinError(false);
                        }}
                        placeholder="Ingresa la contraseña (****)"
                        className={`w-full pl-10 pr-10 py-3 rounded-xl bg-zinc-950 border text-white text-sm placeholder:text-zinc-500 focus:outline-none transition ${
                          inlinePinError 
                            ? 'border-red-500 focus:ring-2 focus:ring-red-500/40' 
                            : 'border-zinc-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30'
                        }`}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowInlinePin(!showInlinePin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showInlinePin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {isAdminOccupiedByOther && (
                      <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 font-semibold flex items-center justify-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>
                          Actualmente el Usuario #{activeAdminUserNumber ?? 1} está conectado como Administrador (máximo 1 a la vez).
                        </span>
                      </div>
                    )}

                    {inlinePinError && (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-semibold animate-shake">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{inlinePinErrorMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isVerifyingPin}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-zinc-950 font-black text-sm shadow-lg shadow-amber-950/40 transition cursor-pointer active:scale-95"
                    >
                      {isVerifyingPin ? 'Verificando...' : 'Desbloquear Sección Admin (1 a la vez)'}
                    </button>
                  </form>

                  <div className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5 font-mono">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400/80" />
                    <span>Clave protegida: <strong className="text-zinc-400">****</strong> • Cierre automático al salir</span>
                  </div>
                </div>
              ) : (
                /* CONTENIDO DESBLOQUEADO DE TAB ADMIN */
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="bg-zinc-900/80 p-5 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2 mb-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Tu Rol como Administrador y Vendedor
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Desbloqueado 🔓
                        </span>
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-300">
                        La aplicación hace el 80% del trabajo comercial por ti: educa al comprador, le muestra los precios y calcula su presupuesto. Tú solo gestionas el cobro y la activación.
                      </p>
                    </div>
                    <button
                      onClick={handleLockAgain}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition cursor-pointer shrink-0"
                    >
                      Bloquear de nuevo 🔒
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        Canales de Cobro Oficiales
                      </h4>
                      <ul className="text-xs text-zinc-400 space-y-1.5">
                        <li>• <strong>Binance Pay ID:</strong> <span className="font-mono text-emerald-300 font-bold">{paymentConfig.binancePayId}</span> (recibes USDT neto, sin comisión).</li>
                        <li>• <strong>Pago Móvil:</strong> {paymentConfig.pagoMovil.bank} ({paymentConfig.pagoMovil.bankCode}), tlf {paymentConfig.pagoMovil.phone}, CI {paymentConfig.pagoMovil.id}. Tú le indicas la tasa del día en Bolívares.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        Oportunidades de Venta Cruzada (Upselling)
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Cuando el cliente te envía el diagnóstico, ves inmediatamente qué le falta. Si compra horas, puedes ofrecerle un paquete de retención o likes por unos pocos dólares adicionales.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        Revisión de Enlace en Segundos
                      </h4>
                      <p className="text-xs text-zinc-400">
                        El mensaje te trae el enlace del cliente. Haces clic, confirmas que el perfil sea público y que tenga videos publicados, y le das el visto bueno inmediato.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Ritmo de Entrega y Garantía
                      </h4>
                      <p className="text-xs text-zinc-400">
                        El cliente elige entre <strong>Modo Express (48 a 72 horas)</strong> o <strong>Modo Progresivo (7 días en adelante)</strong>. Todos los pedidos cuentan con 30 días de garantía de reposición gratuita.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: QUÉ TE LLEGA POR WHATSAPP - CON PROTECCIÓN POR CONTRASEÑA */}
          {activeTab === 'whatsapp' && (
            <div>
              {!isAdminUnlocked ? (
                /* LOCK SCREEN PARA TAB WHATSAPP */
                <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900/90 border border-emerald-500/30 text-center max-w-xl mx-auto space-y-6 shadow-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      Formatos y Guiones de WhatsApp Bloqueados
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                      La estructura exacta del mensaje que recibes por WhatsApp y los guiones de cierre de venta en 3 pasos son privados para el administrador. Introduce la contraseña para desbloquear.
                    </p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleVerifyInline('whatsapp');
                    }}
                    className="space-y-4 max-w-sm mx-auto"
                  >
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showInlinePin ? 'text' : 'password'}
                        value={inlinePin}
                        onChange={(e) => {
                          setInlinePin(e.target.value);
                          setInlinePinError(false);
                        }}
                        placeholder="Ingresa la contraseña (****)"
                        className={`w-full pl-10 pr-10 py-3 rounded-xl bg-zinc-950 border text-white text-sm placeholder:text-zinc-500 focus:outline-none transition ${
                          inlinePinError 
                            ? 'border-red-500 focus:ring-2 focus:ring-red-500/40' 
                            : 'border-zinc-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30'
                        }`}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowInlinePin(!showInlinePin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showInlinePin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {isAdminOccupiedByOther && (
                      <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 font-semibold flex items-center justify-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>
                          Actualmente el Usuario #{activeAdminUserNumber ?? 1} está conectado como Administrador (máximo 1 a la vez).
                        </span>
                      </div>
                    )}

                    {inlinePinError && (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-semibold animate-shake">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{inlinePinErrorMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isVerifyingPin}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-emerald-950/40 transition cursor-pointer active:scale-95"
                    >
                      {isVerifyingPin ? 'Verificando...' : 'Desbloquear Guiones de WhatsApp (1 a la vez)'}
                    </button>
                  </form>

                  <div className="text-[11px] text-zinc-500 flex items-center justify-center gap-1.5 font-mono">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-400/80" />
                    <span>Clave protegida: <strong className="text-zinc-400">****</strong> • Cierre automático al salir</span>
                  </div>
                </div>
              ) : (
                /* CONTENIDO DESBLOQUEADO DE TAB WHATSAPP */
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="bg-emerald-950/30 p-5 rounded-2xl border border-emerald-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        Estructura Exacta del Mensaje que Recibes por WhatsApp
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Desbloqueado 🔓
                        </span>
                      </h3>
                      <p className="text-xs text-emerald-200 mt-1">
                        Este es el mensaje textual con formato nativo de WhatsApp que te llega cuando el cliente solicita su plan:
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(sampleWaMessage, 'wa-msg')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold transition cursor-pointer shrink-0"
                      >
                        {copiedScript === 'wa-msg' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Mensaje</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleLockAgain}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition cursor-pointer shrink-0"
                      >
                        Bloquear 🔒
                      </button>
                    </div>
                  </div>

                  {/* Simulated WhatsApp Chat Bubble */}
                  <div className="bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-800 relative">
                    <div className="max-w-xl mx-auto bg-[#075E54]/20 border border-[#128C7E]/40 p-4 rounded-2xl text-xs sm:text-sm text-zinc-100 font-sans leading-relaxed shadow-lg">
                      <div className="text-[11px] font-bold text-emerald-400 mb-1 flex items-center justify-between">
                        <span>Mensaje entrante del cliente</span>
                        <span>Hoy</span>
                      </div>
                      <pre className="font-mono text-xs whitespace-pre-wrap text-zinc-200 bg-black/30 p-3 rounded-xl border border-zinc-800">
                        {sampleWaMessage}
                      </pre>
                    </div>
                  </div>

                  {/* Seller Closing Script in 3 steps */}
                  <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Guión Recomendado para Cerrar la Venta en 3 Respuestas:
                    </h4>

                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start justify-between gap-3">
                        <div className="text-xs">
                          <span className="text-purple-400 font-bold block mb-1">Paso 1: Saludo y Confirmación</span>
                          <p className="text-zinc-300">
                            &quot;¡Hola! Con gusto te ayudo a completar tu monetización. Ya revisé tu enlace y está todo listo para arrancar. El total de tu paquete es de $100 USD.&quot;
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopy("¡Hola! Con gusto te ayudo a completar tu monetización. Ya revisé tu enlace y está todo listo para arrancar. El total de tu paquete es de $100 USD.", 'p1')}
                          className="p-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer shrink-0"
                          title="Copiar"
                        >
                          {copiedScript === 'p1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start justify-between gap-3">
                        <div className="text-xs">
                          <span className="text-blue-400 font-bold block mb-1">Paso 2: Elección de Método de Pago</span>
                          <p className="text-zinc-300">
                            &quot;¿Prefieres pagar por Binance Pay (USDT neto a mi ID {paymentConfig.binancePayId}) o por Pago Móvil ({paymentConfig.pagoMovil.bank} {paymentConfig.pagoMovil.bankCode}) a la tasa del día en Bs?&quot;
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopy(`¿Prefieres pagar por Binance Pay (USDT neto a mi ID ${paymentConfig.binancePayId}) o por Pago Móvil (${paymentConfig.pagoMovil.bank} ${paymentConfig.pagoMovil.bankCode}) a la tasa del día en Bs?`, 'p2')}
                          className="p-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer shrink-0"
                          title="Copiar"
                        >
                          {copiedScript === 'p2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start justify-between gap-3">
                        <div className="text-xs">
                          <span className="text-emerald-400 font-bold block mb-1">Paso 3: Recepción y Puesta en Marcha</span>
                          <p className="text-zinc-300">
                            &quot;¡Excelente! Envíame por favor la captura del comprobante y en las próximas horas iniciamos la entrega progresiva con tu garantía de 30 días.&quot;
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopy("¡Excelente! Envíame por favor la captura del comprobante y en las próximas horas iniciamos la entrega progresiva con tu garantía de 30 días.", 'p3')}
                          className="p-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer shrink-0"
                          title="Copiar"
                        >
                          {copiedScript === 'p3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REQUISITOS OFICIALES POR RED */}
          {activeTab === 'requirements' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800">
                <h3 className="text-base font-black text-white flex items-center gap-2 mb-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  Tabla Oficial de Requisitos de Monetización 2026
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300">
                  Estos son los umbrales exigidos por cada red social que utiliza el analizador para determinar el déficit del usuario:
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-zinc-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-900 text-zinc-300 border-b border-zinc-800">
                      <th className="p-3 font-bold">Plataforma</th>
                      <th className="p-3 font-bold">Requisito de Audiencia</th>
                      <th className="p-3 font-bold">Requisito de Consumo / Horas</th>
                      <th className="p-3 font-bold">Programa Oficial</th>
                      <th className="p-3 font-bold">Monetización Directa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850 text-zinc-300">
                    <tr className="hover:bg-zinc-900/50">
                      <td className="p-3 font-bold text-red-400">YouTube</td>
                      <td className="p-3">1,000 Suscriptores</td>
                      <td className="p-3">4,000 Horas o 10M Shorts</td>
                      <td className="p-3">YouTube Partner Program (YPP)</td>
                      <td className="p-3 text-emerald-400 font-bold">AdSense / Publicidad</td>
                    </tr>
                    <tr className="hover:bg-zinc-900/50">
                      <td className="p-3 font-bold text-cyan-400">TikTok</td>
                      <td className="p-3">10,000 Seguidores</td>
                      <td className="p-3">100,000 Visualizaciones (30 días)</td>
                      <td className="p-3">Creator Rewards / LIVE</td>
                      <td className="p-3 text-emerald-400 font-bold">Fondo de Creadores y Regalos</td>
                    </tr>
                    <tr className="hover:bg-zinc-900/50">
                      <td className="p-3 font-bold text-pink-400">Instagram</td>
                      <td className="p-3">10,000 Seguidores</td>
                      <td className="p-3">100k reproducciones en Reels</td>
                      <td className="p-3">Suscripciones & Regalos</td>
                      <td className="p-3 text-emerald-400 font-bold">Badges, Marcas y Regalos</td>
                    </tr>
                    <tr className="hover:bg-zinc-900/50">
                      <td className="p-3 font-bold text-blue-400">Facebook</td>
                      <td className="p-3">10,000 Seguidores</td>
                      <td className="p-3">600,000 Minutos en 60 días</td>
                      <td className="p-3">Meta In-Stream Ads</td>
                      <td className="p-3 text-emerald-400 font-bold">Anuncios en Video</td>
                    </tr>
                    <tr className="hover:bg-zinc-900/50">
                      <td className="p-3 font-bold text-emerald-400">Kick Streaming</td>
                      <td className="p-3">75 Seguidores (Afiliado) / 3,000</td>
                      <td className="p-3">5 Horas emitidas (Afiliado)</td>
                      <td className="p-3">Kick Creator Program (KCP)</td>
                      <td className="p-3 text-emerald-400 font-bold">95/5 Suscripciones & Pago x Hora</td>
                    </tr>
                    <tr className="hover:bg-zinc-900/50">
                      <td className="p-3 font-bold text-green-400">Spotify</td>
                      <td className="p-3">Verificación for Artists</td>
                      <td className="p-3">1,000 Streams por tema / año</td>
                      <td className="p-3">Spotify Royalty Threshold</td>
                      <td className="p-3 text-emerald-400 font-bold">Regalías de Streaming</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: SUBIR Y GUARDAR PDFS (1 A 10+) */}
          {activeTab === 'upload-pdfs' && (
            <div className="animate-in fade-in duration-150">
              <PdfUploadManager onCountChange={setSavedPdfCount} />
            </div>
          )}
        </div>

        {/* Footer actions bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 sm:px-8 py-4 border-t border-zinc-850 bg-zinc-900/90">
          <div className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap">
            <span>Soporte:</span>
            <strong className="text-white">{paymentConfig.whatsappDisplay}</strong>
            <span className="hidden sm:inline">• Binance ID:</span>
            <strong className="text-white hidden sm:inline">{paymentConfig.binancePayId}</strong>
            <span className="hidden md:inline">• Clave Admin:</span>
            <span className="text-amber-400/90 font-mono font-bold hidden md:inline">****</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Download Button (Protected) */}
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xl transition cursor-pointer active:scale-95 disabled:opacity-50 ${
                isAdminUnlocked
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white shadow-purple-900/40'
                  : 'bg-zinc-800 hover:bg-zinc-750 text-amber-300 border border-amber-500/40 shadow-amber-950/20'
              }`}
            >
              {isAdminUnlocked ? (
                <Download className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400" />
              )}
              <span>
                {isDownloading 
                  ? 'Generando PDF...' 
                  : isAdminUnlocked 
                    ? 'Descargar Instructivo PDF (.pdf)' 
                    : 'Descargar Instructivo PDF 🔒'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* POPUP / MODAL DE DESBLOQUEO CON CONTRASEÑA (Para Descargar PDF, Imprimir o Acceso General) */}
      {isAuthModalOpen && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsAuthModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-zinc-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute right-4 top-4 p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/40">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white">
                {authModalTarget === 'download' 
                  ? 'Desbloquear Descarga de PDF' 
                  : authModalTarget === 'print' 
                    ? 'Desbloquear Impresión' 
                    : 'Desbloquear Funciones de Administrador'}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {authModalTarget === 'download' 
                  ? 'Descargar el documento oficial en PDF está protegido. Ingresa la contraseña de administrador (****) para continuar con la descarga.' 
                  : authModalTarget === 'print' 
                    ? 'Imprimir este documento requiere la contraseña de administrador (****).' 
                    : 'Las opciones de administrador, datos de cobro y guiones están protegidas. Ingresa la contraseña (****) para desbloquear.'}
              </p>
            </div>

            <form onSubmit={handleVerifyAuthModal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Contraseña de Administrador
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError(false);
                    }}
                    placeholder="Introduce contraseña (****)"
                    className={`w-full pl-10 pr-10 py-3 rounded-xl bg-zinc-900 border text-white text-sm placeholder:text-zinc-600 focus:outline-none transition ${
                      pinError 
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500/40' 
                        : 'border-zinc-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30'
                    }`}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isAdminOccupiedByOther && (
                <div className="flex items-start gap-2 text-xs text-rose-300 font-semibold bg-rose-950/50 border border-rose-500/40 p-2.5 rounded-xl">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>
                    El Usuario #{activeAdminUserNumber ?? 1} ya está conectado como Administrador. Solo se permite 1 Administrador conectado a la vez.
                  </span>
                </div>
              )}

              {pinError && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold bg-red-950/40 border border-red-900/50 p-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{pinErrorMessage}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPin}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-zinc-950 font-black text-xs shadow-lg shadow-amber-950/40 transition cursor-pointer active:scale-95"
                >
                  {isVerifyingPin ? 'Verificando...' : 'Desbloquear'}
                </button>
              </div>
            </form>

            <div className="text-center">
              <span className="text-[11px] text-zinc-500 font-mono">
                Clave de acceso requerida: <strong className="text-zinc-400">****</strong> • Cierre automático al cerrar página
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
