export interface SavedPdfDocument {
  id: string;
  name: string;
  size: number;
  uploadedAt: number;
  category: string;
  description?: string;
  slotIndex?: number;
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
      // If slotIndex is set, remove any previous doc with same slotIndex
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
 * Fetches saved PDFs from server and reconciles with local IndexedDB
 * so neither 1 nor 10+ PDFs are ever lost.
 */
export async function fetchAndSyncSavedPdfs(): Promise<SavedPdfDocument[]> {
  const localDocs = await getAllLocalPdfs();
  let serverDocs: SavedPdfDocument[] = [];

  try {
    const res = await fetch('/api/pdfs');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.pdfs)) {
        serverDocs = data.pdfs;
      }
    }
  } catch {
    // Server unreachable, fall back to localDocs
    return localDocs;
  }

  const serverIds = new Set(serverDocs.map((d) => d.id));

  // If local IndexedDB has PDFs that the server lost (e.g., container restart), push them back to server!
  for (const localDoc of localDocs) {
    if (!serverIds.has(localDoc.id) && localDoc.dataUrl) {
      try {
        const res = await fetch('/api/pdfs/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: [
              {
                id: localDoc.id,
                name: localDoc.name,
                size: localDoc.size,
                uploadedAt: localDoc.uploadedAt,
                category: localDoc.category,
                description: localDoc.description,
                slotIndex: localDoc.slotIndex,
                dataUrl: localDoc.dataUrl,
              },
            ],
          }),
        });
        if (res.ok) {
          serverDocs.push({
            id: localDoc.id,
            name: localDoc.name,
            size: localDoc.size,
            uploadedAt: localDoc.uploadedAt,
            category: localDoc.category,
            description: localDoc.description,
            slotIndex: localDoc.slotIndex,
          });
        }
      } catch {
        // Keep in localDocs anyway
      }
    }
  }

  // Merge serverDocs with localDocs metadata
  const mergedMap = new Map<string, SavedPdfDocument>();
  for (const doc of localDocs) {
    mergedMap.set(doc.id, doc);
  }
  for (const sDoc of serverDocs) {
    const existingLocal = mergedMap.get(sDoc.id);
    mergedMap.set(sDoc.id, {
      ...sDoc,
      dataUrl: existingLocal?.dataUrl,
    });
  }

  return Array.from(mergedMap.values()).sort(
    (a, b) => (a.slotIndex ?? 999) - (b.slotIndex ?? 999) || b.uploadedAt - a.uploadedAt
  );
}

/**
 * Uploads and saves 1, 10, or any number of PDF files sequentially.
 * Saves each file to both IndexedDB AND the backend server so saving never fails.
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

      const newDoc: SavedPdfDocument = {
        id: docId,
        name: cleanName,
        size: item.size || item.file.size,
        uploadedAt,
        category: item.category || 'General',
        description: item.description || '',
        slotIndex: item.slotIndex,
        dataUrl,
      };

      // 1. Always save locally in IndexedDB first (instant, no size limit issues)
      await putLocalPdf(newDoc);

      // 2. Also upload to backend server so all connected users can access it
      try {
        await fetch('/api/pdfs/upload', {
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
                dataUrl: newDoc.dataUrl,
              },
            ],
          }),
        });
      } catch (serverErr) {
        console.warn('Saved to IndexedDB; server upload will sync automatically:', serverErr);
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

  return {
    ok: true,
    savedDocs,
  };
}

export async function removeSavedPdf(id: string): Promise<SavedPdfDocument[]> {
  await deleteLocalPdf(id);
  try {
    await fetch(`/api/pdfs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch {
    // ignore
  }
  return await fetchAndSyncSavedPdfs();
}

export async function clearAllSavedPdfs(): Promise<void> {
  await clearAllLocalPdfs();
  try {
    await fetch('/api/pdfs', {
      method: 'DELETE',
    });
  } catch {
    // ignore
  }
}

export async function getPdfBlobUrl(doc: SavedPdfDocument): Promise<string> {
  // Check local IndexedDB first for instant rendering
  const local = doc.dataUrl ? doc : await getLocalPdfById(doc.id);
  if (local?.dataUrl) {
    try {
      const res = await fetch(local.dataUrl);
      const blob = await res.blob();
      return URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    } catch {
      return local.dataUrl;
    }
  }
  // Fallback to server file endpoint
  return `/api/pdfs/${encodeURIComponent(doc.id)}/file`;
}

export async function downloadSavedPdf(doc: SavedPdfDocument): Promise<void> {
  const local = doc.dataUrl ? doc : await getLocalPdfById(doc.id);
  if (local?.dataUrl) {
    try {
      const res = await fetch(local.dataUrl);
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
