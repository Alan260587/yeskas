import {
  uploadJsonToGlobalCdn,
  fetchJsonFromGlobalCdn,
  saveToGlobalCloudStore,
  subscribeToGlobalCloudStore,
  getLatestGlobalCloudData,
} from './globalCloudDatabase';

export interface SavedPdfDocument {
  id: string;
  name: string;
  size: number;
  uploadedAt: number;
  category: string;
  description?: string;
  slotIndex?: number;
  cdnUrl?: string; // Global CDN URL for cross-country / Vercel static persistence
  dataUrl?: string; // Available locally via IndexedDB or loaded on demand
}

export interface PendingPdfUpload {
  tempId: string;
  file: File;
  name: string;
  size: number;
  category: string;
  description?: string;
  slotIndex?: number;
  dataUrl?: string;
}

const DB_NAME = 'growth_viral_pdfs_db_v1';
const STORE_NAME = 'uploaded_pdfs';
const DB_VERSION = 1;
const LOCAL_PDF_META_KEY = 'growth_viral_pdf_meta_v2';

let pdfServerAvailable = true;

// Subscribe to global PDF catalog updates so any device worldwide updates immediately
if (typeof window !== 'undefined') {
  subscribeToGlobalCloudStore('pdfs', (cloudPdfs) => {
    if (!Array.isArray(cloudPdfs)) return;
    try {
      localStorage.setItem(LOCAL_PDF_META_KEY, JSON.stringify(cloudPdfs));
    } catch {
      // ignore
    }
    window.dispatchEvent(
      new CustomEvent('growth-viral-ws-event', {
        detail: { type: 'pdfs:updated', pdfs: cloudPdfs },
      })
    );
  });
}

