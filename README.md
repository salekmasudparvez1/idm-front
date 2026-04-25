# Frontend (React + Vite + TypeScript)

## Run

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Environment

Set the backend base URL when needed:

```bash
VITE_API_BASE=http://localhost:8000
```

## Behavior

- The UI analyzes a pasted URL, shows normalized metadata, groups formats by media type, and streams or downloads only through the backend.
- TanStack Query caches analysis and job polling data.
- The download action uses backend streaming and local browser progress tracking.
