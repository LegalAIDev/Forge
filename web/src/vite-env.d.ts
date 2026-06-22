/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin for API calls (no trailing /api). Empty → same-origin. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