function getCachedCloudPdfMeta(): SavedPdfDocument[] {
  const latest = getLatestGlobalCloudData('pdfs');
  if (Array.isArray(latest)) return latest;
  try {
    const raw = localStorage.getItem(LOCAL_PDF_META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function openPdfDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllLocalPdfs(): Promise<SavedPdfDocument[]> {
  try {
    const db = await openPdfDatabase();
    return await new Promise<SavedPdfDocument[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const result = Array.isArray(req.result) ? (req.result as SavedPdfDocument[]) : [];
        resolve(result.sort((a, b) => (a.slotIndex ?? 999) - (b.slotIndex ?? 999) || b.uploadedAt - a.uploadedAt));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function getLocalPdfById(id: string): Promise<SavedPdfDocument | null> {
  try {
    const db = await openPdfDatabase();
    return await new Promise<SavedPdfDocument | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as SavedPdfDocument) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function putLocalPdf(doc: SavedPdfDocument): Promise<void> {
  try {
    const db = await openPdfDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      if (typeof doc.slotIndex === 'number') {
        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => {
          const all = Array.isArray(getAllReq.result) ? (getAllReq.result as SavedPdfDocument[]) : [];
          for (const existing of all) {
            if (existing.slotIndex === doc.slotIndex && existing.id !== doc.id) {
              store.delete(existing.id);
            }
          }
          store.put(doc);
        };
      } else {
        store.put(doc);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save PDF to IndexedDB:', err);
  }
}

export async function deleteLocalPdf(id: string): Promise<void> {
  try {
    const db = await openPdfDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

export async function clearAllLocalPdfs(): Promise<void> {
  try {
    const db = await openPdfDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('No se pudo leer el archivo PDF'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Error al leer el archivo PDF'));
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

/**
 * Fetches saved PDFs from Global Replicated Cloud Store, Express backend (if available),
 * and local IndexedDB so neither 1 nor 10+ PDFs are ever lost across countries or IPs.
 */
export async function fetchAndSyncSavedPdfs(): Promise<SavedPdfDocument[]> {
  const localDocs = await getAllLocalPdfs();
  const cloudDocs = getCachedCloudPdfMeta();
  let serverDocs: SavedPdfDocument[] = [];

  if (pdfServerAvailable) {
    try {
      const res = await fetch('/api/pdfs');
      if (res.status === 404 || res.status === 405) {
        pdfServerAvailable = false;
      } else if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.pdfs)) {
          serverDocs = data.pdfs;
        }
      }
    } catch {
      // Server unreachable, rely on cloudDocs + localDocs
    }
  }

  // Ensure any localDoc without a cdnUrl gets uploaded to the Global CDN so other countries/IPs can open it
  let updatedLocalCdn = false;
  for (const localDoc of localDocs) {
    if (!localDoc.cdnUrl && localDoc.dataUrl) {
      const uploadedUrl = await uploadJsonToGlobalCdn({
        id: localDoc.id,
        name: localDoc.name,
        dataUrl: localDoc.dataUrl,
      });
      if (uploadedUrl) {
        localDoc.cdnUrl = uploadedUrl;
        await putLocalPdf(localDoc);
        updatedLocalCdn = true;
      }
    }
  }

  // Merge cloudDocs, serverDocs, and localDocs
  const mergedMap = new Map<string, SavedPdfDocument>();
  for (const cDoc of cloudDocs) {
    if (cDoc && cDoc.id) mergedMap.set(cDoc.id, cDoc);
  }
  for (const sDoc of serverDocs) {
    if (sDoc && sDoc.id) {
      const existing = mergedMap.get(sDoc.id);
      mergedMap.set(sDoc.id, { ...existing, ...sDoc, cdnUrl: sDoc.cdnUrl || existing?.cdnUrl });
    }
  }
  for (const lDoc of localDocs) {
    if (lDoc && lDoc.id) {
      const existing = mergedMap.get(lDoc.id);
      mergedMap.set(lDoc.id, {
        ...existing,
        ...lDoc,
        cdnUrl: lDoc.cdnUrl || existing?.cdnUrl,
        dataUrl: lDoc.dataUrl,
      });
    }
  }

  const finalList = Array.from(mergedMap.values()).sort(
    (a, b) => (a.slotIndex ?? 999) - (b.slotIndex ?? 999) || b.uploadedAt - a.uploadedAt
  );

  if (updatedLocalCdn || (localDocs.length > 0 && cloudDocs.length === 0)) {
    const publicMeta = finalList.map(({ dataUrl, ...meta }) => meta);
    saveToGlobalCloudStore('pdfs', publicMeta).catch(() => {});
  }

  return finalList;
}

/**
 * Uploads and saves 1, 10, or any number of PDF files sequentially when the user clicks "Guardar".
 * Replicates to IndexedDB, Global Cloud CDN (Bytebin), Global MQTT Clusters, and Express backend.
 */
export async function uploadAndSavePdfBatch(
  pendingItems: PendingPdfUpload[],
  onProgress?: (savedCount: number, totalCount: number, currentFileName: string) => void
): Promise<{ ok: boolean; savedDocs: SavedPdfDocument[]; error?: string }> {
  if (!pendingItems || pendingItems.length === 0) {
    return { ok: false, savedDocs: [], error: 'No hay archivos seleccionados para guardar.' };
  }

  const savedDocs: SavedPdfDocument[] = [];
  const total = pendingItems.length;

  for (let i = 0; i < total; i++) {
    const item = pendingItems[i];
    if (onProgress) {
      onProgress(i + 1, total, item.name);
    }

    try {
      const dataUrl = item.dataUrl || (await readFileAsDataUrl(item.file));
      const cleanName = item.name.trim().toLowerCase().endsWith('.pdf')
        ? item.name.trim()
        : `${item.name.trim()}.pdf`;

      const docId = `pdf-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;
      const uploadedAt = Date.now();

      // 1. Upload PDF binary payload to Global Cloud CDN so any country/IP on Vercel can open & download it
      const cdnUrl =
        (await uploadJsonToGlobalCdn({
          id: docId,
          name: cleanName,
          dataUrl,
        })) || undefined;

      const newDoc: SavedPdfDocument = {
        id: docId,
        name: cleanName,
        size: item.size || item.file.size,
        uploadedAt,
        category: item.category || 'General',
        description: item.description || '',
        slotIndex: item.slotIndex,
        cdnUrl,
        dataUrl,
      };

      // 2. Save locally in IndexedDB
      await putLocalPdf(newDoc);

      // 3. Also upload to Express server if available
      if (pdfServerAvailable) {
        try {
          const res = await fetch('/api/pdfs/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              files: [
                {
                  id: newDoc.id,
                  name: newDoc.name,
                  size: newDoc.size,
                  uploadedAt: newDoc.uploadedAt,
                  category: newDoc.category,
                  description: newDoc.description,
                  slotIndex: newDoc.slotIndex,
                  cdnUrl: newDoc.cdnUrl,
                  dataUrl: newDoc.dataUrl,
                },
              ],
            }),
          });
          if (res.status === 404 || res.status === 405) {
            pdfServerAvailable = false;
          }
        } catch {
          // Handled by Global Cloud Store
        }
      }

      savedDocs.push(newDoc);
    } catch (err: any) {
      console.error('Error processing PDF file:', item.name, err);
    }
  }

  if (savedDocs.length === 0) {
    return {
      ok: false,
      savedDocs: [],
      error: 'No se pudieron procesar los archivos seleccionados. Verifica que sean archivos PDF válidos.',
    };
  }

  // 4. Replicate full updated PDF catalog list to Global Cloud Store
  const allMerged = await fetchAndSyncSavedPdfs();
  const publicMeta = allMerged.map(({ dataUrl, ...meta }) => meta);
  try {
    localStorage.setItem(LOCAL_PDF_META_KEY, JSON.stringify(publicMeta));
  } catch {
    // ignore
  }
  await saveToGlobalCloudStore('pdfs', publicMeta);

  return {
    ok: true,
    savedDocs,
  };
}

export async function removeSavedPdf(id: string): Promise<SavedPdfDocument[]> {
  await deleteLocalPdf(id);
  const currentCloud = getCachedCloudPdfMeta().filter((d) => d.id !== id);
  try {
    localStorage.setItem(LOCAL_PDF_META_KEY, JSON.stringify(currentCloud));
  } catch {
    // ignore
  }
  await saveToGlobalCloudStore('pdfs', currentCloud);

  if (pdfServerAvailable) {
    try {
      await fetch(`/api/pdfs/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore
    }
  }
  return await fetchAndSyncSavedPdfs();
}

export async function clearAllSavedPdfs(): Promise<void> {
  await clearAllLocalPdfs();
  try {
    localStorage.removeItem(LOCAL_PDF_META_KEY);
  } catch {
    // ignore
  }
  await saveToGlobalCloudStore('pdfs', []);

  if (pdfServerAvailable) {
    try {
      await fetch('/api/pdfs', {
        method: 'DELETE',
      });
    } catch {
      // ignore
    }
  }
}

async function resolvePdfDataUrl(doc: SavedPdfDocument): Promise<string | null> {
  const local = doc.dataUrl ? doc : await getLocalPdfById(doc.id);
  if (local?.dataUrl) {
    return local.dataUrl;
  }
  if (doc.cdnUrl) {
    const cloudPayload = await fetchJsonFromGlobalCdn(doc.cdnUrl);
    if (cloudPayload && typeof cloudPayload.dataUrl === 'string') {
      // Cache in local IndexedDB for instant subsequent opens
      await putLocalPdf({ ...doc, dataUrl: cloudPayload.dataUrl });
      return cloudPayload.dataUrl;
    }
  }
  return null;
}

export async function getPdfBlobUrl(doc: SavedPdfDocument): Promise<string> {
  const dataUrl = await resolvePdfDataUrl(doc);
  if (dataUrl) {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    } catch {
      return dataUrl;
    }
  }
  return `/api/pdfs/${encodeURIComponent(doc.id)}/file`;
}

export async function downloadSavedPdf(doc: SavedPdfDocument): Promise<void> {
  const dataUrl = await resolvePdfDataUrl(doc);
  if (dataUrl) {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = doc.name.toLowerCase().endsWith('.pdf') ? doc.name : `${doc.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      return;
    } catch {
      // Fallback below
    }
  }

  const a = document.createElement('a');
  a.href = `/api/pdfs/${encodeURIComponent(doc.id)}/file?download=1`;
  a.download = doc.name.toLowerCase().endsWith('.pdf') ? doc.name : `${doc.name}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
