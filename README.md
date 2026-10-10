# DevPulse

**GitHub Repository Intelligence Dashboard**

DevPulse is a full-stack dashboard that lets you paste any public GitHub repository URL
and immediately see a concise intelligence snapshot: stars, forks, open issues, primary
language, a language breakdown chart, recent commits, and top contributors. Analyses you
run are saved locally in a SQLite database so you can revisit them later.

Built with **React + Vite + TypeScript** on the frontend and **Node.js + Express +
TypeScript** on the backend, using **SQLite** for history and the **public GitHub REST
API** for repository data.

## What it does

- Search any public GitHub repository by URL.
- View a repository overview: name, description, avatar, stars, forks, open issues, and
  creation date.
- See a doughnut chart and legend of the repository's language breakdown.
- Read the 10 most recent commits.
- See the top 10 contributors by commit count.
- Save every successful analysis to a local SQLite database.
- Browse and reload saved analyses from a history panel.
- Delete history entries you no longer want.

## What it does not do (yet)

- Private repositories or GitHub authentication.
- AI-powered insights, code quality scoring, or recommendations. DevPulse is a data
  dashboard, not an AI tool.
- User accounts or multi-user isolation.
- Pagination beyond the first 10 commits or 10 contributors.
- Production deployment scripts (those can be added later).

## Project structure

```
devpulse/
├── README.md
├── .gitignore                 (root-level ignores for convenience)
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── index.html
│   ├── .gitignore
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── vite-env.d.ts
│       ├── api/
│       │   └── client.ts
│       ├── components/
│       │   ├── SearchForm.tsx
│       │   ├── RepoOverview.tsx
│       │   ├── LanguageChart.tsx
│       │   ├── CommitsList.tsx
│       │   ├── ContributorsList.tsx
│       │   └── HistoryPanel.tsx
│       ├── hooks/
│       │   └── useToast.ts
│       ├── types/
│       │   └── index.ts
│       └── utils/
│           └── commitUtils.ts
└── backend/
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    ├── .gitignore
    └── src/
        ├── index.ts
        ├── app.ts                (Express app factory; used by index.ts and tests)
        ├── app.test.ts
        ├── config/
        │   └── index.ts
        ├── types/
        │   ├── index.ts
        │   └── sql.js.d.ts
        ├── routes/
        │   ├── search.ts
        │   └── history.ts
        ├── services/
        │   ├── github.ts
        │   ├── database.ts
        │   └── database.test.ts
        └── middleware/
            ├── validation.ts
            └── errorHandler.ts
```

## Prerequisites

