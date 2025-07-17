// Cloudflare Turnstile için global tip tanımları
interface Window {
  turnstile?: {
    render: (container: string | HTMLElement, options: any) => string;
    reset: (widgetId: string) => void;
    remove: (widgetId: string) => void;
    getResponse: (widgetId: string) => string | undefined;
    execute: (widgetId: string | undefined) => void;
  }
} 