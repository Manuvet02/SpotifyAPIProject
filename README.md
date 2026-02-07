# SpotifyAPI (Local dev)

This repository contains a simple frontend (Vite + React) and a minimal Express server for handling Spotify OAuth and proxying requests.

Quick start (development)

1. Server

```powershell
cd server
npm install
# Start the server (uses ES modules)
npm start
```

The server listens on port 3000 by default and will automatically open the frontend URL (`FRONTEND_URI`) in your default browser when started in development (i.e. when `NODE_ENV` is not `production`).

2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend expects the server base API URL to be set in `frontend/.env` as:

```
VITE_API_URL=http://localhost:3000/api
VITE_FRONTEND_URL=http://localhost:5173
```

3. Environment variables (server)

Create `server/.env` with the following values (example):

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
REDIRECT_URI=http://127.0.0.1:3000/api/callback
FRONTEND_URI=http://127.0.0.1:5173
```

Make sure the `REDIRECT_URI` above matches the Redirect URI registered in your Spotify Developer Dashboard.

Security notes

- Do not commit secrets. Add `server/.env` to `.gitignore`.
- Tokens are stored in httpOnly cookies by the server in this app; the frontend never sees raw tokens directly.

If you want me to add a start script that launches both server and frontend together (with one command), I can add that next.