- [Node.js](https://nodejs.org/) LTS release (v18 or newer).
- npm (ships with Node.js).
- A network connection so the backend can reach `api.github.com`.

No database server, no API key, and no paid services are required for the initial version.

## Setup on Windows

These instructions work in PowerShell, Command Prompt, or Git Bash.

### 1. Install Node.js

Download the LTS installer from [nodejs.org](https://nodejs.org) and run it.
A system restart may be requested. After installing, verify from a new terminal:

```powershell
node -v
npm -v
```

Both commands should print version numbers without error.

### 2. Open the project folder

In PowerShell or Command Prompt, change to the project root, which contains the
`frontend` and `backend` folders:

```powershell
cd path\to\devpulse
```

### 3. Install backend dependencies

```powershell
cd backend
npm install
```

If you see a warning about optional dependencies that is fine for the initial version.
The backend uses `sql.js`, a pure-JavaScript SQLite build, so no C++ build tools are
required on Windows.

### 4. Install frontend dependencies

```powershell
cd ..\frontend
npm install
```

### 5. Start the backend

Open a terminal and run from the `backend` folder:

```powershell
cd backend
npm run dev
```

You should see a message like:

```
[backend] DevPulse backend running at http://127.0.0.1:3001
[backend] Environment: development
[backend] No GITHUB_TOKEN set — using unauthenticated API (60 req/hr limit).
```

The backend stays running in this terminal. Keep it open.

By default the backend binds to `127.0.0.1:3001`. If port 3001 is already in use, set
a different port in a local `.env` file:

```
PORT=3010
```

The frontend is configured to proxy `/api` requests to the backend, so you normally do
not need to change the frontend when you change the backend port.

### 6. Start the frontend

Open a second terminal and run from the `frontend` folder:

```powershell
cd frontend
npm run dev
```

Vite will print a local URL, usually `http://127.0.0.1:5173`. Open that URL in your
browser.

### 7. Use the dashboard

1. Paste a public GitHub repository URL into the search box, for example:
   `https://github.com/vercel/next.js`
2. Click **Analyze**.
3. The dashboard shows the repository overview, language breakdown, recent commits, and
   top contributors.
4. Every successful analysis is saved automatically. Open the **Saved history** panel to
   reload a previous analysis or remove it.

## Optional: raise the GitHub API rate limit

Without a token, GitHub allows 60 requests per hour per IP address for unauthenticated
requests. A single dashboard view can make several API calls, so heavy use of the same
IP may hit the limit.

If you have a GitHub personal access token, you can give the backend a higher limit
(5,000 requests per hour):

1. Create a fine-grained or classic personal access token with **no special scopes**
   required for public repository metadata. Public repo metadata is accessible without
   extra scopes.
2. In the `backend` folder, copy `.env.example` to `.env` and add the token:

```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

The backend automatically picks up `.env` on startup. The token is never exposed to the
browser; it is only used server-side.

## API

### `POST /api/search`

Request body:

```json
{
  "repoUrl": "https://github.com/vercel/next.js"
}
```

Successful response:

```json
{
  "repo": {
    "id": 12345,
    "url": "https://github.com/vercel/next.js",
    "name": "vercel/next.js",
    "title": "vercel/next.js",
    "description": "...",
    "language": "JavaScript",
    "stars": 123456,
    "forks": 23456,
    "openIssues": 123,
    "avatarUrl": "https://avatars.githubusercontent.com/...",
    "htmlUrl": "https://github.com/vercel/next.js",
    "createdAt": "2016-10-04T11:55:08Z",
    "updatedAt": "2026-10-09T12:00:00Z"
  },
  "languages": {
    "JavaScript": 95230,
    "TypeScript": 12000
  },
  "commits": [
    {
      "sha": "a1b2c3d",
      "message": "feat: add new feature",
      "author": "Jane Doe",
      "date": "2026-10-09T12:00:00Z",
      "url": "https://github.com/vercel/next.js/commit/a1b2c3d"
    }
  ],
  "contributors": [
    {
      "login": "author1",
      "avatarUrl": "https://avatars.githubusercontent.com/...",
      "contributions": 340
    }
  ],
  "cached": false
}
```

### `GET /api/history`

Returns the saved analysis history, most recent first.

### `DELETE /api/history/:id`

Removes a history entry by id.

### Error responses

All error responses use a JSON body with an `error` field:

```json
{ "error": "Human-readable message" }
```

Common status codes:

- `400` — invalid repository URL.
- `404` — repository not found on GitHub.
- `429` — GitHub API rate limit reached.
- `500` — server error.

## Design notes

### Security

- The backend validates repository URLs with [Zod](https://zod.dev/) before calling
  GitHub. Only URLs matching the public `github.com/owner/repo` pattern are accepted.
- GitHub credentials never reach the browser. All GitHub API calls happen server-side.
- The backend returns structured JSON errors, not stack traces, in production.
- The frontend calls the backend through a Vite proxy in development, so the browser
  never talks directly to GitHub.

### Rate limiting and caching

- The backend caches GitHub API responses in memory for 10 minutes. Asking about the
  same repository twice in that window does not call GitHub again.
- A protected `GITHUB_TOKEN` is optional. Without one, the app uses the public GitHub
  API and the 60 requests per hour limit applies per IP.

### Database

- The backend uses SQLite through `sql.js`, a WebAssembly build of SQLite. This keeps
  the project free of native dependencies and C++ tooling on Windows.
- The database file is created automatically at `backend/data/devpulse.db`. It is
  `.gitignore`d and does not ship in the repository.

### Frontend quality

- The UI shows loading skeletons while data is being fetched.
- Each panel has an empty state when there is no data to show.
- Validation errors, "not found" messages, and rate limit warnings are displayed
  clearly instead of failing silently.
- The layout is responsive: it reflows cleanly on narrow screens.

## Development commands

### Backend

From the `backend` folder:

```powershell
npm run dev      # start with hot reload via tsx
npm run build    # emit JavaScript into dist/
npm run start    # run the compiled backend
npm run test     # run the backend test suite (node --test via tsx)
npm run typecheck
```

### Backend tests

The backend ships a hermetic test suite built on Node's built-in test runner:

- HTTP route tests for health, search-input validation, history retrieval, and
  history deletion error paths.
- A regression guard that an error thrown inside an async route handler returns a
  structured response instead of crashing the process.
- SQLite service roundtrip tests (save, upsert, list, delete) that run against a
  throwaway database file so the dev database is never touched by tests.

Run it with:

```powershell
cd backend
npm test
```

No network access and no GitHub token are required for the tests.

### Frontend

From the `frontend` folder:

```powershell
npm run dev      # start Vite dev server
npm run build    # build production bundle into dist/
npm run preview  # preview the production build locally
npm run typecheck
```

## Known limitations

- The initial version is designed for local development on a single machine. It assumes
  the backend is reachable at `127.0.0.1:3001` and the frontend at
  `127.0.0.1:5173`.
- The in-memory cache is lost when the backend restarts. That is intentional for v1:
  simplicity over durability.
- Only the first 10 commits and 10 contributors are fetched for each repository.
- The database is a single file; concurrent writes are serialized by the single backend
  process.

## Future ideas

- Optional GitHub App or OAuth flow for private repositories.
- Repository comparison view.
- Paginated commits and contributors.
- Export history to JSON or CSV.
- Frontend component tests for the search form and dashboard panels.
- Deployable production packaging notes.

## License

This project is a portfolio demonstration. Add an explicit license file if you plan to
publish or share it.
