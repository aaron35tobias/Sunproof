import type { HazardReport, ReportStatus } from '@/types';
const NAME = 'fieldguard_db';
let opening: Promise<IDBDatabase> | null = null;
export function initDB(): Promise<IDBDatabase> {
  if (opening) return opening;
  opening = new Promise((resolve, reject) => {
    const request = indexedDB.open(NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('reports')) db.createObjectStore('reports', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos');
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); opening = null; };
      resolve(db);
    };
    request.onerror = () => { opening = null; reject(request.error); };
    request.onblocked = () => { opening = null; reject(new Error('Close other FIELDGUARD tabs and retry.')); };
  });
  return opening;
}
function transact<T>(store: string, mode: IDBTransactionMode, action: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return initDB().then(db => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = action(tx.objectStore(store));
    let result: T;
    req.onsuccess = () => { result = req.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error || req.error);
    tx.onabort = () => reject(tx.error || new Error('Local storage transaction failed.'));
  }));
}
export async function saveReportLocal(report: HazardReport): Promise<void> {
  await transact('reports', 'readwrite', s => s.put({ ...report, status: 'PENDING' }));
}
export function getLocalReports(): Promise<HazardReport[]> {
  return transact<HazardReport[]>('reports', 'readonly', s => s.getAll());
}
export async function updateReportStatus(id: string, status: ReportStatus): Promise<void> {
  const db = await initDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('reports', 'readwrite');
    const store = tx.objectStore('reports');
    const req = store.get(id);
    req.onsuccess = () => { if (req.result) store.put({ ...req.result, status }); };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export async function clearSyncedReports(): Promise<void> {
  const db = await initDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['reports', 'photos'], 'readwrite');
    const reports = tx.objectStore('reports');
    const photos = tx.objectStore('photos');
    const cursor = reports.openCursor();
    cursor.onsuccess = () => {
      const item = cursor.result;
      if (item) {
        if (item.value.status === 'SYNCHRONIZED') {
          reports.delete(item.primaryKey);
          photos.delete(item.primaryKey);
        }
        item.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export async function savePhoto(id: string, photo: Blob): Promise<void> { await transact('photos', 'readwrite', s => s.put(photo, id)); }
export function getPhoto(id: string): Promise<Blob | undefined> { return transact<Blob | undefined>('photos', 'readonly', s => s.get(id)); }
