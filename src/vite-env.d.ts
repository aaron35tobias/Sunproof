/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPERVISOR_USERNAME?: string;
  /** SHA-256 hex of the supervisor password. Generate with: npm run hash-password -- "password" */
  readonly VITE_SUPERVISOR_PASSWORD_HASH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
