// Stand-in for the Base44 SDK so FIELDGUARD runs outside the Base44 platform.
// It mirrors the calls the app uses (entities.*.list/filter/create/update and
// integrations.Core.UploadPublicFile) and stores records in localStorage, with
// simulated latency and failure when the browser is offline. Swap this file for
// a real backend (e.g. Firebase Firestore + Storage) without touching the app.

type Row = Record<string, any>;

const KEY = 'fieldguard_server_v1';
const LATENCY_MS = 350;

function load(): Record<string, Row[]> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

function save(db: Record<string, Row[]>) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

async function network<T>(work: () => T): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, LATENCY_MS));
  if (!navigator.onLine) throw new Error('Network unavailable.');
  return work();
}

function sortRows(rows: Row[], sort?: string): Row[] {
  if (!sort) return rows;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const order = String(a[field] ?? '').localeCompare(String(b[field] ?? ''));
    return desc ? -order : order;
  });
}

function entity(name: string) {
  return {
    list: (sort?: string, limit = 50): Promise<any[]> =>
      network(() => sortRows(load()[name] ?? [], sort).slice(0, limit)),
    filter: (query: Row, sort?: string, limit = 50): Promise<any[]> =>
      network(() => sortRows((load()[name] ?? []).filter(r => Object.entries(query).every(([k, v]) => r[k] === v)), sort).slice(0, limit)),
    create: (data: Row): Promise<any> =>
      network(() => {
        const db = load();
        const now = new Date().toISOString();
        const row = { ...data, id: crypto.randomUUID(), created_date: now, updated_date: now };
        db[name] = [...(db[name] ?? []), row];
        save(db);
        return row;
      }),
    update: (id: string, patch: Row): Promise<any> =>
      network(() => {
        const db = load();
        const rows = db[name] ?? [];
        const index = rows.findIndex(r => r.id === id);
        if (index < 0) throw new Error(`${name} ${id} not found.`);
        rows[index] = { ...rows[index], ...patch, updated_date: new Date().toISOString() };
        db[name] = rows;
        save(db);
        return rows[index];
      }),
  };
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const base44 = {
  entities: {
    SafetyReport: entity('SafetyReport'),
    SafetyInspection: entity('SafetyInspection'),
    InspectionTemplate: entity('InspectionTemplate'),
  },
  integrations: {
    Core: {
      UploadPublicFile: async ({ file }: { file: Blob }): Promise<{ file_url: string }> => {
        const fileUrl = await readAsDataUrl(file);
        return network(() => ({ file_url: fileUrl }));
      },
    },
  },
};

/** Calls `listener` when another open tab changes server data (e.g. worker tab → supervisor tab). */
export function onRemoteChange(listener: () => void): () => void {
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) listener(); };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
