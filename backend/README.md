# Backend Boilerplate (Node + Express + MongoDB + TypeScript)

## Quick start
1. Copy this folder into `backend/` at your project root.
2. Create `.env` from `.env.example` and set values (MONGO_URI, JWT_SECRET, GEMINI_API_KEY).
3. Install dependencies:

```bash
npm install
```

4. Run development server:

```bash
npm run dev
```

Server will run on `http://localhost:5000` by default.

## Notes
- Replace placeholder Gemini URLs in `src/services/geminiProxy.ts` with the actual Gemini API endpoints.
- Keep secrets only in `.env`.
- For production, use HTTPS and secure JWT secret.
