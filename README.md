# Nikodemus


Eine Mobile-First PWA für Bibelstudium, basierend auf Next.js 14, TypeScript und TailwindCSS.

## Voraussetzungen

- Node.js 18+
- npm

## Starten der App

### 1. Entwicklung (Development Mode)
Für die aktive Entwicklung (UI/Logic). PWA-Features (Service Worker) sind hier standardmäßig **deaktiviert**.

```bash
npm run dev
# Öffne http://localhost:3000
```

### 2. PWA Test (Production Mode)
Um die Installation, den Offline-Modus und Service Worker zu testen.

```bash
npm run build
npm start
# Öffne http://localhost:3000
```

> **Hinweis:** Der "App installieren" Button erscheint nur in unterstützten Browsern (Chrome/Edge/Safari iOS) und wenn die App noch nicht installiert ist. In Chrome DevTools kann das `beforeinstallprompt` Event auch simuliert werden.

## Projektstruktur

- `/src/app`: Pages & Layouts (App Router)
- `/src/components`: UI Komponenten (`TwilwindCSS`)
- `/public`: Statische Assets & Manifest
- `/lib`: Helper (z.B. PocketBase Client)

## Deployment

Das Projekt enthält ein `Dockerfile` für das Deployment (z.B. via Coolify / Hetzner Cloud).

```bash
docker build -t nik-app .
docker run -p 3000:3000 nik-app
```
