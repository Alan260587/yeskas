import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileUp,
  Save,
  FileText,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  FolderOpen,
  Sparkles,
  RefreshCw,
  Check,
} from 'lucide-react';
import {
  SavedPdfDocument,
  PendingPdfUpload,
  fetchAndSyncSavedPdfs,
  uploadAndSavePdfBatch,
  removeSavedPdf,
  clearAllSavedPdfs,
  formatFileSize,
  getPdfBlobUrl,
  downloadSavedPdf,
} from '../utils/pdfStorage';

interface PdfUploadManagerProps {
  onCountChange?: (count: number) => void;
}

const TOTAL_SLOTS = 10;

export const PdfUploadManager: React.FC<PdfUploadManagerProps> = ({ onCountChange }) => {
  const [savedPdfs, setSavedPdfs] = useState<SavedPdfDocument[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingPdfUpload[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveProgress, setSaveProgress] = useState<{
    current: number;
    total: number;
    fileName: string;
  } | null>(null);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [previewPdf, setPreviewPdf] = useState<{
    doc: SavedPdfDocument;
    url: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const multiFileInputRef = useRef<HTMLInputElement | null>(null);
  const slotInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const loadSavedPdfs = useCallback(async (silent: boolean = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const docs = await fetchAndSyncSavedPdfs();
      setSavedPdfs((prev) => {
        if (
          prev.length === docs.length &&
          prev.every((p, idx) => p.id === docs[idx]?.id && p.name === docs[idx]?.name)
        ) {
          return prev;
        }
        return docs;
      });
      if (onCountChange) {
        onCountChange(docs.length);
      }
    } catch (err) {
      console.error('Error loading saved PDFs:', err);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [onCountChange]);

  useEffect(() => {
    loadSavedPdfs(false);

    // Active cross-device synchronization: checks for new PDFs uploaded from other computers or phones
    const interval = window.setInterval(() => {
      loadSavedPdfs(true);
    }, 4000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadSavedPdfs(true);
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);

    const handleWs = (e: Event) => {
      const msg = (e as CustomEvent).detail;
      if (msg && msg.type === 'pdfs:updated') {
        loadSavedPdfs(true);
      }
    };
    window.addEventListener('growth-viral-ws-event', handleWs);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('growth-viral-ws-event', handleWs);
    };
  }, [loadSavedPdfs]);

  // Cleanup preview blob URL when closed
  useEffect(() => {
    return () => {
      if (previewPdf?.url && previewPdf.url.startsWith('blob:')) {
        URL.revokeObjectURL(previewPdf.url);
      }
    };
  }, [previewPdf]);

  const validateAndStageFiles = (fileList: FileList | File[], targetSlotIndex?: number) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    const validFiles: PendingPdfUpload[] = [];
    const rejectedNames: string[] = [];

    // Determine next free slot indices if not targeting a specific slot
    const occupiedSlots = new Set<number>();
    savedPdfs.forEach((d) => {
      if (typeof d.slotIndex === 'number') occupiedSlots.add(d.slotIndex);
    });
    pendingUploads.forEach((p) => {
      if (typeof p.slotIndex === 'number') occupiedSlots.add(p.slotIndex);
    });

    let nextAutoSlot = 1;
    const getNextFreeSlot = (): number => {
      while (occupiedSlots.has(nextAutoSlot) && nextAutoSlot <= 50) {
        nextAutoSlot++;
      }
      occupiedSlots.add(nextAutoSlot);
      return nextAutoSlot;
    };

    filesArray.forEach((file, idx) => {
      const isPdf =
        file.type === 'application/pdf' ||
        file.type === 'application/x-pdf' ||
        file.name.toLowerCase().endsWith('.pdf');

      if (!isPdf) {
        rejectedNames.push(file.name);
        return;
      }

      const assignedSlot =
        typeof targetSlotIndex === 'number'
          ? targetSlotIndex + idx
          : getNextFreeSlot();

      validFiles.push({
        tempId: `pending-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        category: `PDF #${assignedSlot}`,
        slotIndex: assignedSlot,
      });
    });

    if (rejectedNames.length > 0 && validFiles.length === 0) {
      setStatusBanner({
        type: 'error',
        message: `El archivo "${rejectedNames.join(', ')}" no es un PDF válido. Selecciona archivos con extensión .pdf.`,
      });
      return;
    }

    if (validFiles.length > 0) {
      setPendingUploads((prev) => {
        // If replacing a specific slot in pendingUploads, overwrite that slot's pending item
        const updated = [...prev];
        for (const newItem of validFiles) {
          const existingPendingIdx = updated.findIndex(
            (p) => typeof newItem.slotIndex === 'number' && p.slotIndex === newItem.slotIndex
          );
          if (existingPendingIdx !== -1) {
            updated[existingPendingIdx] = newItem;
          } else {
            updated.push(newItem);
          }
        }
        return updated.sort((a, b) => (a.slotIndex ?? 999) - (b.slotIndex ?? 999));
      });

      setStatusBanner({
        type: 'info',
        message: `${validFiles.length} archivo(s) PDF cargado(s) y listo(s). Haz clic en el botón verde "Guardar PDF(s)" para guardarlos permanentemente.`,
      });
    }
  };

  const handleMultiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndStageFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleSlotFileChange = (slotNumber: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndStageFiles(e.target.files, slotNumber);
      e.target.value = '';
    }
  };

  // Save either all pending PDFs or a single specific pending PDF
  const handleSavePdfs = async (singleTempId?: string) => {
    const itemsToSave = singleTempId
      ? pendingUploads.filter((p) => p.tempId === singleTempId)
      : pendingUploads;

    if (itemsToSave.length === 0) {
      if (savedPdfs.length > 0) {
        setIsSaving(true);
        const synced = await fetchAndSyncSavedPdfs();
        setSavedPdfs(synced);
        if (onCountChange) {
          onCountChange(synced.length);
        }
        setIsSaving(false);
        setStatusBanner({
          type: 'success',
          message: `¡Tus ${synced.length} archivo(s) PDF están guardados en el backend y sincronizados al instante en todos los celulares y computadoras!`,
        });
        return;
      }
      setStatusBanner({
        type: 'error',
        message: 'Primero selecciona al menos 1 archivo PDF (o hasta 10 PDFs) antes de darle a Guardar.',
      });
      return;
    }

    setIsSaving(true);
    setStatusBanner(null);

    const result = await uploadAndSavePdfBatch(
      itemsToSave,
      (current, total, currentFileName) => {
        setSaveProgress({ current, total, fileName: currentFileName });
      }
    );

    setIsSaving(false);
    setSaveProgress(null);

    if (result.ok) {
      const savedTempIds = new Set(itemsToSave.map((i) => i.tempId));
      setPendingUploads((prev) => prev.filter((p) => !savedTempIds.has(p.tempId)));

      const updatedDocs = await fetchAndSyncSavedPdfs();
      setSavedPdfs(updatedDocs);
      if (onCountChange) {
        onCountChange(updatedDocs.length);
      }

      setStatusBanner({
        type: 'success',
        message:
          result.savedDocs.length === 1
            ? `¡Se subió y guardó 1 archivo PDF ("${result.savedDocs[0].name}") en el backend y ya está disponible en todos tus aparatos!`
            : `¡Se subieron y guardaron los ${result.savedDocs.length} archivos PDF en el backend para todos los dispositivos!`,
      });
    } else {
      setStatusBanner({
        type: 'error',
        message: result.error || 'Ocurrió un error al guardar los PDFs. Intenta nuevamente.',
      });
    }
  };

  const handleRemovePending = (tempId: string) => {
    setPendingUploads((prev) => prev.filter((p) => p.tempId !== tempId));
  };

  const handleDeleteSaved = async (doc: SavedPdfDocument) => {
    const updated = await removeSavedPdf(doc.id);
    setSavedPdfs(updated);
    if (onCountChange) {
      onCountChange(updated.length);
    }
    if (previewPdf?.doc.id === doc.id) {
      setPreviewPdf(null);
    }
    setStatusBanner({
      type: 'info',
      message: `Se eliminó "${doc.name}".`,
    });
  };

  const handleClearAllSaved = async () => {
    await clearAllSavedPdfs();
    setSavedPdfs([]);
    setPendingUploads([]);
    if (onCountChange) {
      onCountChange(0);
    }
    setPreviewPdf(null);
    setStatusBanner({
      type: 'info',
      message: 'Se vaciaron todos los PDFs guardados.',
    });
  };

  const handleOpenPreview = async (doc: SavedPdfDocument) => {
    if (previewPdf?.url && previewPdf.url.startsWith('blob:')) {
      URL.revokeObjectURL(previewPdf.url);
    }
    const url = await getPdfBlobUrl(doc);
    setPreviewPdf({ doc, url });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Explanation */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-zinc-900 p-5 rounded-2xl border border-indigo-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistema de Subida y Guardado Permanente Activo (1 a 10+ PDFs)</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <FileUp className="w-5 h-5 text-indigo-400" />
            <span>Gestor para Subir y Guardar tus PDFs (1 o los 10 Archivos)</span>
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1">
            Sube <strong>1 solo PDF</strong> o selecciona <strong>los 10 PDFs juntos</strong> (o cárgales uno por uno en las 10 casillas de abajo) y presiona <strong>&quot;Guardar PDF(s)&quot;</strong> para que queden almacenados de forma permanente.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <input
            ref={multiFileInputRef}
            type="file"
            accept=".pdf,application/pdf,application/x-pdf"
            multiple
            onChange={handleMultiFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => multiFileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-950/50 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Seleccionar 1 o 10 PDFs</span>
          </button>

          {pendingUploads.length > 0 && (
            <button
              type="button"
              onClick={() => handleSavePdfs()}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-zinc-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-950/60 transition cursor-pointer active:scale-95 animate-pulse"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSaving
                  ? 'Guardando...'
                  : pendingUploads.length === 1
                  ? 'Guardar 1 PDF Ahora'
                  : `Guardar los ${pendingUploads.length} PDFs Ahora`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Status Alert / Confirmation Banner */}
      {statusBanner && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 animate-in fade-in duration-150 ${
            statusBanner.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : statusBanner.type === 'error'
              ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
              : 'bg-amber-950/50 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-zinc-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Live Save Progress Bar */}
      {isSaving && saveProgress && (
        <div className="bg-zinc-900 border border-emerald-500/40 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              Subiendo y guardando archivo {saveProgress.current} de {saveProgress.total}:{' '}
              <strong className="text-white">{saveProgress.fileName}</strong>
            </span>
            <span>{Math.round((saveProgress.current / saveProgress.total) * 100)}%</span>
          </div>
          <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
              style={{ width: `${Math.round((saveProgress.current / saveProgress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Drag & Drop Zone + Staging Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndStageFiles(e.dataTransfer.files);
          }
        }}
        className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
          isDragging
            ? 'border-emerald-400 bg-emerald-950/30'
            : 'border-zinc-700 hover:border-indigo-500/60 bg-zinc-900/50'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 mx-auto flex items-center justify-center text-indigo-400 mb-3">
          <FileUp className="w-6 h-6" />
        </div>
        <h4 className="text-sm sm:text-base font-black text-white">
          Arrastra tus PDFs aquí o haz clic para elegir (1 archivo o hasta 10+ PDFs a la vez)
        </h4>
        <p className="text-xs text-zinc-400 mt-1 max-w-lg mx-auto">
          Soporta subir 1 solo PDF o los 10 PDFs simultáneamente sin límite de tamaño pequeño. Una vez seleccionados, pulsa en <strong className="text-emerald-400">&quot;Guardar&quot;</strong>.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => multiFileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 transition cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-indigo-400" />
            <span>Elegir 1 o Varios PDFs de mi dispositivo</span>
          </button>

          {pendingUploads.length > 0 && (
            <button
              type="button"
              onClick={() => handleSavePdfs()}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>
                {pendingUploads.length === 1
                  ? '💾 Guardar 1 PDF Seleccionado'
                  : `💾 Guardar los ${pendingUploads.length} PDFs Seleccionados`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Pending Files Queue (Ready to Save) */}
      {pendingUploads.length > 0 && (
        <div className="bg-amber-950/25 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>
                  Archivos PDF Listos para Guardar ({pendingUploads.length}{' '}
                  {pendingUploads.length === 1 ? 'archivo pendiente' : 'archivos pendientes'})
                </span>
              </h4>
              <p className="text-xs text-zinc-300 mt-0.5">
                Presiona el botón verde <strong>&quot;Guardar Todo&quot;</strong> o guarda cada PDF individualmente:
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPendingUploads([])}
                disabled={isSaving}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition cursor-pointer"
              >
                Limpiar selección
              </button>
              <button
                type="button"
                onClick={() => handleSavePdfs()}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-zinc-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSaving
                    ? 'Guardando...'
                    : pendingUploads.length === 1
                    ? 'Guardar este PDF'
                    : `Guardar Todos (${pendingUploads.length} PDFs)`}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {pendingUploads.map((item, idx) => (
              <div
                key={item.tempId}
                className="bg-zinc-950/90 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                    #{item.slotIndex ?? idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-[10px] text-amber-300/90">
                      {formatFileSize(item.size)} • Pendiente por guardar
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSavePdfs(item.tempId)}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer"
                    title="Guardar este PDF ahora"
                  >
                    <Save className="w-3 h-3" />
                    <span>Guardar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemovePending(item.tempId)}
                    disabled={isSaving}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                    title="Quitar de la lista"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10 Individual PDF Slots Grid (Casillas #1 a #10) */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-purple-400" />
              <span>Casillas de Documentos PDF (Del #1 al #10)</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {savedPdfs.length} guardado(s)
              </span>
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Puedes subir y guardar 1 solo PDF en cualquier casilla, o llenar las 10 casillas y darle a <strong>Guardar</strong>.
            </p>
          </div>

          {savedPdfs.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllSaved}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Borrar todos ({savedPdfs.length})</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
          {Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1).map((slotNum) => {
            const savedInSlot = savedPdfs.find((d) => d.slotIndex === slotNum);
            const pendingInSlot = pendingUploads.find((p) => p.slotIndex === slotNum);

            return (
              <div
                key={slotNum}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  savedInSlot
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : pendingInSlot
                    ? 'bg-amber-950/25 border-amber-500/50'
                    : 'bg-zinc-950/80 border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${
                      savedInSlot
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : pendingInSlot
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    #{slotNum}
                  </div>

                  <div className="min-w-0">
                    {savedInSlot ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate" title={savedInSlot.name}>
                            {savedInSlot.name}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">
                            <Check className="w-2.5 h-2.5" /> Guardado
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {formatFileSize(savedInSlot.size)} • Listo para ver o descargar
                        </p>
                      </>
                    ) : pendingInSlot ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-amber-200 truncate" title={pendingInSlot.name}>
                            {pendingInSlot.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-400 font-semibold">
                          {formatFileSize(pendingInSlot.size)} • Dale a &quot;Guardar&quot;
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-zinc-300 block">
                          Casilla PDF #{slotNum} (Vacía)
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          Sube un archivo .pdf aquí
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Slot Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    ref={(el) => {
                      slotInputRefs.current[slotNum] = el;
                    }}
                    type="file"
                    accept=".pdf,application/pdf,application/x-pdf"
                    onChange={(e) => handleSlotFileChange(slotNum, e)}
                    className="hidden"
                  />

                  {pendingInSlot ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSavePdfs(pendingInSlot.tempId)}
                        disabled={isSaving}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shadow-md transition cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePending(pendingInSlot.tempId)}
                        className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : savedInSlot ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(savedInSlot)}
                        className="p-1.5 px-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Ver PDF"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ver</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadSavedPdf(savedInSlot)}
                        className="p-1.5 px-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Descargar PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Bajar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => slotInputRefs.current[slotNum]?.click()}
                        className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition cursor-pointer"
                        title="Reemplazar PDF"
                      >
                        <FileUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(savedInSlot)}
                        className="p-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                        title="Eliminar PDF"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => slotInputRefs.current[slotNum]?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-indigo-600 text-zinc-200 hover:text-white text-xs font-bold border border-zinc-700 hover:border-indigo-500 transition cursor-pointer"
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      <span>Subir PDF</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Extra Saved PDFs beyond slot 10 (if user uploaded more than 10) */}
        {savedPdfs.filter((d) => !d.slotIndex || d.slotIndex > TOTAL_SLOTS).length > 0 && (
          <div className="pt-4 border-t border-zinc-800 space-y-2.5">
            <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Otros PDFs Adicionales Guardados:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {savedPdfs
                .filter((d) => !d.slotIndex || d.slotIndex > TOTAL_SLOTS)
                .map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{doc.name}</p>
                      <p className="text-[10px] text-emerald-300">{formatFileSize(doc.size)} • Guardado</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(doc)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/30 text-indigo-200 text-xs font-bold cursor-pointer"
                      >
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadSavedPdf(doc)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-200 text-xs font-bold cursor-pointer"
                      >
                        Bajar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(doc)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Embedded PDF Viewer Modal / Drawer */}
      {previewPdf && previewPdf.url && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewPdf(null)}
        >
          <div
            className="w-full max-w-4xl h-[86vh] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="text-sm font-black text-white truncate">
                  {previewPdf.doc.name}
                </span>
                <span className="text-xs text-zinc-400 shrink-0">
                  ({formatFileSize(previewPdf.doc.size)})
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => downloadSavedPdf(previewPdf.doc)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPdf(null)}
                  className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-zinc-900">
              <iframe
                src={previewPdf.url}
                title={previewPdf.doc.name}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-4 text-xs text-zinc-400">
          Sincronizando PDFs guardados...
        </div>
      )}
    </div>
  );
};
