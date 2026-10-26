// ============================================================================
// GOOGLE DRIVE API v3 + NEON / TURSO GLOBAL EDGE SYNC INTEGRATION
// Uses official Firebase Auth + Google OAuth2 (drive.file scope)
// Strictly caches OAuth access tokens in memory only (never localStorage).
// ============================================================================

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
];

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
SCOPES.forEach((scope) => googleProvider.addScope(scope));

// In-memory cache for the Google OAuth access token (never persisted to storage)
let cachedAccessToken: string | null = null;

export const DRIVE_SYNC_FILENAME = 'monetizatucanal_drive_neon_turso_sync.json';

export interface DriveFileMetadata {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface DriveSyncStatus {
  connected: boolean;
  userEmail: string | null;
  userName: string | null;
  userPhoto: string | null;
  hasValidToken: boolean;
  lastSyncedAt: number | null;
  driveFileId: string | null;
  driveWebViewLink: string | null;
  neonTursoStatus: 'active-replicated' | 'syncing' | 'standby';
}

type AuthStateListener = (user: User | null, hasToken: boolean) => void;
const authListeners = new Set<AuthStateListener>();

export function initAuth(callback: AuthStateListener): () => void {
  authListeners.add(callback);
  const unsub = onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
    }
    callback(user, !!cachedAccessToken);
  });
  return () => {
    authListeners.delete(callback);
    unsub();
  };
}

function notifyAuthListeners() {
  const user = auth.currentUser;
  authListeners.forEach((cb) => {
    try {
      cb(user, !!cachedAccessToken);
    } catch {
      // ignore
    }
  });
}

export async function login(): Promise<{ user: User; accessToken: string }> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;

  if (!accessToken) {
    throw new Error('No se recibió el token de acceso de Google Drive.');
  }

  cachedAccessToken = accessToken;
  notifyAuthListeners();
  return { user: result.user, accessToken };
}

export async function getAccessToken(): Promise<string> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  const { accessToken } = await login();
  return accessToken;
}

export function hasInMemoryAccessToken(): boolean {
  return Boolean(cachedAccessToken);
}

export async function logout(): Promise<void> {
  cachedAccessToken = null;
  await signOut(auth);
  notifyAuthListeners();
}

// ============================================================================
// Google Drive API v3 Calls
// ============================================================================

export async function findDriveCatalogFile(
  explicitToken?: string
): Promise<DriveFileMetadata | null> {
  const token = explicitToken || (await getAccessToken());
  const query = encodeURIComponent(
    `name = '${DRIVE_SYNC_FILENAME}' and trashed = false`
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=5&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    cachedAccessToken = null;
    notifyAuthListeners();
    throw new Error('Tu sesión de Google Drive expiró. Vuelve a conectar Google Drive.');
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error al buscar archivo en Google Drive: ${errText}`);
  }

  const data = await response.json();
  if (data.files && Array.isArray(data.files) && data.files.length > 0) {
    return data.files[0] as DriveFileMetadata;
  }
  return null;
}

/**
 * Creates a NEW file in Google Drive (non-destructive creation).
 */
export async function createDriveCatalogFile(
  payload: any,
  explicitToken?: string
): Promise<DriveFileMetadata> {
  const token = explicitToken || (await getAccessToken());

  const metadata = {
    name: DRIVE_SYNC_FILENAME,
    mimeType: 'application/json',
    description:
      'Base de datos sincronizada de Monetiza Tu Canal (Productos, Imágenes, Precios USD y Pedidos) con replicación Neon/Turso Global Edge.',
  };

  const fileContent = JSON.stringify(payload, null, 2);
  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (response.status === 401) {
    cachedAccessToken = null;
    notifyAuthListeners();
    throw new Error('Tu sesión de Google Drive expiró. Vuelve a conectar Google Drive.');
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error al crear archivo en Google Drive: ${errText}`);
  }

  const created = (await response.json()) as DriveFileMetadata;
  return created;
}

/**
 * Updates/overwrites an EXISTING file in Google Drive.
 * Callers must obtain explicit user confirmation before invoking this mutating action.
 */
export async function overwriteDriveCatalogFile(
  fileId: string,
  payload: any,
  explicitToken?: string
): Promise<DriveFileMetadata> {
  const token = explicitToken || (await getAccessToken());

  const metadata = {
    name: DRIVE_SYNC_FILENAME,
    mimeType: 'application/json',
  };

  const fileContent = JSON.stringify(payload, null, 2);
  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(
      fileId
    )}?uploadType=multipart&fields=id,name,modifiedTime,webViewLink`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (response.status === 401) {
    cachedAccessToken = null;
    notifyAuthListeners();
    throw new Error('Tu sesión de Google Drive expiró. Vuelve a conectar Google Drive.');
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error al actualizar archivo en Google Drive: ${errText}`);
  }

  return (await response.json()) as DriveFileMetadata;
}

/**
 * Uploads an individual product/catalog image file to the user's Google Drive
 * so all product images are also stored as image files in their Drive.
 */
export async function uploadImageDataUrlToGoogleDrive(
  imageName: string,
  dataUrl: string,
  explicitToken?: string
): Promise<DriveFileMetadata | null> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return null;
  }
  const token = explicitToken || (await getAccessToken());

  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;

  const mimeType = match[1];
  const base64Data = match[2];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const imageBlob = new Blob([byteArray], { type: mimeType });

  const ext = mimeType.split('/')[1] || 'webp';
  const safeName = imageName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);

  const metadata = {
    name: `monetiza_img_${safeName}_${Date.now()}.${ext}`,
    mimeType,
    description: `Imagen de producto/catálogo guardada desde Monetiza Tu Canal (${imageName})`,
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', imageBlob);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    return null;
  }
  return (await response.json()) as DriveFileMetadata;
}

/**
 * Reads the JSON catalog configuration stored in a Google Drive file.
 */
export async function readDriveCatalogFile(
  fileId: string,
  explicitToken?: string
): Promise<any> {
  const token = explicitToken || (await getAccessToken());

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      fileId
    )}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 401) {
    cachedAccessToken = null;
    notifyAuthListeners();
    throw new Error('Tu sesión de Google Drive expiró. Vuelve a conectar Google Drive.');
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error al leer archivo desde Google Drive: ${errText}`);
  }

  return await response.json();
}

/**
 * Deletes a file in Google Drive.
 * Callers must obtain explicit user confirmation before invoking this destructive action.
 */
export async function deleteDriveCatalogFile(
  fileId: string,
  explicitToken?: string
): Promise<void> {
  const token = explicitToken || (await getAccessToken());

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 401) {
    cachedAccessToken = null;
    notifyAuthListeners();
    throw new Error('Tu sesión de Google Drive expiró. Vuelve a conectar Google Drive.');
  }

  if (!response.ok && response.status !== 204) {
    const errText = await response.text();
    throw new Error(`Error al eliminar archivo de Google Drive: ${errText}`);
  }
}
