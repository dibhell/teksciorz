# Rytmika Tekstu (Vite + React + TS + Tailwind)

## Szybki start (bez niczego lokalnie)
1. Wrzuć ten ZIP do nowego repo na GitHubie i rozpakuj online (Upload files).
2. W repo włącz Pages: **Settings → Pages → Build & deployment → Source: GitHub Actions**.
3. Push tworzy build i deploy automatycznie (workflow poniżej).

## Lokalnie (opcjonalnie)
```bash
npm i
npm run dev
```

## Vite base
Plik `vite.config.ts` ma `base: "./"`, więc działa na GitHub Pages bez znajomości nazwy repo.
