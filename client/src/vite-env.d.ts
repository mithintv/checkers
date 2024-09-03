/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_HOSTNAME: string;
	// more env variables...
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
