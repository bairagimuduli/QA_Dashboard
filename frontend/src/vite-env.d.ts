/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** DarkKnight Control API base, e.g. http://localhost:8080. In dev, omit to use Vite /dark-knight proxy. */
  readonly VITE_DARKKNIGHT_API_BASE?: string;
  /** If set, sent as X-API-Key on /jobs (when DarkKnight has API_KEY set). */
  readonly VITE_DARKKNIGHT_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
