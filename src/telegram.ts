export interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: { user?: { first_name?: string; username?: string }; start_param?: string };
  colorScheme: "light" | "dark";
  platform: string;
  isExpanded: boolean;
  ready(): void;
  expand(): void;
  onEvent(event: "themeChanged" | "viewportChanged", handler: () => void): void;
  HapticFeedback?: { impactOccurred(style: "light" | "medium"): void };
  MainButton?: {
    setText(text: string): void;
    show(): void;
    hide(): void;
    onClick(handler: () => void): void;
  };
}

declare global {
  interface Window { Telegram?: { WebApp: TelegramWebApp } }
}

export function telegram(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function bootTelegram(): TelegramWebApp | null {
  const app = telegram();
  if (!app) return null;
  app.ready();
  if (!app.isExpanded) app.expand();
  document.documentElement.dataset.platform = app.platform;
  return app;
}
